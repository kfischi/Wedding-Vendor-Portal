import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  let isAdmin = user.email === adminEmail;

  if (!isAdmin) {
    try {
      const rows = await db
        .select({ role: vendors.role })
        .from(vendors)
        .where(eq(vendors.userId, user.id))
        .limit(1);
      isAdmin = rows[0]?.role === "admin";
    } catch {}
  }

  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-row-reverse" dir="rtl">
      <AdminSidebar adminEmail={user.email ?? ""} />
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ background: "rgb(244 242 239)" }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-obsidian border-b border-white/10 px-6 py-4 flex items-center justify-between lg:pr-6 pr-16">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              ניהול מערכת
            </p>
            <h2 className="font-display text-xl text-gold leading-tight">
              Wedding Vendor Portal
            </h2>
          </div>
          <span className="hidden sm:block text-xs text-white/50 bg-white/10 px-3 py-1.5 rounded-full">
            {user.email}
          </span>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
