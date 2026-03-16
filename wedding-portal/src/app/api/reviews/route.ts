import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { reviews, vendors } from "@/lib/db/schema";
import { escapeHtml } from "@/lib/security/sanitize";
import {
  RESEND_API_KEY,
  ADMIN_EMAIL,
  NEXT_PUBLIC_APP_URL,
  RATE_LIMIT,
} from "@/lib/env";

const reviewSchema = z.object({
  vendorId: z.string().min(1),
  authorName: z.string().min(2, "שם נדרש").max(100),
  authorEmail: z.string().email("אימייל לא תקין").max(255),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(20, "ביקורת קצרה מדי — לפחות 20 תווים").max(2000),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "שגיאה בנתונים" },
      { status: 400 }
    );
  }

  const { vendorId, authorName, authorEmail, rating, title, body: reviewBody } =
    parsed.data;

  // ── Verify vendor exists and is active ────────────────────────────────────
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

  // ── Rate limit: 1 review per email per vendor (ever) ──────────────────────
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT.WINDOW_MS);
    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.vendorId, vendorId),
          eq(reviews.authorEmail, authorEmail),
          gte(reviews.createdAt, windowStart)
        )
      );

    if (Number(existing) >= RATE_LIMIT.REVIEWS_PER_EMAIL_PER_VENDOR) {
      return NextResponse.json(
        { error: "כבר השארת ביקורת על הספק הזה לאחרונה" },
        { status: 429 }
      );
    }
  } catch {
    console.warn("[reviews] rate-limit check failed, proceeding");
  }

  // ── Insert review (pending moderation) ───────────────────────────────────
  let newReview;
  try {
    [newReview] = await db
      .insert(reviews)
      .values({
        id: crypto.randomUUID(),
        vendorId,
        authorName,
        authorEmail,
        rating,
        title: title ?? null,
        body: reviewBody,
        isVerified: false,
        isPublished: false,
      })
      .returning();
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירה" }, { status: 500 });
  }

  // ── Notify admin to moderate ──────────────────────────────────────────────
  if (ADMIN_EMAIL) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const baseUrl = NEXT_PUBLIC_APP_URL;
      const hostname = new URL(baseUrl).hostname;

      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const safeVendorName = escapeHtml(vendor.businessName);
      const safeAuthorName = escapeHtml(authorName);
      const safeAuthorEmail = escapeHtml(authorEmail);
      const safeTitle = title ? escapeHtml(title) : "";
      const safeBody = escapeHtml(reviewBody);

      await resend.emails.send({
        from: `WeddingPro <noreply@${hostname}>`,
        to: ADMIN_EMAIL,
        subject: `[ביקורת חדשה] ${vendor.businessName} — ${stars}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
            <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 24px 28px;">
              <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">WeddingPro</p>
            </div>
            <div style="padding: 24px 28px; background:#ffffff;">
              <h2 style="margin:0 0 4px; color:#1a1614;">ביקורת חדשה ממתינה לאישור</h2>
              <p style="margin:0 0 20px; color:#5a4a42; font-size:14px;">
                ספק: <strong>${safeVendorName}</strong>
              </p>
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="padding:6px 0; color:#666; font-size:13px; width:90px;">שם:</td>
                  <td style="padding:6px 0; font-weight:600;">${safeAuthorName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#666; font-size:13px;">אימייל:</td>
                  <td style="padding:6px 0;">${safeAuthorEmail}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#666; font-size:13px;">דירוג:</td>
                  <td style="padding:6px 0; font-size:18px; color:#c9a84c;">${stars}</td>
                </tr>
                ${safeTitle ? `<tr>
                  <td style="padding:6px 0; color:#666; font-size:13px;">כותרת:</td>
                  <td style="padding:6px 0; font-weight:600;">${safeTitle}</td>
                </tr>` : ""}
              </table>
              <div style="margin-top:16px; padding:16px; background:#faf9f7; border-radius:8px; border:1px solid #e8ddd0;">
                <p style="margin:0; line-height:1.6; font-size:14px;">${safeBody}</p>
              </div>
              <div style="margin-top:20px; text-align:center;">
                <a href="${baseUrl}/admin/vendors/${escapeHtml(vendorId)}"
                   style="display:inline-block; background:linear-gradient(135deg,#b8976a,#9a7d56); color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px;">
                  אשר / דחה ביקורת
                </a>
              </div>
            </div>
            <div style="padding:12px 28px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
              WeddingPro — פלטפורמת ספקי חתונות בישראל
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("[reviews] admin notification error:", err);
    }
  }

  return NextResponse.json(
    { ok: true, reviewId: newReview?.id },
    { status: 201 }
  );
}
