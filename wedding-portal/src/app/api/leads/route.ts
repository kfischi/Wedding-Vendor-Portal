import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { leads, vendors } from "@/lib/db/schema";

// ── Parse DD/MM/YYYY date strings ─────────────────────────────────────────
function parseDateString(dateStr: string): Date | null {
  // Support DD/MM/YYYY (Israeli format from form) and ISO formats
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// ── Rate limit: in-memory (3 leads / IP / 24h) ────────────────────────────
const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const maxRequests = 3;

  const timestamps = rateLimitStore.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) return false;

  rateLimitStore.set(ip, [...recent, now]);
  return true;
}

// ── Schema ────────────────────────────────────────────────────────────────
const leadSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(2, "שם נדרש"),
  email: z.string().email("אימייל לא תקין"),
  phone: z.string().optional(),
  message: z.string().min(10, "הודעה קצרה מדי"),
  eventDate: z.string().optional(),
});

// ── POST ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "יותר מדי פניות — נסה שוב מחר" },
      { status: 429 }
    );
  }

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

  // אימות שהספק קיים ופעיל
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

  // DB rate limiting: max 3 leads מאותו אימייל לאותו ספק ב-24 שעות
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ value: recentLeads }] = await db
      .select({ value: count() })
      .from(leads)
      .where(
        and(
          eq(leads.vendorId, vendorId),
          eq(leads.email, email),
          gte(leads.createdAt, yesterday)
        )
      );

    if (Number(recentLeads) >= 3) {
      return NextResponse.json(
        { error: "יותר מדי פניות מאותו אימייל" },
        { status: 429 }
      );
    }
  } catch {
    // DB error — ממשיכים
  }

  // שמירה ב-DB
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

    // עדכון מונה לידים
    await db
      .update(vendors)
      .set({ leadCount: (vendor.leadCount ?? 0) + 1 })
      .where(eq(vendors.id, vendorId));
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
  }

  // שליחת מיילים
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const parsedEventDate = eventDate ? parseDateString(eventDate) : null;
    const eventDateFormatted = parsedEventDate
      ? new Intl.DateTimeFormat("he-IL").format(parsedEventDate)
      : null;

    const leadTableRows = `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">שם</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; color:#1a1614;">${name}</td>
      </tr>
      <tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">אימייל</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0;">
          <a href="mailto:${email}" style="color:#b8976a;">${email}</a>
        </td>
      </tr>
      ${phone ? `<tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">טלפון</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0;">
          <a href="tel:${phone}" style="color:#b8976a;">${phone}</a>
        </td>
      </tr>` : ""}
      ${eventDateFormatted ? `<tr>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; font-weight:bold; color:#5a4a42;">תאריך אירוע</td>
        <td style="padding:8px; border-bottom:1px solid #e8ddd0; color:#1a1614;">${eventDateFormatted}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px; font-weight:bold; vertical-align:top; color:#5a4a42;">הודעה</td>
        <td style="padding:8px; color:#1a1614;">${message.replace(/\n/g, "<br>")}</td>
      </tr>
    `;

    const emailWrapper = (body: string) => `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
        <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 28px 32px;">
          <p style="margin:0; font-size:22px; color:#b8976a; font-weight:bold;">WeddingPro</p>
        </div>
        <div style="padding: 28px 32px; background:#ffffff;">
          ${body}
        </div>
        <div style="padding: 16px 32px; background:#faf8f5; text-align:center; font-size:12px; color:#9e8e86;">
          WeddingPro — פלטפורמת ספקי חתונות בישראל
        </div>
      </div>
    `;

    const ctaButton = (href: string, label: string) => `
      <div style="margin-top: 24px; text-align:center;">
        <a href="${href}" style="
          display: inline-block;
          background: linear-gradient(135deg, #b8976a 0%, #9a7d56 100%);
          color: white;
          padding: 13px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
        ">${label}</a>
      </div>
    `;

    // מייל לספק
    await resend.emails.send({
      from: `WeddingPro <noreply@${new URL(baseUrl).hostname}>`,
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

    // מייל לאדמין
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await resend.emails.send({
        from: `WeddingPro <noreply@${new URL(baseUrl).hostname}>`,
        to: adminEmail,
        subject: `פנייה חדשה: ${vendor.businessName} ← ${name}`,
        html: emailWrapper(`
          <h2 style="margin:0 0 6px; font-size:22px; color:#1a1614;">פנייה חדשה במערכת</h2>
          <p style="margin:0 0 20px; color:#5a4a42; font-size:14px;">ספק: <strong>${vendor.businessName}</strong></p>
          <table style="width:100%; border-collapse:collapse; border: 1px solid #e8ddd0; border-radius:8px; overflow:hidden;">
            ${leadTableRows}
          </table>
          ${ctaButton(`${baseUrl}/admin/vendors/${vendorId}`, "צפה בספק במערכת האדמין")}
        `),
      });
    }
  } catch (err) {
    // מייל נכשל — לא חוזרים שגיאה, הליד נשמר
    console.error("[leads] Email error:", err);
  }

  // טריגר n8n webhook
  try {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_phone: vendor.phone,
          vendor_name: vendor.businessName,
          lead_name: name,
          lead_phone: phone ?? null,
          lead_email: email,
          event_date: eventDate ?? null,
          message,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch (err) {
    console.error("[leads] n8n webhook error:", err);
  }

  return NextResponse.json({ ok: true, leadId: newLead?.id }, { status: 201 });
}
