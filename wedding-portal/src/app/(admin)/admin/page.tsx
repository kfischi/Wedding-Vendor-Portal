export const dynamic = "force-dynamic";

import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, count, gte, and, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { approveVendor, suspendVendor } from "./actions";
import { formatPrice } from "@/lib/utils";

const PLAN_MRR = { premium: 349 };

const CATEGORY_LABELS: Record<string, string> = {
  photography: "צילום",
  videography: "וידאו",
  venue: "אולם",
  catering: "קייטרינג",
  flowers: "פרחים",
  music: "מוזיקה",
  dj: "DJ",
  makeup: "איפור",
  dress: "שמלות",
  suit: "חליפות",
  cake: "עוגות",
  invitation: "הזמנות",
  transport: "הסעות",
  lighting: "תאורה",
  planning: "ייעוץ",
  "wedding-dress-designers": "מעצבי שמלות",
  "bridal-preparation": "התארגנות כלות",
  other: "אחר",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין",
  active: "פעיל",
  suspended: "מושהה",
  rejected: "נדחה",
};

// dark-background-safe badge colors
const STATUS_COLORS: Record<string, string> = {
  pending: "color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25)",
  active: "color: #34d399; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25)",
  suspended: "color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25)",
  rejected: "color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1)",
};

export default async function AdminDashboardPage() {
  let stats = { total: 0, active: 0, pending: 0, leadsThisMonth: 0, mrr: 0 };
  let recentVendors: (typeof vendors.$inferSelect)[] = [];
  let newVendorsThisWeek = 0;
  let newLeadsThisWeek = 0;
  let topVendors: { id: string; businessName: string; leadCount: number; slug: string }[] = [];

  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRes, activeRes, pendingRes, leadsRes,
      premiumRes, recentRes,
      newVendorsRes, newLeadsRes, topVendorsRes,
    ] = await Promise.all([
      db.select({ c: count() }).from(vendors),
      db.select({ c: count() }).from(vendors).where(eq(vendors.status, "active")),
      db.select({ c: count() }).from(vendors).where(eq(vendors.status, "pending")),
      db.select({ c: count() }).from(leads).where(gte(leads.createdAt, firstOfMonth)),
      db.select({ c: count() }).from(vendors).where(and(eq(vendors.status, "active"), eq(vendors.plan, "premium"))),
      db.select().from(vendors).orderBy(desc(vendors.createdAt)).limit(10),
      db.select({ c: count() }).from(vendors).where(gte(vendors.createdAt, sevenDaysAgo)),
      db.select({ c: count() }).from(leads).where(gte(leads.createdAt, sevenDaysAgo)),
      db.select({ id: vendors.id, businessName: vendors.businessName, leadCount: vendors.leadCount, slug: vendors.slug })
        .from(vendors).where(eq(vendors.status, "active")).orderBy(desc(vendors.leadCount)).limit(5),
    ]);

    stats = {
      total: Number(totalRes[0]?.c ?? 0),
      active: Number(activeRes[0]?.c ?? 0),
      pending: Number(pendingRes[0]?.c ?? 0),
      leadsThisMonth: Number(leadsRes[0]?.c ?? 0),
      mrr: Number(premiumRes[0]?.c ?? 0) * PLAN_MRR.premium,
    };
    recentVendors = recentRes;
    newVendorsThisWeek = Number(newVendorsRes[0]?.c ?? 0);
    newLeadsThisWeek = Number(newLeadsRes[0]?.c ?? 0);
    topVendors = topVendorsRes;
  } catch {}

  const statCards = [
    { label: 'סה"כ ספקים', value: stats.total, icon: Users, accent: "#60a5fa" },
    { label: "ספקים פעילים", value: stats.active, icon: CheckCircle, accent: "#34d399" },
    { label: "לידים החודש", value: stats.leadsThisMonth, icon: TrendingUp, accent: "#a78bfa" },
    { label: "MRR משוער", value: formatPrice(stats.mrr), icon: DollarSign, accent: "#b8935a" },
    { label: "ספקים חדשים השבוע", value: newVendorsThisWeek, icon: UserPlus, accent: "#818cf8" },
    { label: "לידים חדשים השבוע", value: newLeadsThisWeek, icon: MessageSquare, accent: "#f472b6" },
  ];

  const card = "rounded-2xl p-5 overflow-hidden";
  const cardStyle = { background: "#1a1a1a", border: "1px solid rgba(184,147,90,0.15)" };
  const tableHeader = { background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const tableRow = { borderBottom: "1px solid rgba(255,255,255,0.04)" };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl text-white">לוח בקרה</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          סקירה כללית של הפלטפורמה
        </p>
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "#fbbf24" }} />
          <p className="text-sm" style={{ color: "#fde68a" }}>
            יש <strong>{stats.pending}</strong> ספקים הממתינים לאישור.{" "}
            <Link
              href="/admin/vendors?status=pending"
              className="underline underline-offset-2"
              style={{ color: "#b8935a" }}
            >
              עבור לניהול ספקים
            </Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className={card} style={cardStyle}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${accent}18` }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-2xl font-semibold" style={{ color: accent }}>
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Top vendors + Recent vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top by lead count */}
        <div className={card} style={{ ...cardStyle, padding: 0 }}>
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid rgba(184,147,90,0.15)" }}
          >
            <h2 className="font-display text-xl text-white">ספקים מובילים</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              לפי כמות לידים
            </p>
          </div>
          {topVendors.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              אין נתונים
            </div>
          ) : (
            <div>
              {topVendors.map((v, i) => (
                <div
                  key={v.id}
                  className="px-6 py-3.5 flex items-center justify-between"
                  style={i < topVendors.length - 1 ? tableRow : {}}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={
                        i === 0
                          ? { background: "rgba(184,147,90,0.2)", color: "#b8935a" }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
                      }
                    >
                      {i + 1}
                    </span>
                    <Link
                      href={`/admin/vendors/${v.id}`}
                      className="text-sm font-medium text-white hover:text-gold transition-colors"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      {v.businessName}
                    </Link>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#b8935a" }}>
                    {v.leadCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent vendors */}
        <div className="lg:col-span-2" style={{ ...cardStyle, borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(184,147,90,0.15)" }}>
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(184,147,90,0.15)" }}
          >
            <h2 className="font-display text-xl text-white">ספקים אחרונים</h2>
            <Link
              href="/admin/vendors"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: "#b8935a" }}
            >
              כל הספקים
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {recentVendors.length === 0 ? (
            <div className="p-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              אין ספקים עדיין
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={tableHeader}>
                    <th className="px-6 py-3 text-xs font-medium text-right" style={{ color: "rgba(255,255,255,0.4)" }}>שם עסק</th>
                    <th className="px-4 py-3 text-xs font-medium hidden md:table-cell" style={{ color: "rgba(255,255,255,0.4)" }}>קטגוריה</th>
                    <th className="px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>פלאן</th>
                    <th className="px-4 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>סטטוס</th>
                    <th className="px-6 py-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVendors.map((v) => (
                    <tr
                      key={v.id}
                      style={tableRow}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-6 py-3.5">
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="font-medium hover:text-gold transition-colors"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {v.businessName}
                        </Link>
                      </td>
                      <td
                        className="px-4 py-3.5 hidden md:table-cell"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {CATEGORY_LABELS[v.category]}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: v.plan === "premium" ? "#b8935a" : "rgba(255,255,255,0.35)",
                          }}
                        >
                          {v.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                          style={{ cssText: STATUS_COLORS[v.status] } as React.CSSProperties}
                        >
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/vendors/${v.id}`}
                            className="text-xs underline underline-offset-2 transition-colors"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                          >
                            פרטים
                          </Link>
                          {v.status === "pending" && (
                            <form action={approveVendor.bind(null, v.id)}>
                              <button type="submit" className="text-xs underline underline-offset-2" style={{ color: "#34d399" }}>
                                אשר
                              </button>
                            </form>
                          )}
                          {v.status === "active" && (
                            <form action={suspendVendor.bind(null, v.id)}>
                              <button type="submit" className="text-xs underline underline-offset-2" style={{ color: "#f87171" }}>
                                השהה
                              </button>
                            </form>
                          )}
                          <Link href={`/vendors/${v.slug}`} target="_blank" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
