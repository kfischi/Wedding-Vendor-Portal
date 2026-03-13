"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import { vendors, coupons, adminLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Admin Guard ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("לא מחובר");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email === adminEmail) return user;

  try {
    const rows = await db
      .select({ role: vendors.role })
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    if (rows[0]?.role === "admin") return user;
  } catch {}

  throw new Error("אין הרשאת מנהל");
}

function createAdminSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Vendor Actions ───────────────────────────────────────────────────────────

export async function approveVendor(vendorId: string) {
  const admin = await requireAdmin();
  await db
    .update(vendors)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(vendors.id, vendorId));
  await db.insert(adminLogs).values({
    id: crypto.randomUUID(),
    adminId: admin.id,
    action: "approve_vendor",
    targetType: "vendor",
    targetId: vendorId,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
}

export async function suspendVendor(vendorId: string) {
  const admin = await requireAdmin();
  await db
    .update(vendors)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(vendors.id, vendorId));
  await db.insert(adminLogs).values({
    id: crypto.randomUUID(),
    adminId: admin.id,
    action: "suspend_vendor",
    targetType: "vendor",
    targetId: vendorId,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
}

export async function overridePlan(formData: FormData) {
  const admin = await requireAdmin();
  const schema = z.object({
    vendorId: z.string().min(1),
    plan: z.enum(["free", "standard", "premium"]),
  });
  const parsed = schema.safeParse({
    vendorId: formData.get("vendorId"),
    plan: formData.get("plan"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await db
    .update(vendors)
    .set({ plan: parsed.data.plan, updatedAt: new Date() })
    .where(eq(vendors.id, parsed.data.vendorId));
  await db.insert(adminLogs).values({
    id: crypto.randomUUID(),
    adminId: admin.id,
    action: "override_plan",
    targetType: "vendor",
    targetId: parsed.data.vendorId,
    metadata: { plan: parsed.data.plan },
  });
  revalidatePath(`/admin/vendors/${parsed.data.vendorId}`);
  revalidatePath("/admin/vendors");
}

export async function impersonateVendor(vendorEmail: string) {
  await requireAdmin();
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: vendorEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
  if (error || !data.properties?.action_link) {
    throw new Error("לא ניתן ליצור קישור כניסה");
  }
  // Mark session as impersonation so the dashboard can show a banner
  const cookieStore = await cookies();
  cookieStore.set("x-admin-impersonating", "1", {
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(data.properties.action_link);
}

export async function deleteVendor(vendorId: string) {
  const admin = await requireAdmin();
  await db.insert(adminLogs).values({
    id: crypto.randomUUID(),
    adminId: admin.id,
    action: "delete_vendor",
    targetType: "vendor",
    targetId: vendorId,
  });
  await db.delete(vendors).where(eq(vendors.id, vendorId));
  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete("x-admin-impersonating");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

// ─── Coupon Actions ───────────────────────────────────────────────────────────

const CouponSchema = z.object({
  code: z
    .string()
    .min(3, "קוד חייב להיות לפחות 3 תווים")
    .max(20, "קוד ארוך מדי"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(1, "ערך חייב להיות לפחות 1"),
  maxUses: z.coerce.number().min(1).optional(),
  validUntil: z.string().optional(),
});

export async function createCoupon(formData: FormData) {
  await requireAdmin();
  const raw = {
    code: (formData.get("code") as string | null)?.toUpperCase().trim(),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    maxUses: formData.get("maxUses") || undefined,
    validUntil: formData.get("validUntil") || undefined,
  };
  const parsed = CouponSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await db.insert(coupons).values({
    id: crypto.randomUUID(),
    code: parsed.data.code,
    discountType: parsed.data.discountType,
    discountValue: parsed.data.discountValue,
    maxUses: parsed.data.maxUses ?? null,
    validUntil: parsed.data.validUntil
      ? new Date(parsed.data.validUntil)
      : null,
    usedCount: 0,
    isActive: true,
  });
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(couponId: string, currentState: boolean) {
  await requireAdmin();
  await db
    .update(coupons)
    .set({ isActive: !currentState })
    .where(eq(coupons.id, couponId));
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();
  await db.delete(coupons).where(eq(coupons.id, couponId));
  revalidatePath("/admin/coupons");
}

// ─── Settings Actions ─────────────────────────────────────────────────────────

export async function broadcastAnnouncement(formData: FormData) {
  await requireAdmin();
  const subject = (formData.get("subject") as string | null)?.trim();
  const message = (formData.get("message") as string | null)?.trim();
  if (!subject || !message) throw new Error("נושא והודעה הם שדות חובה");

  const activeVendors = await db
    .select({ email: vendors.email, businessName: vendors.businessName })
    .from(vendors)
    .where(eq(vendors.status, "active"));

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && activeVendors.length > 0) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "noreply@wedding-vendor-portal.com";

    await Promise.allSettled(
      activeVendors.map((v) =>
        resend.emails.send({
          from: fromEmail,
          to: v.email,
          subject,
          html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <p>שלום ${v.businessName},</p>
              <div style="white-space:pre-wrap">${message}</div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e8ddd0"/>
              <p style="font-size:12px;color:#6b5f5a">Wedding Vendor Portal</p>
            </div>
          `,
        })
      )
    );
  }

  revalidatePath("/admin/settings");
}
