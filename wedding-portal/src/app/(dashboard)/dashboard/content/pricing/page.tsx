export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorPricing } from "@/lib/db/schema";
import { PricingEditor } from "@/components/dashboard/PricingEditor";
import type { VendorPricing } from "@/lib/db/schema";

export const metadata: Metadata = { title: "חבילות מחירים | WeddingPro" };

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let packages: VendorPricing[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      packages = await db
        .select()
        .from(vendorPricing)
        .where(eq(vendorPricing.vendorId, vendor.id))
        .orderBy(vendorPricing.sortOrder);
    }
  } catch {
    // DB not connected
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא. אנא צור קשר עם התמיכה.</p>
      </div>
    );
  }

  if (vendor.plan !== "premium") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <p className="font-display text-3xl text-obsidian">חבילות מחירים</p>
        <p className="text-stone">
          ניהול חבילות מחירים זמין בתוכנית{" "}
          <span className="font-medium text-gold">Premium</span> בלבד.
        </p>
        <a
          href="/dashboard/billing"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium bg-dusty-rose text-white hover:opacity-90 transition-opacity"
        >
          שדרג לפרימיום
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="font-script text-xl text-gold">ניהול</p>
        <h1 className="font-display text-4xl text-obsidian">חבילות מחירים</h1>
        <p className="text-stone text-sm mt-2">
          הגדר חבילות שיוצגו לזוגות בדף הפרופיל שלך
        </p>
      </div>

      <PricingEditor packages={packages} vendorId={vendor.id} />
    </div>
  );
}
