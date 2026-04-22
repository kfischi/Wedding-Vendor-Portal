/**
 * Review request — vendor invites a past client to submit a review.
 * POST /api/reviews/request
 *
 * Protected: authenticated vendor session only.
 * Accepts free-form client info (name + email OR phone). Creates a
 * review_requests row with a unique token and sends it via email/WhatsApp.
 * Token grants auth-less access to /r/{token} for review submission.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Resend } from "resend";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { vendors, reviewRequests } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  NEXT_PUBLIC_APP_URL,
} from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";
import { generateReviewToken, reviewTokenExpiry } from "@/lib/reviews/token";
import { waSend, waIsReady } from "@/lib/whatsapp";

export const runtime = "nodejs";

const MAX_REQUESTS_PER_VENDOR_PER_DAY = 10;

const schema = z
  .object({
    clientName: z.string().min(2).max(80),
    clientEmail: z.string().email().optional(),
    clientPhone: z
      .string()
      .regex(/^0\d{8,9}$/, "Invalid Israeli phone format")
      .optional(),
    eventDate: z.string().optional(),
  })
  .refine((d) => d.clientEmail || d.clientPhone, {
    message: "Either clientEmail or clientPhone is required",
  });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  const { clientName, clientEmail, clientPhone, eventDate } = parsed.data;

  // Resolve current user → vendor
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, user.id))
    .limit(1);

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // Rate limit: max 10 review requests per vendor per rolling 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.vendorId, vendor.id),
        gte(reviewRequests.createdAt, since)
      )
    );

  if ((count?.n ?? 0) >= MAX_REQUESTS_PER_VENDOR_PER_DAY) {
    return NextResponse.json(
      { error: "Daily request limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  // Persist the request
  const token = generateReviewToken();
  const expiresAt = reviewTokenExpiry();
  const requestId = randomUUID();

  await db.insert(reviewRequests).values({
    id: requestId,
    vendorId: vendor.id,
    token,
    clientName,
    clientEmail: clientEmail ?? null,
    clientPhone: clientPhone ?? null,
    eventDate: eventDate ?? null,
    status: "sent",
    expiresAt,
  });

  const baseUrl = NEXT_PUBLIC_APP_URL;
  const reviewUrl = `${baseUrl}/r/${token}`;
  const safeName = escapeHtml(clientName);
  const safeVendorName = escapeHtml(vendor.businessName);

  const channels: string[] = [];

  // Email (best-effort, not awaited strictly)
  if (clientEmail && RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: RESEND_FROM_EMAIL || "WeddingPro <noreply@weddingpro.co.il>",
        to: clientEmail,
        subject: `נשמח לשמוע איך היה — ${vendor.businessName}`,
        html: renderEmail({
          clientName: safeName,
          vendorName: safeVendorName,
          reviewUrl: escapeHtml(reviewUrl),
        }),
      });
      channels.push("email");
    } catch (err) {
      console.error("[reviews/request] email error:", err);
    }
  }

  // WhatsApp (best-effort)
  if (clientPhone) {
    try {
      const ready = await waIsReady();
      if (ready) {
        const waText =
          `שלום ${clientName},\n\n` +
          `תודה שבחרתם ב־${vendor.businessName}.\n` +
          `נשמח אם תוכלו לחלוק את חווייתכם:\n\n` +
          `${reviewUrl}\n\n` +
          `הקישור תקף ל־30 יום.`;
        const result = await waSend(clientPhone, waText);
        if (result.ok) channels.push("whatsapp");
      }
    } catch (err) {
      console.error("[reviews/request] whatsapp error:", err);
    }
  }

  // Record which channel(s) succeeded
  if (channels.length > 0) {
    await db
      .update(reviewRequests)
      .set({ sentChannel: channels.join(",") })
      .where(eq(reviewRequests.id, requestId));
  }

  return NextResponse.json({
    ok: true,
    requestId,
    sentChannels: channels,
    linkPreview: reviewUrl,
  });
}

function renderEmail(args: {
  clientName: string;
  vendorName: string;
  reviewUrl: string;
}): string {
  return `<div dir="rtl" style="font-family:system-ui,-apple-system,Arial,sans-serif;line-height:1.6;max-width:520px;margin:0 auto;background:#FBF8F3;border:1px solid #E8DCC4;border-radius:8px;overflow:hidden">
  <div style="background:#1A1614;padding:24px;text-align:center">
    <p style="margin:0;font-size:20px;color:#B8935A;letter-spacing:0.1em">WeddingPro</p>
  </div>
  <div style="padding:32px;background:#FBF8F3">
    <h2 style="margin:0 0 12px;font-size:22px;color:#1A1614;font-weight:500">שלום ${args.clientName}</h2>
    <p style="margin:0 0 20px;color:#2C2724;font-size:15px">
      תודה שבחרתם ב-<strong>${args.vendorName}</strong> לאירוע שלכם.
      נשמח אם תוכלו לחלוק את חוויתכם עם זוגות אחרים.
    </p>
    <p style="margin:24px 0">
      <a href="${args.reviewUrl}"
         style="display:inline-block;padding:12px 28px;background:#1A1614;color:#FBF8F3;text-decoration:none;border-radius:6px;font-size:14px;letter-spacing:0.1em">
        כתיבת ביקורת
      </a>
    </p>
    <p style="color:#6B5F5A;font-size:12px;margin:24px 0 0">
      הקישור תקף ל-30 יום. אם התקבל בטעות, ניתן להתעלם.
    </p>
  </div>
</div>`;
}
