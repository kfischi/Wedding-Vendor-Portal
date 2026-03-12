import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const PLANS = {
  standard: {
    name: "Standard",
    priceId: process.env.STRIPE_STANDARD_PRICE_ID!,
    amount: 14900, // אגורות — ₪149
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    amount: 34900, // אגורות — ₪349
  },
} as const;

export type PaidPlan = keyof typeof PLANS;

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

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error("לא ניתן ליצור סשן Stripe");
  }

  return session.url;
}
