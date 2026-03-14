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
    <div
      className="min-h-screen flex flex-row-reverse"
      dir="rtl"
      style={{ background: "#0a0a0a" }}
    >
      <AdminSidebar adminEmail={user.email ?? ""} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between lg:pr-6 pr-16"
          style={{
            background: "#0a0a0a",
            borderBottom: "1px solid rgba(184,147,90,0.2)",
          }}
        >
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              ניהול מערכת
            </p>
            <h2
              className="font-script leading-tight"
              style={{ color: "#b8935a", fontSize: "1.35rem" }}
            >
              WeddingPro Admin
            </h2>
          </div>
          <span
            className="hidden sm:block text-xs px-3 py-1.5 rounded-full"
            style={{
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {user.email}
          </span>
        </header>

        <main className="flex-1 p-6" style={{ background: "#111111" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
