"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorCategoryEnum, type NewVendor } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { RESEND_API_KEY, NEXT_PUBLIC_APP_URL, ADMIN_EMAIL } from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";

const VALID_CATEGORIES = vendorCategoryEnum.enumValues;

const schema = z.object({
  email:        z.string().email("אימייל לא תקין").max(255),
  password:     z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  businessName: z.string().min(2, "שם עסק נדרש").max(100),
  category:     z.enum(VALID_CATEGORIES, { error: "יש לבחור קטגוריה" }),
  city:         z.string().min(1, "עיר נדרשת").max(100),
  phone:        z.string().max(20).optional(),
});

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    email:        formData.get("email")?.toString().trim() ?? "",
    password:     formData.get("password")?.toString() ?? "",
    businessName: formData.get("businessName")?.toString().trim() ?? "",
    category:     formData.get("category")?.toString() ?? "",
    city:         formData.get("city")?.toString().trim() ?? "",
    phone:        formData.get("phone")?.toString().trim() || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const { email, password, businessName, category, city, phone } = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      return { error: "כתובת אימייל זו כבר רשומה — נסה להתחבר" };
    }
    return { error: "שגיאה ביצירת חשבון — נסה שוב" };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "שגיאה ביצירת חשבון" };

  const slug = slugify(businessName) + "-" + userId.slice(0, 6);

  try {
    const newVendor: NewVendor = {
      id: crypto.randomUUID(),
      userId,
      slug,
      businessName,
      category: category as (typeof VALID_CATEGORIES)[number],
      city,
      phone: phone ?? null,
      email,
      plan: "free",
      status: "active",
      role: "vendor",
    };
    await db.insert(vendors).values(newVendor);
  } catch (dbErr) {
    console.error("[register] DB insert error:", dbErr);
    // User was created — still continue
  }

  // Send welcome email (non-blocking)
  try {
    const resend = new Resend(RESEND_API_KEY);
    const baseUrl = NEXT_PUBLIC_APP_URL;
    const hostname = new URL(baseUrl).hostname;
    const dashboardUrl = `${baseUrl}/dashboard`;
    const safeBusinessName = escapeHtml(businessName);

    await resend.emails.send({
      from: `WeddingPro <noreply@${hostname}>`,
      to: email,
      subject: "ברוכים הבאים ל-WeddingPro! 🎊",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 40px 32px; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 30px; color: #b8976a; font-family: 'Palatino Linotype', serif; letter-spacing: 0.05em;">WeddingPro</p>
            <p style="margin: 0; font-size: 18px; color: rgba(255,255,255,0.85); font-weight: 600;">ברוכים הבאים! 🎊</p>
          </div>

          <div style="height: 3px; background: linear-gradient(to left, transparent, #b8976a, transparent);"></div>

          <div style="padding: 36px 32px; background: #ffffff;">
            <p style="margin: 0 0 20px; font-size: 16px; color: #1a1614; line-height: 1.7;">
              שלום, ברוכים הבאים ל-WeddingPro!<br>
              הפרופיל של <strong style="color: #b8976a;">${safeBusinessName}</strong> נוצר בהצלחה ועכשיו פעיל בדירקטורי שלנו.
            </p>

            <div style="background: #faf9f7; border-radius: 12px; border: 1px solid rgba(184,147,90,0.2); padding: 20px 24px; margin: 0 0 28px;">
              <p style="margin: 0 0 14px; font-size: 14px; font-weight: 700; color: #1a1614;">שלושה צעדים ראשונים:</p>
              ${[
                ["01", "עדכנו את הפרופיל", "הוסיפו תיאור, תמונות וחבילות מחיר"],
                ["02", "העלו תמונות לגלריה", "תמונות מקצועיות = יותר לידים"],
                ["03", "קבלו פניות ישירות", "לקוחות פוטנציאליים ימצאו אתכם ויפנו אליכם"],
              ].map(([num, title, desc]) => `
                <div style="display: flex; gap: 14px; margin-bottom: 10px; align-items: flex-start;">
                  <span style="flex-shrink: 0; width: 28px; height: 28px; background: rgba(184,147,90,0.12); border: 1px solid rgba(184,147,90,0.3); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #b8976a;">${num}</span>
                  <div>
                    <p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #1a1614;">${title}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b6460;">${desc}</p>
                  </div>
                </div>
              `).join("")}
            </div>

            <div style="text-align: center;">
              <a href="${escapeHtml(dashboardUrl)}"
                 style="display: inline-block; background: linear-gradient(135deg, #b8976a 0%, #9a7d56 100%); color: white; padding: 14px 36px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; letter-spacing: 0.02em;">
                עבור ללוח הבקרה ←
              </a>
            </div>

            <p style="margin: 24px 0 0; font-size: 12px; color: #9e8e86; text-align: center;">
              שאלות? פנו אלינו ב: <a href="mailto:support@${hostname}" style="color: #b8976a;">support@${hostname}</a>
            </p>
          </div>

          <div style="padding: 16px 32px; background: #faf8f5; text-align: center; font-size: 11px; color: #9e8e86;">
            WeddingPro — הפלטפורמה המובילה לספקי חתונות בישראל
          </div>
        </div>
      `,
    });

    // Notify admin of new registration
    if (ADMIN_EMAIL) {
      await resend.emails.send({
        from: `WeddingPro <noreply@${hostname}>`,
        to: ADMIN_EMAIL,
        subject: `[WeddingPro] ספק חדש נרשם — ${businessName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px;">
            <h3 style="color: #1a1614;">ספק חדש נרשם (Free)</h3>
            <ul style="line-height: 2;">
              <li><strong>שם עסק:</strong> ${safeBusinessName}</li>
              <li><strong>אימייל:</strong> ${escapeHtml(email)}</li>
              <li><strong>עיר:</strong> ${escapeHtml(city)}</li>
              <li><strong>קטגוריה:</strong> ${escapeHtml(category)}</li>
            </ul>
            <a href="${escapeHtml(baseUrl)}/admin/vendors"
               style="display:inline-block; background:#8c5f58; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600;">
              ניהול ספקים
            </a>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error("[register] Welcome email error:", emailErr);
    // Non-fatal — user is already created and logged in
  }

  redirect("/dashboard");
}
