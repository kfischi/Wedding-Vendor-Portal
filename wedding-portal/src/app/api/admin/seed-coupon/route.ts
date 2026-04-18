import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/seed-coupon
 *
 * Ensures the WEDDINGPRO launch coupon exists in the database.
 * Idempotent — safe to call multiple times.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Check if coupon already exists
    const [existing] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, "WEDDINGPRO"))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        ok: true,
        status: "already_exists",
        coupon: {
          code: existing.code,
          isActive: existing.isActive,
          usedCount: existing.usedCount,
          maxUses: existing.maxUses,
          validFrom: existing.validFrom,
          validUntil: existing.validUntil,
        },
      });
    }

    // Insert the coupon
    await db.insert(coupons).values({
      id: "coupon-weddingpro-launch",
      code: "WEDDINGPRO",
      discountType: "percentage",
      discountValue: 100,
      maxUses: null,
      usedCount: 0,
      validFrom: new Date("2026-01-01"),
      validUntil: null,
      isActive: true,
    });

    return NextResponse.json({
      ok: true,
      status: "created",
      coupon: { code: "WEDDINGPRO", isActive: true, usedCount: 0 },
    });
  } catch (err) {
    console.error("[seed-coupon]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
