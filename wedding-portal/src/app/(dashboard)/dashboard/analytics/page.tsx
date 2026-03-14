export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq, and, gte, count, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { Eye, Users, TrendingUp, Star, Calendar, Lock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "אנליטיקס | WeddingPro" };

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  gold,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  gold?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-stone/60">{label}</p>
        <div className={`p-2 rounded-xl ${gold ? "bg-gold/10" : "bg-champagne/40"}`}>
          <Icon className={`h-4 w-4 ${gold ? "text-gold" : "text-stone/60"}`} />
        </div>
      </div>
      <p className={`font-display text-3xl leading-none ${gold ? "text-gold" : "text-obsidian"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-stone/50 mt-1.5">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let leadsThisMonth = 0;
  let leadsThisWeek = 0;
  let leadsAllTime = 0;
  let recentLeads: { createdAt: Date; status: string }[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [allCount, monthCount, weekCount, recent] = await Promise.all([
        db.select({ value: count() }).from(leads).where(eq(leads.vendorId, vendor.id)),
        db.select({ value: count() }).from(leads).where(
          and(eq(leads.vendorId, vendor.id), gte(leads.createdAt, firstOfMonth))
        ),
        db.select({ value: count() }).from(leads).where(
          and(eq(leads.vendorId, vendor.id), gte(leads.createdAt, sevenDaysAgo))
        ),
        db.select({ createdAt: leads.createdAt, status: leads.status })
          .from(leads)
          .where(eq(leads.vendorId, vendor.id))
          .orderBy(desc(leads.createdAt))
          .limit(30),
      ]);

      leadsAllTime   = Number(allCount[0]?.value ?? 0);
      leadsThisMonth = Number(monthCount[0]?.value ?? 0);
      leadsThisWeek  = Number(weekCount[0]?.value ?? 0);
      recentLeads    = recent;
    }
  } catch {
    // DB not connected
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא.</p>
      </div>
    );
  }

  const conversionRate =
    vendor.viewCount > 0
      ? ((leadsAllTime / vendor.viewCount) * 100).toFixed(1)
      : "—";

  const isPremium = vendor.plan === "premium";

  // Build a simple 30-day lead histogram
  const leadsByDay: Record<string, number> = {};
  for (const lead of recentLeads) {
    const key = new Date(lead.createdAt).toLocaleDateString("he-IL");
    leadsByDay[key] = (leadsByDay[key] ?? 0) + 1;
  }
  const maxDay = Math.max(...Object.values(leadsByDay), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="font-script text-xl text-gold">ביצועים</p>
        <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">אנליטיקס</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="סה״כ צפיות" value={vendor.viewCount} icon={Eye} sub="כל הזמנים" />
        <StatCard label="לידים השבוע" value={leadsThisWeek} icon={Users} sub="7 ימים אחרונים" gold />
        <StatCard label="לידים החודש" value={leadsThisMonth} icon={Calendar} sub="החודש הנוכחי" />
        <StatCard
          label="שיעור המרה"
          value={conversionRate === "—" ? "—" : `${conversionRate}%`}
          icon={TrendingUp}
          sub="לידים / צפיות"
          gold
        />
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-stone/60 font-medium mb-1">דירוג ממוצע</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-gold">
                {vendor.rating != null ? vendor.rating.toFixed(1) : "—"}
              </span>
              <span className="text-stone/60 text-sm">מתוך 5</span>
            </div>
            <p className="text-xs text-stone/50 mt-1">{vendor.reviewCount} ביקורות</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-6 w-6 ${
                  vendor.rating != null && i <= Math.round(vendor.rating)
                    ? "text-gold fill-gold"
                    : "text-champagne"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lead activity — Premium gate */}
      {isPremium ? (
        <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
          <h2 className="font-semibold text-obsidian text-sm mb-4">פעילות לידים (30 יום אחרונים)</h2>
          {Object.keys(leadsByDay).length === 0 ? (
            <p className="text-stone/50 text-sm text-center py-8">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(leadsByDay)
                .slice(0, 14)
                .map(([date, cnt]) => (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-stone/60 w-20 shrink-0 text-left" dir="ltr">{date}</span>
                    <div className="flex-1 h-2 bg-champagne/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold/70 rounded-full"
                        style={{ width: `${(cnt / maxDay) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-obsidian w-4 text-left">{cnt}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <p className="font-semibold text-obsidian text-sm mb-1">
                אנליטיקס מפורט — Premium בלבד
              </p>
              <p className="text-xs text-stone/60 mb-4">
                גרפים, ניתוח לידים לאורך זמן ועוד
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-block px-5 py-2 rounded-xl text-xs font-semibold bg-gold text-white hover:opacity-90 transition-opacity"
              >
                שדרג ל-Premium
              </Link>
            </div>
          </div>
          {/* Blurred preview */}
          <h2 className="font-semibold text-obsidian text-sm mb-4">פעילות לידים (30 יום אחרונים)</h2>
          <div className="space-y-2 blur-sm select-none pointer-events-none">
            {[80, 45, 60, 30, 75, 20, 90].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-stone/60 w-20">01/0{i + 1}/26</span>
                <div className="flex-1 h-2 bg-champagne/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gold/70 rounded-full" style={{ width: `${w}%` }} />
                </div>
                <span className="text-xs font-medium text-obsidian w-4">{Math.round(w / 20)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid sm:grid-cols-3 gap-3 text-center">
        {[
          { label: "סה״כ לידים", value: leadsAllTime },
          { label: "צפיות בפרופיל", value: vendor.viewCount },
          { label: "ביקורות", value: vendor.reviewCount },
        ].map((s) => (
          <div key={s.label} className="bg-champagne/20 rounded-2xl border border-champagne/40 px-4 py-5">
            <p className="font-display text-3xl text-obsidian">{s.value}</p>
            <p className="text-xs text-stone/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
