import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type PaidPlan } from "@/lib/stripe/config";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["premium"]),
  email: z.string().email(),
  coupon: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { plan, email, coupon } = parsed.data;

  try {
    const url = await createCheckoutSession(plan as PaidPlan, email, coupon);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout error";
    console.error("[/api/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
