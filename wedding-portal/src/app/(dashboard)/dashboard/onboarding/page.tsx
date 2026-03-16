export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "הגדרת פרופיל | WeddingPro" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
  } catch {
    // DB not connected
  }

  if (!vendor) {
    redirect("/dashboard");
  }

  // If profile is already substantially complete, skip wizard
  const isComplete =
    vendor.description &&
    vendor.description.length > 20 &&
    vendor.phone &&
    vendor.coverImage;

  if (isComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <OnboardingWizard vendor={vendor} />
    </div>
  );
}
