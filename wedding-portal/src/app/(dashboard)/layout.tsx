import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { ShieldX, Clock } from "lucide-react";
import Link from "next/link";

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

  // Suspended vendor gate — show a full-page block before rendering the dashboard
  if (vendor?.status === "suspended") {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto">
            <ShieldX className="h-9 w-9 text-red-500" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-obsidian mb-2">החשבון הושעה</h1>
            <p className="text-stone/70 leading-relaxed">
              החשבון שלך הושעה זמנית על ידי צוות WeddingPro.
              הפרופיל שלך אינו מוצג כרגע בדירקטורי.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-5 text-sm text-stone/70 text-right space-y-2">
            <p className="font-semibold text-obsidian text-xs mb-1">מה ניתן לעשות?</p>
            <p>• פנה לתמיכה בדוא"ל עם פרטי חשבונך</p>
            <p>• וודא שפרטי העסק תקינים ועומדים בתנאי השימוש</p>
            <p>• לאחר פתרון הבעיה, הצוות ישחרר את החשבון</p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@weddingpro.co.il"
              className="inline-block px-8 py-3 rounded-xl bg-obsidian text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              פנה לתמיכה
            </a>
            <Link
              href="/auth/login"
              className="text-sm text-stone/50 hover:text-gold transition-colors"
            >
              חזור לדף הכניסה
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Trial expired gate — show before rendering the dashboard
  const hasActiveStripe = !!vendor?.stripeSubscriptionId &&
    vendor?.subscriptionStatus === "active";
  const trialExpired =
    vendor?.trialEndsAt &&
    new Date() > new Date(vendor.trialEndsAt) &&
    !hasActiveStripe;

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="h-9 w-9 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-obsidian mb-2">תקופת הניסיון הסתיימה</h1>
            <p className="text-stone/70 leading-relaxed">
              תקופת הניסיון החינמית שלך הסתיימה.
              כדי להמשיך להופיע בדירקטורי ולקבל לידים — בחר תוכנית מנוי.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 p-5 text-sm text-stone text-right space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-obsidian">Standard</span>
              <span className="text-gold font-display text-lg">₪149<span className="text-xs text-stone/60">/חודש</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-obsidian">Premium</span>
              <span className="text-gold font-display text-lg">₪349<span className="text-xs text-stone/60">/חודש</span></span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 rounded-xl bg-dusty-rose text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              בחר תוכנית מנוי
            </Link>
            <a
              href="mailto:support@weddingpro.co.il"
              className="text-sm text-stone/50 hover:text-gold transition-colors"
            >
              יש שאלות? פנה לתמיכה
            </a>
          </div>
        </div>
      </div>
    );
  }

  const businessName = vendor?.businessName ?? user.email ?? "הספק שלי";
  const plan = vendor?.plan ?? "free";

  const cookieStore = await cookies();
  const isImpersonating =
    cookieStore.get("x-admin-impersonating")?.value === "1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7] via-[#f5f2ee] to-[#faf9f7] flex flex-row-reverse" dir="rtl">
      <Sidebar businessName={businessName} plan={plan} newLeadsCount={newLeadsCount} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {isImpersonating && <ImpersonationBanner />}

        {/* Top header — glass */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_1px_0_0_rgba(184,151,106,0.15)] px-4 lg:px-6 py-3.5 flex items-center justify-between lg:pr-6 pr-16">
          <div>
            <p className="text-[10px] text-stone/40 font-semibold tracking-widest uppercase">לוח בקרה</p>
            <h2 className="font-display text-lg text-obsidian leading-tight mt-0.5">
              {businessName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-stone/50 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-champagne/50 shadow-sm">
              {user.email}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
