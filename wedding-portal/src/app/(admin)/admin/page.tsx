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
} from "lucide-react";
import { approveVendor, suspendVendor } from "./actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLAN_MRR = { standard: 299, premium: 599 };

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
  other: "אחר",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין",
  active: "פעיל",
  suspended: "מושהה",
  rejected: "נדחה",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  active: "text-emerald-700 bg-emerald-50 border-emerald-200",
  suspended: "text-red-700 bg-red-50 border-red-200",
  rejected: "text-stone bg-champagne/50 border-champagne",
};

export default async function AdminDashboardPage() {
  let stats = {
    total: 0,
    active: 0,
    pending: 0,
    leadsThisMonth: 0,
    mrr: 0,
  };
  let recentVendors: (typeof vendors.$inferSelect)[] = [];

  try {
    const firstOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const [
      totalRes,
      activeRes,
      pendingRes,
      leadsRes,
      standardRes,
      premiumRes,
      recentRes,
    ] = await Promise.all([
      db.select({ c: count() }).from(vendors),
      db
        .select({ c: count() })
        .from(vendors)
        .where(eq(vendors.status, "active")),
      db
        .select({ c: count() })
        .from(vendors)
        .where(eq(vendors.status, "pending")),
      db
        .select({ c: count() })
        .from(leads)
        .where(gte(leads.createdAt, firstOfMonth)),
      db
        .select({ c: count() })
        .from(vendors)
        .where(
          and(eq(vendors.status, "active"), eq(vendors.plan, "standard"))
        ),
      db
        .select({ c: count() })
        .from(vendors)
        .where(
          and(eq(vendors.status, "active"), eq(vendors.plan, "premium"))
        ),
      db.select().from(vendors).orderBy(desc(vendors.createdAt)).limit(10),
    ]);

    stats = {
      total: Number(totalRes[0]?.c ?? 0),
      active: Number(activeRes[0]?.c ?? 0),
      pending: Number(pendingRes[0]?.c ?? 0),
      leadsThisMonth: Number(leadsRes[0]?.c ?? 0),
      mrr:
        Number(standardRes[0]?.c ?? 0) * PLAN_MRR.standard +
        Number(premiumRes[0]?.c ?? 0) * PLAN_MRR.premium,
    };
    recentVendors = recentRes;
  } catch {}

  const statCards = [
    {
      label: 'סה"כ ספקים',
      value: stats.total,
      icon: Users,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    {
      label: "ספקים פעילים",
      value: stats.active,
      icon: CheckCircle,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      label: "לידים החודש",
      value: stats.leadsThisMonth,
      icon: TrendingUp,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
    },
    {
      label: "MRR משוער",
      value: formatPrice(stats.mrr),
      icon: DollarSign,
      colorClass: "text-gold",
      bgClass: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl text-obsidian">לוח בקרה</h1>
        <p className="text-stone mt-1 text-sm">סקירה כללית של הפלטפורמה</p>
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            יש <strong>{stats.pending}</strong> ספקים הממתינים לאישור.{" "}
            <Link
              href="/admin/vendors?status=pending"
              className="underline underline-offset-2"
            >
              עבור לניהול ספקים
            </Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, colorClass, bgClass }) => (
          <div key={label} className="bg-cream-white rounded-2xl p-5 card-shadow">
            <div
              className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center mb-3`}
            >
              <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <p className="text-2xl font-semibold text-obsidian">{value}</p>
            <p className="text-xs text-stone mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent vendors table */}
      <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-champagne flex items-center justify-between">
          <h2 className="font-display text-xl text-obsidian">ספקים אחרונים</h2>
          <Link
            href="/admin/vendors"
            className="flex items-center gap-1 text-sm text-gold hover:underline"
          >
            כל הספקים
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {recentVendors.length === 0 ? (
          <div className="p-16 text-center text-stone text-sm">
            אין ספקים עדיין
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-champagne bg-ivory/50 text-right">
                  <th className="px-6 py-3 text-xs font-medium text-stone">
                    שם עסק
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-stone hidden md:table-cell">
                    קטגוריה
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-stone hidden lg:table-cell">
                    עיר
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-stone">
                    פלאן
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-stone">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-stone">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/50">
                {recentVendors.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-ivory/60 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/vendors/${v.id}`}
                        className="font-medium text-obsidian hover:text-dusty-rose transition-colors"
                      >
                        {v.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-stone hidden md:table-cell">
                      {CATEGORY_LABELS[v.category]}
                    </td>
                    <td className="px-4 py-3.5 text-stone hidden lg:table-cell">
                      {v.city}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          v.plan === "premium"
                            ? "text-gold"
                            : v.plan === "standard"
                            ? "text-blue-600"
                            : "text-stone"
                        }`}
                      >
                        {v.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[v.status]}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="text-xs text-stone hover:text-obsidian underline underline-offset-2"
                        >
                          פרטים
                        </Link>
                        {v.status === "pending" && (
                          <form action={approveVendor.bind(null, v.id)}>
                            <button
                              type="submit"
                              className="text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                            >
                              אשר
                            </button>
                          </form>
                        )}
                        {v.status === "active" && (
                          <form action={suspendVendor.bind(null, v.id)}>
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:text-red-800 underline underline-offset-2"
                            >
                              השהה
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/vendors/${v.slug}`}
                          target="_blank"
                          className="text-stone hover:text-obsidian"
                          title="צפה באתר"
                        >
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
  );
}
