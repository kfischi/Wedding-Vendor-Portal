import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { Resend } from "resend";
import { db } from "@/lib/db/db";
import { vendors, coupons, vendorCategoryEnum, type NewVendor } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import {
  NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY,
  ADMIN_EMAIL,
  FROM_EMAIL,
} from "@/lib/env";
import { escapeHtml } from "@/lib/security/sanitize";

const VALID_CATEGORIES = vendorCategoryEnum.enumValues;

const schema = z.object({
  email: z.string().email("אימייל לא תקין").max(255),
  businessName: z.string().min(2, "שם עסק נדרש").max(100),
  category: z.enum(VALID_CATEGORIES, { error: "קטגוריה לא תקינה" }),
  city: z.string().min(1, "עיר נדרשת").max(100),
  phone: z.string().max(20).optional(),
  couponCode: z.string().min(1, "קוד קופון נדרש").max(50),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים").max(72),
});

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Missing env vars: ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!key ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim()
    );
  }
  return createSupabaseAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/register-free
 *
 * Creates a 3-month trial vendor account via coupon code.
 * The coupon is validated against the DB; on success the vendor is
 * immediately active (plan: "standard") with a trialEndsAt 90 days out.
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

  const { email, businessName, category, city, phone, couponCode, password } = parsed.data;
  const now = new Date();

  // ── Validate coupon ──────────────────────────────────────────────────────────
  let coupon: typeof coupons.$inferSelect | undefined;
  try {
    const [found] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, couponCode.toUpperCase()),
          eq(coupons.isActive, true),
          lte(coupons.validFrom, now),
          or(isNull(coupons.validUntil), gte(coupons.validUntil, now))
        )
      )
      .limit(1);
    coupon = found;
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!coupon) {
    return NextResponse.json({ error: "קוד קופון לא תקין או שפג תוקפו" }, { status: 400 });
  }

  // Check max uses
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "קוד הקופון הגיע למגבלת השימוש" }, { status: 400 });
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    console.error("[register-free] Admin client init error:", err);
    return NextResponse.json(
      { error: "שגיאת תצורת שרת — פנה למנהל המערכת" },
      { status: 500 }
    );
  }

  const baseUrl = NEXT_PUBLIC_APP_URL;

  // Create Supabase auth user with the provided password
  const { data: newUser, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "vendor", plan: "standard" },
    });

  let userId = newUser?.user?.id;

  if (userError) {
    const isAlreadyExists =
      userError.message.toLowerCase().includes("already registered") ||
      userError.message.toLowerCase().includes("already exists") ||
      userError.message.toLowerCase().includes("email address has already been registered");

    if (!isAlreadyExists) {
      console.error("[register-free] Supabase createUser error:", userError.message);
      return NextResponse.json(
        { error: "שגיאה ביצירת חשבון: " + userError.message },
        { status: 500 }
      );
    }

    // Email already exists in Supabase auth — find userId via paginated search
    let page = 1;
    outer: while (true) {
      const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (listErr || !pageData?.users?.length) break;
      for (const u of pageData.users) {
        if (u.email === email) { userId = u.id; break outer; }
      }
      if (pageData.users.length < 1000) break;
      page++;
    }

    if (!userId) {
      // Edge case: email exists in Supabase but we can't find the userId
      return NextResponse.json(
        { error: "האימייל הזה כבר רשום. כנס דרך דף ההתחברות או אפס סיסמה." },
        { status: 409 }
      );
    }
  }

  if (!userId) {
    console.error("[register-free] No userId after createUser (unexpected)");
    return NextResponse.json({ error: "שגיאה ביצירת חשבון" }, { status: 500 });
  }

  // Compute trial end date (90 days from now)
  const trialEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Format trial end for display
  const trialEndDisplay = new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(trialEndsAt);

  // Create vendor record — active immediately, standard plan, 3-month trial
  const slug = slugify(businessName) + "-" + userId.slice(0, 6);

  const newVendor: NewVendor = {
    id: crypto.randomUUID(),
    userId,
    slug,
    businessName,
    category,
    city,
    phone: phone ?? null,
    email,
    plan: "standard",
    status: "active",
    role: "vendor",
    trialEndsAt,
  };

  try {
    await db.insert(vendors).values(newVendor);
  } catch (err) {
    console.error("[register-free] DB insert error:", err);
    return NextResponse.json({ error: "שגיאה בשמירת נתונים" }, { status: 500 });
  }

  // Increment coupon usage
  try {
    await db
      .update(coupons)
      .set({ usedCount: coupon.usedCount + 1 })
      .where(eq(coupons.id, coupon.id));
  } catch (err) {
    console.error("[register-free] Coupon increment error:", err);
    // Non-fatal — vendor is already created
  }

  // Send welcome email
  try {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "ברוכים הבאים ל-WeddingPro!",
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
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px 18px; margin:0 0 20px;">
              <p style="margin:0; color:#166534; font-weight:bold; font-size:14px;">✓ תקופת ניסיון של 3 חודשים פעילה</p>
              <p style="margin:6px 0 0; color:#166534; font-size:13px;">
                הפרופיל שלך פעיל ומופיע בדירקטורי עד <strong>${trialEndDisplay}</strong>.
              </p>
            </div>
            <div style="text-align:center; margin: 24px 0;">
              <a href="${escapeHtml(baseUrl)}/dashboard"
                 style="display:inline-block; background:linear-gradient(135deg,#b8976a,#9a7d56); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px;">
                כניסה ללוח הבקרה →
              </a>
            </div>
            <p style="margin:0; color:#9e8e86; font-size:13px;">
              לשאלות: <a href="mailto:info@weddingpro.co.il" style="color:#b8976a;">info@weddingpro.co.il</a>
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
  }

  // Notify admin
  if (ADMIN_EMAIL) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[WeddingPro] ספק ניסיון חדש — ${businessName}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h3>ספק ניסיון חדש נרשם</h3>
            <ul>
              <li><strong>שם עסק:</strong> ${escapeHtml(businessName)}</li>
              <li><strong>אימייל:</strong> ${escapeHtml(email)}</li>
              <li><strong>עיר:</strong> ${escapeHtml(city)}</li>
              <li><strong>קטגוריה:</strong> ${escapeHtml(category)}</li>
              <li><strong>קוד קופון:</strong> ${escapeHtml(couponCode.toUpperCase())}</li>
              <li><strong>ניסיון עד:</strong> ${trialEndDisplay}</li>
            </ul>
            <a href="${baseUrl}/admin/vendors"
               style="display:inline-block; background:#8c5f58; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">
              עבור לאדמין
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
