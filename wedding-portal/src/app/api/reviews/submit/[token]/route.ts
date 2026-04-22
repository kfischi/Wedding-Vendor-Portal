/**
 * Public review submission by token.
 *
 * GET  /api/reviews/submit/[token]   → validate token, return vendor context
 * POST /api/reviews/submit/[token]   → create review (unpublished), mark token used
 *
 * NO authentication required — token IS the auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Resend } from "resend";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { vendors, reviews, reviewRequests } from "@/lib/db/schema";
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  ADMIN_EMAIL,
  NEXT_PUBLIC_APP_URL,
} from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const IP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX_SUBMISSIONS_PER_IP_PER_HOUR = 5;

// ─── GET: validate token + return vendor context ─────────────────────────────

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const [request] = await db
    .select({
      id: reviewRequests.id,
      vendorId: reviewRequests.vendorId,
      status: reviewRequests.status,
      expiresAt: reviewRequests.expiresAt,
      clientName: reviewRequests.clientName,
    })
    .from(reviewRequests)
    .where(eq(reviewRequests.token, token))
    .limit(1);

  if (!request) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  if (request.status === "used") {
    return NextResponse.json(
      { valid: false, used: true },
      { status: 410 }
    );
  }

  if (request.expiresAt < new Date()) {
    return NextResponse.json(
      { valid: false, expired: true },
      { status: 410 }
    );
  }

  const [vendor] = await db
    .select({
      id: vendors.id,
      slug: vendors.slug,
      businessName: vendors.businessName,
      coverImage: vendors.coverImage,
      category: vendors.category,
    })
    .from(vendors)
    .where(eq(vendors.id, request.vendorId))
    .limit(1);

  if (!vendor) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    clientName: request.clientName,
    vendor: {
      slug: vendor.slug,
      businessName: vendor.businessName,
      coverImage: vendor.coverImage,
      category: vendor.category,
    },
  });
}

// ─── POST: create review from token ──────────────────────────────────────────

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(80).optional(),
  body: z.string().min(20).max(1000),
  authorName: z.string().min(2).max(80),
  authorEmail: z.string().email(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Look up request
  const [request] = await db
    .select()
    .from(reviewRequests)
    .where(eq(reviewRequests.token, token))
    .limit(1);

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (request.status === "used") {
    return NextResponse.json({ error: "Already used" }, { status: 410 });
  }

  if (request.expiresAt < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }
  const { rating, title, body: reviewBody, authorName, authorEmail } =
    parsed.data;

  // Rate-limit by IP (best-effort, not atomic)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (ip !== "unknown") {
    const windowStart = new Date(Date.now() - IP_RATE_WINDOW_MS);
    // Count how many reviews this IP's author-email created recently.
    // We approximate IP rate-limit by counting author_email bursts since
    // we don't persist IP. Cheap best-effort guard.
    const [burst] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviews)
      .where(
        and(
          eq(reviews.authorEmail, authorEmail),
          gte(reviews.createdAt, windowStart)
        )
      );
    if ((burst?.n ?? 0) >= MAX_SUBMISSIONS_PER_IP_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many submissions" },
        { status: 429 }
      );
    }
  }

  // Insert review (unpublished, verified via token)
  const reviewId = randomUUID();
  await db.insert(reviews).values({
    id: reviewId,
    vendorId: request.vendorId,
    authorName,
    authorEmail,
    rating,
    title: title ?? null,
    body: reviewBody,
    isVerified: true,
    isPublished: false,
  });

  // Mark request used
  await db
    .update(reviewRequests)
    .set({
      status: "used",
      reviewId,
      usedAt: new Date(),
    })
    .where(eq(reviewRequests.id, request.id));

  // Notify admin (best-effort)
  if (ADMIN_EMAIL && RESEND_API_KEY) {
    const [vendor] = await db
      .select({ businessName: vendors.businessName, slug: vendors.slug })
      .from(vendors)
      .where(eq(vendors.id, request.vendorId))
      .limit(1);

    try {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: RESEND_FROM_EMAIL || "WeddingPro <noreply@weddingpro.co.il>",
        to: ADMIN_EMAIL,
        subject: `ביקורת חדשה ממתינה לאישור — ${vendor?.businessName ?? "ספק"}`,
        html: `<div dir="rtl" style="font-family:system-ui">
          <h3>ביקורת חדשה ממתינה לאישור</h3>
          <p><strong>ספק:</strong> ${escapeHtml(vendor?.businessName ?? "—")}</p>
          <p><strong>מאת:</strong> ${escapeHtml(authorName)} (${escapeHtml(authorEmail)})</p>
          <p><strong>דירוג:</strong> ${rating}/5</p>
          ${title ? `<p><strong>כותרת:</strong> ${escapeHtml(title)}</p>` : ""}
          <blockquote style="border-right:3px solid #B8935A;padding-right:12px;color:#2C2724">${escapeHtml(reviewBody)}</blockquote>
          <p><a href="${NEXT_PUBLIC_APP_URL}/admin/vendors/${escapeHtml(vendor?.slug ?? "")}">לצפייה ואישור</a></p>
        </div>`,
      });
    } catch (err) {
      console.error("[reviews/submit] admin email error:", err);
    }
  }

  return NextResponse.json({ ok: true, reviewId });
}
