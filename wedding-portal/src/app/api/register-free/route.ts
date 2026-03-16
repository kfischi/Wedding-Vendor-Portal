import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { vendors, vendorCategoryEnum, type NewVendor } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import {
  NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY,
  ADMIN_EMAIL,
} from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";

const VALID_CATEGORIES = vendorCategoryEnum.enumValues;

const schema = z.object({
  email: z.string().email("אימייל לא תקין").max(255),
  businessName: z.string().min(2, "שם עסק נדרש").max(100),
  category: z.enum(VALID_CATEGORIES, { error: "קטגוריה לא תקינה" }),
  city: z.string().min(1, "עיר נדרשת").max(100),
  phone: z.string().max(20).optional(),
});

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/register-free
 *
 * Creates a free-plan vendor account without Stripe.
 * The vendor receives a password-setup email and is placed in "pending" status
 * until approved by an admin.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "שגיאה בנתונים" },
      { status: 400 }
    );
  }

  const { email, businessName, category, city, phone } = parsed.data;

  // Check if vendor with this email already exists
  try {
    const [existing] = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר רשומה במערכת" },
        { status: 409 }
      );
    }
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = NEXT_PUBLIC_APP_URL;
  const hostname = new URL(baseUrl).hostname;

  // Create Supabase auth user
  const tempPassword = crypto.randomUUID();
  const { data: newUser, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "vendor", plan: "free" },
    });

  if (userError && !userError.message.includes("already registered")) {
    console.error("[register-free] Supabase user creation error:", userError);
    return NextResponse.json({ error: "שגיאה ביצירת חשבון" }, { status: 500 });
  }

  // Resolve userId (handle existing user case)
  let userId = newUser?.user?.id;
  if (!userId) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === email);
    userId = found?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "שגיאה ביצירת חשבון" }, { status: 500 });
  }

  // Generate password-reset link
  const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${baseUrl}/auth/login` },
  });
  const resetUrl = resetData?.properties?.action_link ?? `${baseUrl}/auth/login`;

  // Create vendor record
  const slug =
    slugify(businessName) + "-" + userId.slice(0, 6);

  const newVendor: NewVendor = {
    id: crypto.randomUUID(),
    userId,
    slug,
    businessName,
    category,
    city,
    phone: phone ?? null,
    email,
    plan: "free",
    status: "pending",
    role: "vendor",
  };

  try {
    await db.insert(vendors).values(newVendor);
  } catch (err) {
    console.error("[register-free] DB insert error:", err);
    return NextResponse.json({ error: "שגיאה בשמירת נתונים" }, { status: 500 });
  }

  // Send welcome email with password setup link
  try {
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: `WeddingPro <noreply@${hostname}>`,
      to: email,
      subject: "ברוכים הבאים ל-WeddingPro — הגדר את הסיסמה שלך",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
          <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 24px 28px;">
            <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">WeddingPro</p>
          </div>
          <div style="padding: 28px 32px; background:#ffffff;">
            <h2 style="margin:0 0 8px; color:#1a1614;">ברוכים הבאים ל-WeddingPro!</h2>
            <p style="margin:0 0 16px; color:#5a4a42; line-height:1.6;">
              פרופיל הספק שלך נוצר בהצלחה עבור <strong>${escapeHtml(businessName)}</strong>.
            </p>
            <p style="margin:0 0 20px; color:#5a4a42; line-height:1.6;">
              הפרופיל שלך <strong>ממתין לאישור</strong> מצוות WeddingPro. לאחר האישור הוא יופיע בדירקטורי.
            </p>
            <p style="margin:0 0 20px; color:#5a4a42; line-height:1.6;">
              כדי להתחיל למלא את הפרופיל, הגדר תחילה סיסמה:
            </p>
            <div style="text-align:center; margin: 24px 0;">
              <a href="${escapeHtml(resetUrl)}"
                 style="display:inline-block; background:linear-gradient(135deg,#b8976a,#9a7d56); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px;">
                הגדר סיסמה →
              </a>
            </div>
            <p style="margin:0; color:#9e8e86; font-size:13px;">
              הקישור תקף ל-24 שעות. לשאלות: <a href="mailto:support@${hostname}" style="color:#b8976a;">support@${hostname}</a>
            </p>
          </div>
          <div style="padding:12px 28px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
            WeddingPro — פלטפורמת ספקי חתונות בישראל
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[register-free] Welcome email error:", err);
    // Don't fail the request — account was created successfully
  }

  // Notify admin
  if (ADMIN_EMAIL) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: `WeddingPro <noreply@${hostname}>`,
        to: ADMIN_EMAIL,
        subject: `[WeddingPro] ספק חינמי חדש מחכה לאישור — ${businessName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h3>ספק חינמי חדש נרשם</h3>
            <ul>
              <li><strong>שם עסק:</strong> ${escapeHtml(businessName)}</li>
              <li><strong>אימייל:</strong> ${escapeHtml(email)}</li>
              <li><strong>עיר:</strong> ${escapeHtml(city)}</li>
              <li><strong>קטגוריה:</strong> ${escapeHtml(category)}</li>
              <li><strong>תוכנית:</strong> חינמי</li>
            </ul>
            <a href="${baseUrl}/admin/vendors"
               style="display:inline-block; background:#8c5f58; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">
              עבור לאדמין לאישור
            </a>
          </div>
        `,
      });
    } catch (err) {
      console.error("[register-free] Admin notification error:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
