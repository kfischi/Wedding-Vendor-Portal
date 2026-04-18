/**
 * GET /api/cron/trial-reminders
 *
 * Called daily by GitHub Actions cron.
 * Finds vendors whose trial is expiring in ~7 days or ~1 day,
 * sends reminder emails via Resend, and suspends expired vendors.
 *
 * Protected by x-ping-secret header (same secret as /api/ping).
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, and, lt, gte, lte } from "drizzle-orm";
import { RESEND_API_KEY, FROM_EMAIL, NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

// Window around each reminder day (±20 h) so a daily cron never misses a vendor
const WINDOW_MS = 20 * 60 * 60 * 1000;

interface ReminderResult {
  vendorId: string;
  email: string;
  businessName: string;
  event: "reminder-7d" | "reminder-1d" | "expired";
  status: "sent" | "error";
  detail?: string;
}

function reminderEmail(
  businessName: string,
  daysLeft: number,
  trialEndDisplay: string,
  appUrl: string
): string {
  const urgent = daysLeft <= 1;
  const subject = urgent
    ? `⚠️ המנוי שלך ב-WeddingPro יפוג מחר`
    : `תזכורת: המנוי שלך יפוג בעוד ${daysLeft} ימים`;
  const color = urgent ? "#dc2626" : "#b8976a";

  return /* html */ `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1614 0%,#2d2420 100%);padding:24px 28px;">
    <p style="margin:0;font-size:20px;color:#b8976a;font-weight:bold;">WeddingPro</p>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <h2 style="margin:0 0 12px;color:#1a1614;">${subject}</h2>
    <p style="margin:0 0 16px;color:#5a4a42;line-height:1.6;">
      שלום <strong>${businessName}</strong>,<br/>
      ${urgent
        ? `תקופת הניסיון החינמית שלך <strong>מסתיימת מחר</strong> (${trialEndDisplay}).`
        : `תקופת הניסיון החינמית שלך מסתיימת בעוד <strong>${daysLeft} ימים</strong> (${trialEndDisplay}).`
      }
    </p>
    <div style="background:${urgent ? "#fef2f2" : "#fffbeb"};border:1px solid ${urgent ? "#fecaca" : "#fde68a"};border-radius:8px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;color:${urgent ? "#991b1b" : "#92400e"};font-size:14px;font-weight:bold;">
        ${urgent ? "⚠️ פעולה נדרשת עד מחר" : "📅 חדש את המנוי כדי להמשיך להופיע בדירקטורי"}
      </p>
      <p style="margin:6px 0 0;color:${urgent ? "#991b1b" : "#78350f"};font-size:13px;">
        לאחר פקיעת הניסיון, הפרופיל שלך יוסתר מהדירקטורי הציבורי.
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#b8976a,#9a7d56);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
        כניסה לדאשבורד ←
      </a>
    </div>
    <p style="margin:0;color:#9e8e86;font-size:13px;">
      לשאלות: <a href="mailto:info@weddingpro.co.il" style="color:#b8976a;">info@weddingpro.co.il</a>
    </p>
  </div>
  <div style="padding:12px 28px;background:#faf8f5;text-align:center;font-size:11px;color:#9e8e86;">
    WeddingPro — פלטפורמת ספקי חתונות בישראל
  </div>
</div>`;
}

function expiredEmail(businessName: string, appUrl: string): string {
  return /* html */ `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf8f5;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a1614 0%,#2d2420 100%);padding:24px 28px;">
    <p style="margin:0;font-size:20px;color:#b8976a;font-weight:bold;">WeddingPro</p>
  </div>
  <div style="padding:28px 32px;background:#ffffff;">
    <h2 style="margin:0 0 12px;color:#1a1614;">תקופת הניסיון שלך הסתיימה</h2>
    <p style="margin:0 0 16px;color:#5a4a42;line-height:1.6;">
      שלום <strong>${businessName}</strong>,<br/>
      תקופת הניסיון החינמית שלך הסתיימה והפרופיל הושהה באופן זמני.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;color:#991b1b;font-size:14px;font-weight:bold;">הפרופיל שלך אינו מוצג כעת בדירקטורי</p>
      <p style="margin:6px 0 0;color:#7f1d1d;font-size:13px;">
        כדי להמשיך להופיע ולקבל לידים, יש לחדש את המנוי.
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#b8976a,#9a7d56);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
        חדש את המנוי ←
      </a>
    </div>
    <p style="margin:0;color:#9e8e86;font-size:13px;">
      לשאלות: <a href="mailto:info@weddingpro.co.il" style="color:#b8976a;">info@weddingpro.co.il</a>
    </p>
  </div>
  <div style="padding:12px 28px;background:#faf8f5;text-align:center;font-size:11px;color:#9e8e86;">
    WeddingPro — פלטפורמת ספקי חתונות בישראל
  </div>
</div>`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth via PING_SECRET header
  const secret = process.env.PING_SECRET;
  if (secret && req.headers.get("x-ping-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(RESEND_API_KEY);
  const appUrl = NEXT_PUBLIC_APP_URL || "https://www.weddingpro.co.il";
  const now = new Date();
  const results: ReminderResult[] = [];

  // ── 1. Load all active vendors with upcoming or passed trial end ─────────────
  let allVendors: (typeof vendors.$inferSelect)[] = [];
  try {
    allVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.status, "active"));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

  for (const v of allVendors) {
    if (!v.trialEndsAt) continue;

    const msUntilEnd = v.trialEndsAt.getTime() - now.getTime();
    const daysUntilEnd = msUntilEnd / (24 * 60 * 60 * 1000);

    // ── Expired → suspend + email ───────────────────────────────────────────────
    if (msUntilEnd < 0) {
      try {
        await db.update(vendors).set({ status: "suspended", updatedAt: new Date() }).where(eq(vendors.id, v.id));
        await resend.emails.send({
          from: FROM_EMAIL,
          to: v.email,
          subject: "תקופת הניסיון שלך הסתיימה — WeddingPro",
          html: expiredEmail(v.businessName, appUrl),
        });
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "expired", status: "sent" });
      } catch (err) {
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "expired", status: "error", detail: String(err) });
      }
      continue;
    }

    // ── 7-day reminder (6–8 days before) ───────────────────────────────────────
    const target7 = 7 * 24 * 60 * 60 * 1000;
    if (Math.abs(msUntilEnd - target7) < WINDOW_MS) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: v.email,
          subject: `תזכורת: המנוי שלך יפוג בעוד 7 ימים — WeddingPro`,
          html: reminderEmail(v.businessName, 7, fmt(v.trialEndsAt), appUrl),
        });
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "reminder-7d", status: "sent" });
      } catch (err) {
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "reminder-7d", status: "error", detail: String(err) });
      }
    }

    // ── 1-day reminder (0–2 days before) ────────────────────────────────────────
    const target1 = 1 * 24 * 60 * 60 * 1000;
    if (Math.abs(msUntilEnd - target1) < WINDOW_MS) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: v.email,
          subject: `⚠️ המנוי שלך ב-WeddingPro יפוג מחר`,
          html: reminderEmail(v.businessName, 1, fmt(v.trialEndsAt), appUrl),
        });
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "reminder-1d", status: "sent" });
      } catch (err) {
        results.push({ vendorId: v.id, email: v.email, businessName: v.businessName, event: "reminder-1d", status: "error", detail: String(err) });
      }
    }
  }

  const sent = results.filter(r => r.status === "sent").length;
  const errors = results.filter(r => r.status === "error").length;

  return NextResponse.json({
    ok: errors === 0,
    processed: allVendors.filter(v => v.trialEndsAt).length,
    sent,
    errors,
    results,
    timestamp: new Date().toISOString(),
  });
}
