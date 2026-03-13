"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";

const contentSchema = z.object({
  businessName: z.string().min(2, "שם עסק חייב להכיל לפחות 2 תווים"),
  shortDescription: z.string().max(160, "Tagline עד 160 תווים").optional(),
  category: z.enum([
    "photography","videography","venue","catering","flowers",
    "music","dj","makeup","dress","suit","cake","invitation",
    "transport","lighting","planning","wedding-dress-designers","other",
  ]),
  city: z.string().min(2, "נדרש שם עיר"),
  region: z.string().optional(),
  description: z.string().max(1000, "תיאור עד 1000 תווים").optional(),
  phone: z.string().optional(),
  email: z.string().email("אימייל לא תקין"),
  website: z.string().url("כתובת אתר לא תקינה").optional().or(z.literal("")),
  instagram: z.string().optional(),
  seoTitle: z.string().max(70, "SEO Title עד 70 תווים").optional(),
  seoDescription: z.string().max(160, "SEO Description עד 160 תווים").optional(),
});

export type ContentFormState = {
  error?: string;
  success?: boolean;
};

export async function updateContentAction(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = contentSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "שגיאה בנתונים" };
  }

  const data = parsed.data;

  try {
    await db
      .update(vendors)
      .set({
        businessName: data.businessName,
        shortDescription: data.shortDescription ?? null,
        category: data.category,
        city: data.city,
        region: data.region ?? null,
        description: data.description ?? null,
        phone: data.phone ?? null,
        email: data.email,
        website: data.website || null,
        instagram: data.instagram ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        updatedAt: new Date(),
      })
      .where(eq(vendors.userId, user.id));
  } catch {
    return { error: "שגיאה בשמירה — נסה שוב" };
  }

  return { success: true };
}
