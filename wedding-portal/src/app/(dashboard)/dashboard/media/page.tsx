import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia } from "@/lib/db/schema";
import { MediaManager } from "@/components/dashboard/MediaManager";
import type { VendorMedia } from "@/lib/db/schema";

export const metadata = { title: "מדיה | WeddingPro" };

export default async function MediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let media: VendorMedia[] = [];

  try {
    const vendorRows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = vendorRows[0] ?? null;

    if (vendor) {
      media = await db
        .select()
        .from(vendorMedia)
        .where(eq(vendorMedia.vendorId, vendor.id))
        .orderBy(vendorMedia.sortOrder);
    }
  } catch {
    // DB not connected yet
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="font-script text-xl text-gold">ניהול</p>
        <h1 className="font-display text-4xl text-obsidian">גלריית מדיה</h1>
        <p className="text-stone text-sm mt-2">
          {vendor.plan === "premium"
            ? "Premium: תמונות וסרטונים ללא הגבלה"
            : "Standard: עד 20 תמונות"}
        </p>
      </div>
      <MediaManager
        initialMedia={media}
        plan={vendor.plan}
        vendorId={vendor.id}
        currentCoverImage={vendor.coverImage}
      />
    </div>
  );
}
