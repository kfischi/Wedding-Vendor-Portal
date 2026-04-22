/**
 * Unified messaging endpoint — sends email or WhatsApp to a lead.
 * POST /api/messaging/send
 *
 * Body: { leadId, channel: 'email'|'whatsapp', subject?, body }
 * Protected: authenticated vendor session.
 * Logs every message to the messages table.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { vendors, leads, messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { waSend } from "@/lib/whatsapp";
import { escapeHtml } from "@/lib/security/sanitize";
import { RESEND_API_KEY, NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(["email", "whatsapp"]),
  subject: z.string().max(200).optional(),
  body: z.string().min(5).max(3000),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { leadId, channel, subject, body: msgBody } = parsed.data;

  // Load vendor + lead
  let vendor;
  let lead;
  try {
    const [v] = await db.select().from(vendors).where(eq(vendors.userId, user.id)).limit(1);
    vendor = v ?? null;
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const [l] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.vendorId, vendor.id)))
      .limit(1);
    lead = l ?? null;
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let sendOk = false;
  let sendError: string | undefined;
  let recipient: string;

  // ── Email ──────────────────────────────────────────────────────────────────
  if (channel === "email") {
    recipient = lead.email;

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }

    const resend = new Resend(RESEND_API_KEY);
    const baseUrl = NEXT_PUBLIC_APP_URL;
    const fromHostname = new URL(baseUrl).hostname;

    const safeBody = escapeHtml(msgBody).replace(/\n/g, "<br/>");
    const safeVendorName = escapeHtml(vendor.businessName);
    const safeName = escapeHtml(lead.name);

    try {
      await resend.emails.send({
        from: `${safeVendorName} דרך WeddingPro <noreply@${fromHostname}>`,
        to: recipient,
        subject: subject ?? `הודעה מ-${vendor.businessName}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1a1614 0%,#2d2420 100%); padding:24px 32px;">
              <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">${safeVendorName}</p>
              <p style="margin:4px 0 0; font-size:12px; color:rgba(255,255,255,0.5);">דרך WeddingPro</p>
            </div>
            <div style="padding:28px 32px; background:#ffffff;">
              <p style="margin:0 0 8px; font-size:14px; color:#5a4a42;">שלום ${safeName},</p>
              <div style="font-size:15px; color:#1a1614; line-height:1.7; white-space:pre-wrap;">${safeBody}</div>
            </div>
            <div style="padding:14px 32px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
              WeddingPro — פלטפורמת ספקי חתונות בישראל
            </div>
          </div>
        `,
      });
      sendOk = true;
    } catch (err) {
      sendError = err instanceof Error ? err.message : "Email error";
    }
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  if (channel === "whatsapp") {
    const phone = lead.phone ?? null;
    if (!phone) {
      return NextResponse.json({ error: "הליד אינו כולל מספר טלפון" }, { status: 400 });
    }
    recipient = phone;

    const result = await waSend(phone, msgBody);
    sendOk = result.ok;
    sendError = result.error;
  } else {
    recipient = lead.email; // already set above, satisfy TS
  }

  // ── Log to DB ──────────────────────────────────────────────────────────────
  try {
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      vendorId: vendor.id,
      leadId: lead.id,
      channel,
      recipient: recipient!,
      subject: subject ?? null,
      body: msgBody,
      status: sendOk ? "sent" : "failed",
      error: sendError ?? null,
    });
  } catch (err) {
    console.error("[messaging] Log error:", err);
  }

  if (!sendOk) {
    return NextResponse.json(
      { error: sendError ?? "שגיאה בשליחה" },
      { status: channel === "whatsapp" ? 503 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
