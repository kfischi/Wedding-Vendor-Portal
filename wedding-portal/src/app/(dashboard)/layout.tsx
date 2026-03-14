import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let vendor = null;
  let newLeadsCount = 0;

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(leads)
        .where(and(eq(leads.vendorId, vendor.id), eq(leads.status, "new")));
      newLeadsCount = Number(value) ?? 0;
    }
  } catch {
    // DB not connected yet — continue with defaults
  }

  const businessName = vendor?.businessName ?? user.email ?? "הספק שלי";
  const plan = vendor?.plan ?? "free";

  const cookieStore = await cookies();
  const isImpersonating =
    cookieStore.get("x-admin-impersonating")?.value === "1";

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-row-reverse" dir="rtl">
      <Sidebar businessName={businessName} plan={plan} newLeadsCount={newLeadsCount} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {isImpersonating && <ImpersonationBanner />}

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[#faf9f7]/90 backdrop-blur-md border-b border-champagne/60 px-4 lg:px-6 py-3.5 flex items-center justify-between lg:pr-6 pr-16">
          <div>
            <p className="text-xs text-stone/50 font-medium tracking-wide">לוח בקרה</p>
            <h2 className="font-display text-lg text-obsidian leading-tight mt-0.5">
              {businessName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-stone/60 bg-champagne/40 px-3 py-1.5 rounded-full border border-champagne/60">
              {user.email}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
