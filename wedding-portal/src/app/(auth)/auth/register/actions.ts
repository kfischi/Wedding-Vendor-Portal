"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorCategoryEnum, type NewVendor } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { redirect } from "next/navigation";

const VALID_CATEGORIES = vendorCategoryEnum.enumValues;

const schema = z.object({
  email:        z.string().email("אימייל לא תקין").max(255),
  password:     z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  businessName: z.string().min(2, "שם עסק נדרש").max(100),
  category:     z.enum(VALID_CATEGORIES, { error: "יש לבחור קטגוריה" }),
  city:         z.string().min(1, "עיר נדרשת").max(100),
  phone:        z.string().max(20).optional(),
});

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    email:        formData.get("email")?.toString().trim() ?? "",
    password:     formData.get("password")?.toString() ?? "",
    businessName: formData.get("businessName")?.toString().trim() ?? "",
    category:     formData.get("category")?.toString() ?? "",
    city:         formData.get("city")?.toString().trim() ?? "",
    phone:        formData.get("phone")?.toString().trim() || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const { email, password, businessName, category, city, phone } = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      return { error: "כתובת אימייל זו כבר רשומה — נסה להתחבר" };
    }
    return { error: "שגיאה ביצירת חשבון — נסה שוב" };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "שגיאה ביצירת חשבון" };

  const slug = slugify(businessName) + "-" + userId.slice(0, 6);

  try {
    const newVendor: NewVendor = {
      id: crypto.randomUUID(),
      userId,
      slug,
      businessName,
      category: category as (typeof VALID_CATEGORIES)[number],
      city,
      phone: phone ?? null,
      email,
      plan: "free",
      status: "pending",
      role: "vendor",
    };
    await db.insert(vendors).values(newVendor);
  } catch (dbErr) {
    console.error("[register] DB insert error:", dbErr);
    // User was created — still continue
  }

  redirect("/dashboard");
}
