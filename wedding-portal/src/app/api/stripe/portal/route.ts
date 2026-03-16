import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/config";
import { NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session for the authenticated vendor
 * and returns the redirect URL. The client redirects to this URL so the
 * vendor can manage their subscription (cancel, upgrade, update payment).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let vendor;
  try {
    const rows = await db
      .select({
        id: vendors.id,
        stripeCustomerId: vendors.stripeCustomerId,
      })
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  if (!vendor.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe billing account found for this vendor" },
      { status: 404 }
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: vendor.stripeCustomerId,
      return_url: `${NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal error";
    console.error("[stripe/portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
