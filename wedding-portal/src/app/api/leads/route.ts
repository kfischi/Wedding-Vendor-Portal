import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { leads, vendors } from "@/lib/db/schema";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/security/sanitize";
import { RATE_LIMIT, NEXT_PUBLIC_APP_URL, RESEND_API_KEY, ADMIN_EMAIL, ADMIN_PHONE } from "@/lib/env";
import { n8nLeadNew } from "@/lib/n8n";
import { waSend } from "@/lib/whatsapp";
import { scoreAndSaveLead } from "@/lib/ai/score-lead";

// ── Parse DD/MM/YYYY date strings ──────────────────────────────────────────────
function parseDateString(dateStr: string): Date | null {
  // Support DD/MM/YYYY (Israeli format) and ISO formats
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    // Strict validation: check bounds and that the date doesn't overflow
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    // Verify no overflow (e.g. Feb 31 → March 2)
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }
    return d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const leadSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(2, "שם נדרש").max(100),
  email: z.string().email("אימייל לא תקין").max(255),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, "הודעה קצרה מדי").max(2000),
  eventDate: z.string().max(20).optional(),
});

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. IP-based rate limiting (DB-backed — survives restarts & multi-instance) ─
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT.WINDOW_MS);
    const [{ value: ipCount }] = await db
      .select({ value: count() })
      .from(leads)
      .where(
        and(
          eq(leads.submitterIp, ip),
          gte(leads.createdAt, windowStart)
        )
      );

    if (Number(ipCount) >= RATE_LIMIT.LEADS_PER_IP_PER_DAY) {
      return NextResponse.json(
        { error: "יותר מדי פניות — נסה שוב מחר" },
        { status: 429 }
      );
    }
  } catch {
    // DB rate-limit check failed — continue (fail open, log warning)
    console.warn("[leads] IP rate-limit DB check failed, proceeding");
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "שגיאה בנתונים" },
      { status: 400 }
    );
  }

  const { vendorId, name, email, phone, message, eventDate } = parsed.data;

  // ── 3. Verify vendor exists and is active ─────────────────────────────────
  let vendor;
  try {
    const [v] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, vendorId), eq(vendors.status, "active")))
      .limit(1);
    vendor = v ?? null;
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  // ── 4. Per-email-per-vendor rate limiting (DB-backed) ─────────────────────
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT.WINDOW_MS);
    const [{ value: emailCount }] = await db
      .select({ value: count() })
      .from(leads)
      .where(
        and(
          eq(leads.vendorId, vendorId),
          eq(leads.email, email),
          gte(leads.createdAt, windowStart)
        )
      );

    if (Number(emailCount) >= RATE_LIMIT.LEADS_PER_EMAIL_PER_VENDOR_PER_DAY) {
      return NextResponse.json(
        { error: "יותר מדי פניות מאותו אימייל" },
        { status: 429 }
      );
    }
  } catch {
    // Fail open — do not block legitimate leads due to DB issue
    console.warn("[leads] email rate-limit DB check failed, proceeding");
  }

  // ── 5. Insert lead + atomically increment lead counter ────────────────────
  let newLead;
  try {
    [newLead] = await db
      .insert(leads)
      .values({
        id: crypto.randomUUID(),
        vendorId,
        name,
        email,
        phone: phone ?? null,
        message,
        eventDate: eventDate ? parseDateString(eventDate) : null,
        status: "new",
        submitterIp: ip,
      })
      .returning();

    // Atomic increment — prevents race condition under concurrent requests
    await db
      .update(vendors)
      .set({ leadCount: sql`${vendors.leadCount} + 1` })
      .where(eq(vendors.id, vendorId));
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
  }

  // ── 6. Send notification emails (non-blocking) ────────────────────────────
  try {
    const resend = new Resend(RESEND_API_KEY);
    const baseUrl = NEXT_PUBLIC_APP_URL;
    const parsedEventDate = eventDate ? parseDateString(eventDate) : null;
    const eventDateFormatted = parsedEventDate
      ? new Intl.DateTimeFormat("he-IL").format(parsedEventDate)
      : null;

    // ── HTML-escape all user-supplied values before inserting into HTML ──────
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : null;
    const safeMessage = escapeHtmlMultiline(message);
    const safeVendorName = escapeHtml(vendor.businessName);

    const leadTableRows = `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">שם</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; color:#1a1614;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">אימייל</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0;">
          <a href="mailto:${safeEmail}" style="color:#b8976a;">${safeEmail}</a>
        </td>
      </tr>
      ${safePhone ? `<tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">טלפון</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0;">
          <a href="tel:${safePhone}" style="color:#b8976a;">${safePhone}</a>
        </td>
      </tr>` : ""}
      ${eventDateFormatted ? `<tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">תאריך אירוע</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; color:#1a1614;">${escapeHtml(eventDateFormatted)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px; font-weight:bold; vertical-align:top; color:#5a4a42;">הודעה</td>
        <td style="padding:8px; color:#1a1614;">${safeMessage}</td>
      </tr>
    `;

    const emailWrapper = (bodyHtml: string) => `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
        <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 28px 32px;">
          <p style="margin:0; font-size:22px; color:#b8976a; font-weight:bold;">WeddingPro</p>
        </div>
        <div style="padding: 28px 32px; background:#ffffff;">
          ${bodyHtml}
        </div>
        <div style="padding: 16px 32px; background:#faf8f5; text-align:center; font-size:12px; color:#9e8e86;">
          WeddingPro — פלטפורמת ספקי חתונות בישראל
        </div>
      </div>
    `;

    const ctaButton = (href: string, label: string) => `
      <div style="margin-top: 24px; text-align:center;">
        <a href="${escapeHtml(href)}" style="
          display: inline-block;
          background: linear-gradient(135deg, #b8976a 0%, #9a7d56 100%);
          color: white;
          padding: 13px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
        ">${escapeHtml(label)}</a>
      </div>
    `;

    const fromAddress = `WeddingPro <noreply@${new URL(baseUrl).hostname}>`;

    // Email to vendor
    await resend.emails.send({
      from: fromAddress,
      to: vendor.email,
      subject: `פנייה חדשה התקבלה — ${name}`,
      html: emailWrapper(`
        <h2 style="margin:0 0 6px; font-size:22px; color:#1a1614;">פנייה חדשה התקבלה!</h2>
        <p style="margin:0 0 20px; color:#5a4a42; font-size:14px;">לקוח/ה פנה/תה אליך דרך WeddingPro</p>
        <table style="width:100%; border-collapse:collapse; border: 1px solid #e8ddd0; border-radius:8px; overflow:hidden;">
          ${leadTableRows}
        </table>
        ${ctaButton(`${baseUrl}/dashboard/leads`, "צפה בכל הלידים")}
      `),
    });

    // Email to admin (optional)
    if (ADMIN_EMAIL) {
      await resend.emails.send({
        from: fromAddress,
        to: ADMIN_EMAIL,
        subject: `פנייה חדשה: ${vendor.businessName} ← ${name}`,
        html: emailWrapper(`
          <h2 style="margin:0 0 6px; font-size:22px; color:#1a1614;">פנייה חדשה במערכת</h2>
          <p style="margin:0 0 20px; color:#5a4a42; font-size:14px;">ספק: <strong>${safeVendorName}</strong></p>
          <table style="width:100%; border-collapse:collapse; border: 1px solid #e8ddd0; border-radius:8px; overflow:hidden;">
            ${leadTableRows}
          </table>
          ${ctaButton(`${baseUrl}/admin/vendors/${escapeHtml(vendorId)}`, "צפה בספק במערכת האדמין")}
        `),
      });
    }
  } catch (err) {
    // Email failure — lead is already saved, do not surface error to user
    console.error("[leads] Email send error:", err);
  }

  // ── 7. AI Lead Scoring (non-blocking, fire-and-forget) ────────────────────
  if (newLead?.id) {
    void scoreAndSaveLead({
      id: newLead.id,
      name,
      message,
      phone: phone ?? null,
      eventDate: eventDate ? parseDateString(eventDate) : null,
      vendorCategory: vendor.category,
    });
  }

  // ── 8. WhatsApp notifications (non-blocking) ──────────────────────────────
  void (async () => {
    const parsedEventDate = eventDate ? parseDateString(eventDate) : null;
    const eventDateFormatted = parsedEventDate
      ? new Intl.DateTimeFormat("he-IL").format(parsedEventDate)
      : null;

    // Notify vendor
    if (vendor.phone) {
      const vendorMsg = [
        `📋 *פנייה חדשה התקבלה!*`,
        ``,
        `*שם:* ${name}`,
        phone ? `*טלפון:* ${phone}` : null,
        `*אימייל:* ${email}`,
        eventDateFormatted ? `*תאריך אירוע:* ${eventDateFormatted}` : null,
        ``,
        `*הודעה:*`,
        message,
        ``,
        `לצפייה בלידים: ${NEXT_PUBLIC_APP_URL}/dashboard/leads`,
      ]
        .filter((l) => l !== null)
        .join("\n");
      await waSend(vendor.phone, vendorMsg);
    }

    // Notify admin
    if (ADMIN_PHONE) {
      const adminMsg = [
        `📋 *ליד חדש במערכת*`,
        ``,
        `*ספק:* ${vendor.businessName}`,
        `*לקוח:* ${name}`,
        phone ? `*טלפון:* ${phone}` : null,
        `*אימייל:* ${email}`,
        eventDateFormatted ? `*תאריך אירוע:* ${eventDateFormatted}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n");
      await waSend(ADMIN_PHONE, adminMsg);
    }
  })();

  // ── 9. Trigger n8n webhook (non-blocking) ─────────────────────────────────
  void n8nLeadNew({
    lead_id: newLead?.id ?? "",
    vendor_id: vendorId,
    vendor_name: vendor.businessName,
    vendor_phone: vendor.phone ?? null,
    vendor_email: vendor.email,
    lead_name: name,
    lead_email: email,
    lead_phone: phone ?? null,
    event_date: eventDate ?? null,
    message,
  });

  return NextResponse.json({ ok: true, leadId: newLead?.id }, { status: 201 });
}
