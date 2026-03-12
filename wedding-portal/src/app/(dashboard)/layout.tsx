import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  // טוען את נתוני הספק
  let vendor = null;
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
  } catch {
    // DB לא מחובר עדיין — ממשיכים עם ברירות מחדל
  }

  const businessName = vendor?.businessName ?? user.email ?? "הספק שלי";

  const cookieStore = await cookies();
  const isImpersonating =
    cookieStore.get("x-admin-impersonating")?.value === "1";

  return (
    <div className="min-h-screen bg-ivory flex flex-row-reverse" dir="rtl">
      <Sidebar businessName={businessName} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Impersonation banner */}
        {isImpersonating && <ImpersonationBanner />}

        {/* Header */}
        <header className="sticky top-0 z-30 bg-ivory/80 backdrop-blur-sm border-b border-champagne px-6 py-4 flex items-center justify-between lg:pr-6 pr-16">
          <div>
            <p className="text-xs text-stone">לוח בקרה</p>
            <h2 className="font-display text-xl text-obsidian leading-tight">
              {businessName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-stone bg-champagne/60 px-3 py-1 rounded-full">
              {user.email}
            </span>
          </div>
        </header>

        {/* תוכן */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
