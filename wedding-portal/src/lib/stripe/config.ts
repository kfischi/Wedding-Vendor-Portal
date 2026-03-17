import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover", typescript: true });
  }
  return _stripe;
}

export const PLANS = {
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    amount: 34900, // אגורות — ₪349
  },
} as const;

export type PaidPlan = keyof typeof PLANS;

// ─── Plan feature limits ────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free:    { maxImages: 5,  hasWhatsApp: false, hasVideo: false, hasHero: false },
  premium: { maxImages: 20, hasWhatsApp: true,  hasVideo: true,  hasHero: true  },
} as const satisfies Record<"free" | "premium", { maxImages: number; hasWhatsApp: boolean; hasVideo: boolean; hasHero: boolean }>;

export async function createCheckoutSession(
  plan: PaidPlan,
  vendorEmail: string,
  couponCode?: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const priceId = PLANS[plan].priceId;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: vendorEmail,
    success_url: `${baseUrl}/dashboard?welcome=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { plan, vendorEmail },
    subscription_data: {
      metadata: { plan, vendorEmail },
    },
    ...(couponCode
      ? { discounts: [{ coupon: couponCode }] }
      : { allow_promotion_codes: true }),
  };

  const session = await getStripe().checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error("לא ניתן ליצור סשן Stripe");
  }

  return session.url;
}
