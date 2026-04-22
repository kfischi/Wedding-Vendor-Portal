import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";
import { vendors, coupons, vendorCategoryEnum } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

/**
 * GET /api/admin/test-register
 *
 * Full step-by-step simulation of /api/register-free using test data.
 * Creates and cleans up real data to test every step.
 * Requires admin auth.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const steps: { step: string; status: "ok" | "error" | "skip"; detail: string }[] = [];

  const VALID_CATEGORIES = vendorCategoryEnum.enumValues;
  const testEmail = `test-diag-${Date.now()}@weddingpro-test.invalid`;
  const testPassword = "TestDiag1234!";
  const testData = {
    email: testEmail,
    businessName: "סטודיו בדיקה",
    category: "photography",
    city: "תל אביב",
    phone: "050-0000000",
    couponCode: "WEDDINGPRO",
    password: testPassword,
  };
  let createdUserId: string | undefined;
  let createdVendorId: string | undefined;

  // ── Step 1: Zod schema validation ────────────────────────────────────────────
  try {
    const schema = z.object({
      email: z.string().email().max(255),
      businessName: z.string().min(2).max(100),
      category: z.enum(VALID_CATEGORIES),
      city: z.string().min(1).max(100),
      phone: z.string().max(20).optional(),
      couponCode: z.string().min(1).max(50),
      password: z.string().min(8).max(72),
    });
    const result = schema.safeParse(testData);
    if (!result.success) throw new Error(result.error.issues[0]?.message ?? "validation failed");
    steps.push({ step: "zod_validation", status: "ok", detail: "Zod schema עבד תקין" });
  } catch (err) {
    steps.push({ step: "zod_validation", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Step 2: DB connection ─────────────────────────────────────────────────────
  try {
    await db.execute(sql`SELECT 1`);
    steps.push({ step: "db_connection", status: "ok", detail: "DB מגיב" });
  } catch (err) {
    steps.push({ step: "db_connection", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Step 3: Coupon query ──────────────────────────────────────────────────────
  try {
    const now = new Date();
    const [coupon] = await db.select().from(coupons).where(
      and(
        eq(coupons.code, "WEDDINGPRO"),
        eq(coupons.isActive, true),
        lte(coupons.validFrom, now),
        or(isNull(coupons.validUntil), gte(coupons.validUntil, now))
      )
    ).limit(1);
    if (!coupon) throw new Error("קופון לא נמצא או לא פעיל");
    steps.push({ step: "coupon_check", status: "ok", detail: `קופון תקין — שימוש ${coupon.usedCount}/${coupon.maxUses ?? "∞"}` });
  } catch (err) {
    steps.push({ step: "coupon_check", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Step 4: Vendor email uniqueness check ─────────────────────────────────────
  try {
    const [existing] = await db.select({ id: vendors.id }).from(vendors)
      .where(eq(vendors.email, testEmail)).limit(1);
    if (existing) throw new Error("אימייל בדיקה כבר קיים ב-vendors — לא צפוי");
    steps.push({ step: "vendor_email_check", status: "ok", detail: "אימייל בדיקה פנוי" });
  } catch (err) {
    steps.push({ step: "vendor_email_check", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Step 5: Supabase admin createUser ─────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: "vendor", plan: "standard" },
    });
    if (error) throw error;
    createdUserId = data.user?.id;
    if (!createdUserId) throw new Error("userId ריק אחרי createUser");
    steps.push({ step: "supabase_create_user", status: "ok", detail: `userId: ${createdUserId}` });
  } catch (err) {
    steps.push({ step: "supabase_create_user", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Step 6: DB insert vendor ──────────────────────────────────────────────────
  const vendorId = crypto.randomUUID();
  const slug = slugify(testData.businessName) + "-" + createdUserId.slice(0, 6);
  const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  try {
    await db.insert(vendors).values({
      id: vendorId,
      userId: createdUserId,
      slug,
      businessName: testData.businessName,
      category: testData.category as typeof VALID_CATEGORIES[number],
      city: testData.city,
      phone: testData.phone ?? null,
      email: testData.email,
      plan: "standard",
      status: "active",
      role: "vendor",
      trialEndsAt,
    });
    createdVendorId = vendorId;
    steps.push({ step: "db_insert_vendor", status: "ok", detail: `vendor id: ${vendorId}, slug: ${slug}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({ step: "db_insert_vendor", status: "error", detail: msg });
    // cleanup user
    try { await admin.auth.admin.deleteUser(createdUserId); } catch {}
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  const cleanupErrors: string[] = [];
  try {
    await db.delete(vendors).where(eq(vendors.id, vendorId));
  } catch (err) {
    cleanupErrors.push("vendor delete: " + String(err));
  }
  try {
    await admin.auth.admin.deleteUser(createdUserId);
  } catch (err) {
    cleanupErrors.push("user delete: " + String(err));
  }

  steps.push({
    step: "cleanup",
    status: cleanupErrors.length === 0 ? "ok" : "error",
    detail: cleanupErrors.length === 0 ? "נתוני בדיקה נמחקו" : cleanupErrors.join(", "),
  });

  return NextResponse.json({ steps, overall: "ok" });
}
