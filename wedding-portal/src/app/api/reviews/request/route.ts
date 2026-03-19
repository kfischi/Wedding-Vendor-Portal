/**
 * Review request automation.
 * POST /api/reviews/request
 *
 * Sends a personalized email to a past lead asking them to leave a review.
 * Protected: authenticated vendor session only.
 * Can be triggered manually or via cron after event date passes.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { RESEND_API_KEY, NEXT_PUBLIC_APP_URL } from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";

const schema = z.object({
  leadId: z.string().min(1),
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

  const { leadId } = parsed.data;

  // Verify lead belongs to the vendor
  let lead;
  let vendor;
  try {
    const [v] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = v ?? null;

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const [l] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.vendorId, vendor.id)))
      .limit(1);
    lead = l ?? null;
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const resend = new Resend(RESEND_API_KEY);
  const baseUrl = NEXT_PUBLIC_APP_URL;
  const reviewUrl = `${baseUrl}/vendors/${vendor.slug}#reviews`;

  const safeName = escapeHtml(lead.name);
  const safeVendorName = escapeHtml(vendor.businessName);
  const fromHostname = new URL(baseUrl).hostname;

  try {
    await resend.emails.send({
      from: `${safeVendorName} דרך WeddingPro <noreply@${fromHostname}>`,
      to: lead.email,
      subject: `איך היה? נשמח לשמוע על החוויה שלך 💛`,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a1614 0%,#2d2420 100%); padding:28px 32px; text-align:center;">
            <p style="margin:0; font-size:22px; color:#b8976a; font-weight:bold;">WeddingPro</p>
          </div>
          <div style="padding:32px; background:#ffffff; text-align:center;">
            <div style="font-size:48px; margin-bottom:16px;">💛</div>
            <h2 style="margin:0 0 12px; font-size:24px; color:#1a1614;">
              שלום ${safeName}!
            </h2>
            <p style="margin:0 0 20px; color:#5a4a42; font-size:15px; line-height:1.6;">
              תודה שבחרתם ב<strong>${safeVendorName}</strong>.<br/>
              נשמח מאוד אם תשתפו את החוויה שלכם — זה עוזר לזוגות אחרים לקבל החלטה נכונה.
            </p>
            <a
              href="${escapeHtml(reviewUrl)}"
              style="display:inline-block; background:linear-gradient(135deg,#b8976a 0%,#9a7d56 100%); color:#fff; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px; margin-bottom:20px;"
            >
              כתוב ביקורת &rarr;
            </a>
            <p style="margin:20px 0 0; color:#9e8e86; font-size:12px;">
              לוקח פחות מ-2 דקות • ללא רישום נדרש
            </p>
          </div>
          <div style="padding:14px 32px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
            WeddingPro — פלטפורמת ספקי חתונות בישראל
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[review-request] Email error:", err);
    return NextResponse.json({ error: "שגיאה בשליחת האימייל" }, { status: 500 });
  }
}
