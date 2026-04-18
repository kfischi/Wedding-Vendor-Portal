import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe/config";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { FROM_EMAIL } from "@/lib/env";

export const runtime = "nodejs";

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

  let userId = newUser?.user?.id;
  if (!userId) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
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
    from: FROM_EMAIL,
    to: vendorEmail,
    subject: "ברוכים הבאים ל-WeddingPro — הגדר את הסיסמה שלך",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
        <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 24px 28px;">
          <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">WeddingPro</p>
        </div>
        <div style="padding: 28px 32px; background:#ffffff;">
          <h2 style="margin:0 0 8px; color:#1a1614;">ברוכים הבאים ל-WeddingPro!</h2>
          <p style="margin:0 0 16px; color:#5a4a42; line-height:1.6;">
            תשלומך התקבל בהצלחה עבור תוכנית <strong>סטנדרט ₪179/חודש</strong>.
          </p>
          <p style="margin:0 0 20px; color:#5a4a42; line-height:1.6;">
            כדי להתחיל, הגדר סיסמה לחשבון שלך:
          </p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${resetUrl}"
               style="display:inline-block; background:linear-gradient(135deg,#b8976a,#9a7d56); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px;">
              הגדר סיסמה →
            </a>
          </div>
          <p style="margin:0; color:#9e8e86; font-size:13px;">
            הקישור תקף ל-24 שעות. הפרופיל יפורסם לאחר אישור ידני.
          </p>
        </div>
        <div style="padding:12px 28px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
          WeddingPro — פלטפורמת ספקי חתונות בישראל
        </div>
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
      plan: "standard",
      status: "pending",
      role: "vendor",
      stripeCustomerId: session.customer as string | null,
      stripeSubscriptionId: session.subscription as string | null,
      subscriptionStatus: "active",
    });
  } catch (dbError) {
    console.error("[webhook] DB insert error:", dbError);
  }

  // ── 4. שלח התראה לאדמין ─────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[WeddingPro] ספק חדש מחכה לאישור — ${vendorEmail}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h3>ספק חדש נרשם ומחכה לאישור</h3>
          <ul>
            <li><strong>אימייל:</strong> ${vendorEmail}</li>
            <li><strong>תוכנית:</strong> סטנדרט ₪179/חודש</li>
            <li><strong>Stripe Session:</strong> ${session.id}</li>
          </ul>
          <a href="${baseUrl}/admin/vendors" style="
            display: inline-block; background: #8c5f58; color: white;
            padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            עבור לאדמין לאישור
          </a>
        </div>
      `,
    });
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const subId = subscription.id;
  const status = subscription.status; // active | past_due | canceled | unpaid | trialing

  try {
    await db
      .update(vendors)
      .set({ subscriptionStatus: status })
      .where(eq(vendors.stripeSubscriptionId, subId));
    console.log(`[webhook] subscription.updated: ${subId} → ${status}`);
  } catch (err) {
    console.error("[webhook] subscription.updated DB error:", err);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const subId = subscription.id;

  try {
    await db
      .update(vendors)
      .set({
        subscriptionStatus: "canceled",
        plan: "free",
      })
      .where(eq(vendors.stripeSubscriptionId, subId));
    console.log(`[webhook] subscription.deleted: ${subId} → downgraded to free`);
  } catch (err) {
    console.error("[webhook] subscription.deleted DB error:", err);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  // In Stripe API 2026-02-25, subscription reference is under invoice.parent
  const parent = (invoice as unknown as Record<string, unknown>).parent as Record<string, unknown> | null | undefined;
  const subId = (parent?.subscription_details as Record<string, unknown> | null)?.subscription_id as string | null ?? null;

  if (!subId) return;

  try {
    await db
      .update(vendors)
      .set({ subscriptionStatus: "past_due" })
      .where(eq(vendors.stripeSubscriptionId, subId));
    console.log(`[webhook] invoice.payment_failed: ${subId} → past_due`);
  } catch (err) {
    console.error("[webhook] invoice.payment_failed DB error:", err);
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
