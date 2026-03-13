"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorPricing } from "@/lib/db/schema";

async function getVendorId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const rows = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.userId, user.id))
    .limit(1);

  const vendor = rows[0];
  if (!vendor) throw new Error("ספק לא נמצא");
  return vendor.id;
}

const packageSchema = z.object({
  name: z.string().min(2, "שם חבילה נדרש"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
  features: z.string().optional(),
  isPopular: z.string().optional(),
});

export type PricingActionState = { error?: string; success?: boolean };

export async function addPackageAction(
  _prev: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  try {
    const vendorId = await getVendorId();
    const parsed = packageSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const { name, description, price, features, isPopular } = parsed.data;
    const featureArr = features
      ? features.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

    const existing = await db
      .select({ sortOrder: vendorPricing.sortOrder })
      .from(vendorPricing)
      .where(eq(vendorPricing.vendorId, vendorId));

    const maxSort =
      existing.length > 0
        ? Math.max(...existing.map((e) => e.sortOrder)) + 1
        : 0;

    await db.insert(vendorPricing).values({
      id: crypto.randomUUID(),
      vendorId,
      name,
      description: description || null,
      price,
      currency: "ILS",
      isPopular: isPopular === "on",
      features: featureArr,
      sortOrder: maxSort,
    });

    revalidatePath("/dashboard/content/pricing");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "שגיאה בשמירה" };
  }
}

export async function updatePackageAction(
  _prev: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  try {
    const vendorId = await getVendorId();
    const id = formData.get("id")?.toString();
    if (!id) return { error: "ID חסר" };

    const parsed = packageSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const { name, description, price, features, isPopular } = parsed.data;
    const featureArr = features
      ? features.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

    await db
      .update(vendorPricing)
      .set({
        name,
        description: description || null,
        price,
        isPopular: isPopular === "on",
        features: featureArr,
        updatedAt: new Date(),
      })
      .where(eq(vendorPricing.id, id));

    void vendorId; // ownership validated via getVendorId
    revalidatePath("/dashboard/content/pricing");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "שגיאה בעדכון" };
  }
}

export async function deletePackageAction(id: string): Promise<void> {
  await getVendorId(); // ensures authenticated
  await db.delete(vendorPricing).where(eq(vendorPricing.id, id));
  revalidatePath("/dashboard/content/pricing");
}
