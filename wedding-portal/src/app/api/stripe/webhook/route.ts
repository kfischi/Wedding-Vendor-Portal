import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/config";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { n8nVendorPaymentCompleted } from "@/lib/n8n";

export const runtime = "nodejs";

// Supabase admin client (service role)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const { plan, vendorEmail } = session.metadata ?? {};

  if (!plan || !vendorEmail) {
    console.error("[webhook] Missing metadata:", session.metadata);
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // ── 1. צור משתמש ב-Supabase Auth ───────────────────────────────────────────
  const tempPassword = crypto.randomUUID();
  const { data: newUser, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email: vendorEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "vendor", plan },
    });

  if (userError && !userError.message.includes("already registered")) {
    console.error("[webhook] Error creating user:", userError);
    return;
  }

  // אם משתמש קיים — שלוף אותו
  let userId = newUser?.user?.id;
  if (!userId) {
    const { data: existing } =
      await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === vendorEmail);
    userId = found?.id;
  }

  if (!userId) {
    console.error("[webhook] Could not resolve userId for", vendorEmail);
    return;
  }

  // ── 2. שלח מייל reset password לספק ────────────────────────────────────────
  const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: vendorEmail,
    options: { redirectTo: `${baseUrl}/auth/login` },
  });

  const resetUrl =
    resetData?.properties?.action_link ?? `${baseUrl}/auth/login`;

  await resend.emails.send({
    from: `WeddingPro <noreply@${new URL(baseUrl).hostname}>`,
    to: vendorEmail,
    subject: "ברוכים הבאים ל-WeddingPro — הגדר את הסיסמה שלך",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1614;">ברוכים הבאים ל-WeddingPro!</h2>
        <p>תשלומך התקבל בהצלחה עבור תוכנית <strong>${plan === "premium" ? "פרמיום" : "סטנדרט"}</strong>.</p>
        <p>כדי להתחיל, עליך להגדיר סיסמה לחשבון שלך:</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background: #8c5f58;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
        ">
          הגדר סיסמה
        </a>
        <p style="color: #6b5f5a; font-size: 14px;">
          הקישור תקף ל-24 שעות. לאחר הגדרת הסיסמה, תוכל להיכנס ולמלא את פרופיל הספק שלך.
        </p>
        <p style="color: #6b5f5a; font-size: 14px;">
          הפרופיל שלך יפורסם לאחר אישור ידני מצוות WeddingPro.
        </p>
      </div>
    `,
  });

  // ── 3. צור רשומת vendor ב-DB ────────────────────────────────────────────────
  const slug = slugify(vendorEmail.split("@")[0]) + "-" + userId.slice(0, 6);

  try {
    await db.insert(vendors).values({
      id: crypto.randomUUID(),
      userId,
      slug,
      businessName: vendorEmail.split("@")[0],
      category: "other",
      city: "",
      email: vendorEmail,
      plan: plan as "standard" | "premium",
      status: "pending",
      role: "vendor",
      stripeCustomerId: session.customer as string | null,
      stripeSubscriptionId: session.subscription as string | null,
    });
  } catch (dbError) {
    console.error("[webhook] DB insert error:", dbError);
  }

  // ── 4. Trigger n8n webhook (non-blocking) ────────────────────────────────────
  void n8nVendorPaymentCompleted({
    vendor_email: vendorEmail,
    plan,
    stripe_session_id: session.id,
    stripe_customer_id: (session.customer as string | null) ?? null,
  });

  // ── 5. שלח התראה לאדמין ─────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await resend.emails.send({
      from: `WeddingPro <noreply@${new URL(baseUrl).hostname}>`,
      to: adminEmail,
      subject: `[WeddingPro] ספק חדש מחכה לאישור — ${vendorEmail}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h3>ספק חדש נרשם ומחכה לאישור</h3>
          <ul>
            <li><strong>אימייל:</strong> ${vendorEmail}</li>
            <li><strong>תוכנית:</strong> ${plan}</li>
            <li><strong>Stripe Session:</strong> ${session.id}</li>
          </ul>
          <a href="${baseUrl}/admin/vendors" style="
            display: inline-block;
            background: #8c5f58;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
          ">
            עבור לאדמין לאישור
          </a>
        </div>
      `,
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      default:
        // אירועים אחרים — מתעלמים בינתיים
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Internal handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
