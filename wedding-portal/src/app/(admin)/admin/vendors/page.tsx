import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, ilike, and, desc, count, SQL } from "drizzle-orm";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { approveVendor, suspendVendor } from "../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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

const PLAN_LABELS: Record<string, string> = {
  free: "חינם",
  standard: "סטנדרטי",
  premium: "פרמיום",
};

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
  "wedding-dress-designers": "מעצבי שמלות כלה",
  other: "אחר",
};

interface Props {
  searchParams: Promise<{ status?: string; plan?: string; q?: string; page?: string }>;
}

export default async function AdminVendorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter =
    params.status && params.status !== "all" ? params.status : null;
  const planFilter =
    params.plan && params.plan !== "all" ? params.plan : null;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1));

  let vendorList: (typeof vendors.$inferSelect)[] = [];
  let total = 0;

  try {
    const filters: SQL[] = [];
    if (statusFilter)
      filters.push(
        eq(
          vendors.status,
          statusFilter as "pending" | "active" | "suspended" | "rejected"
        )
      );
    if (planFilter)
      filters.push(
        eq(vendors.plan, planFilter as "free" | "standard" | "premium")
      );
    if (query) filters.push(ilike(vendors.businessName, `%${query}%`));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, countRes] = await Promise.all([
      db
        .select()
        .from(vendors)
        .where(where)
        .orderBy(desc(vendors.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ c: count() }).from(vendors).where(where),
    ]);
    vendorList = rows;
    total = Number(countRes[0]?.c ?? 0);
  } catch {}

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    if (statusFilter) p.set("status", statusFilter);
    if (planFilter) p.set("plan", planFilter);
    if (query) p.set("q", query);
    p.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) =>
      v ? p.set(k, v) : p.delete(k)
    );
    return `/admin/vendors?${p.toString()}`;
  };

  const statusTabs = [
    { value: "all", label: "הכל" },
    { value: "pending", label: "ממתינים" },
    { value: "active", label: "פעילים" },
    { value: "suspended", label: "מושהים" },
  ];

  const planTabs = [
    { value: "all", label: "כל הפלאנים" },
    { value: "free", label: "חינם" },
    { value: "standard", label: "סטנדרטי" },
    { value: "premium", label: "פרמיום" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-obsidian">ניהול ספקים</h1>
        <p className="text-stone mt-1 text-sm">{total} ספקים נמצאו</p>
      </div>

      {/* Filters bar */}
      <div className="bg-cream-white rounded-2xl card-shadow p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form method="GET" action="/admin/vendors" className="flex-1">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {planFilter && <input type="hidden" name="plan" value={planFilter} />}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
              <input
                name="q"
                defaultValue={query}
                placeholder="חפש שם עסק..."
                className="w-full pr-9 pl-4 py-2.5 bg-ivory border border-champagne rounded-xl text-sm text-obsidian placeholder:text-stone/50 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </form>

          {/* Status tabs */}
          <div className="flex gap-1 p-1 bg-ivory rounded-xl border border-champagne self-start sm:self-auto flex-wrap">
            {statusTabs.map((tab) => {
              const active =
                (tab.value === "all" && !statusFilter) ||
                tab.value === statusFilter;
              return (
                <Link
                  key={tab.value}
                  href={buildUrl({ status: tab.value === "all" ? "" : tab.value, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    active ? "bg-obsidian text-white" : "text-stone hover:text-obsidian"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Plan filter */}
        <div className="flex gap-1 p-1 bg-ivory rounded-xl border border-champagne self-start flex-wrap">
          {planTabs.map((tab) => {
            const active =
              (tab.value === "all" && !planFilter) || tab.value === planFilter;
            return (
              <Link
                key={tab.value}
                href={buildUrl({ plan: tab.value === "all" ? "" : tab.value, page: "1" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  active ? "bg-gold text-white" : "text-stone hover:text-obsidian"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
        {vendorList.length === 0 ? (
          <div className="p-16 text-center text-stone text-sm">
            לא נמצאו ספקים
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-champagne bg-ivory/50 text-right">
                  <th className="px-6 py-3.5 text-xs font-medium text-stone">
                    שם עסק
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone hidden md:table-cell">
                    קטגוריה
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone hidden lg:table-cell">
                    עיר
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone">
                    פלאן
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone">
                    סטטוס
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone hidden lg:table-cell">
                    לידים
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-stone hidden xl:table-cell">
                    הצטרף
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-stone">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/50">
                {vendorList.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-ivory/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="font-medium text-obsidian hover:text-dusty-rose transition-colors block"
                        >
                          {v.businessName}
                        </Link>
                        <span className="text-xs text-stone truncate block max-w-[200px]">
                          {v.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-stone hidden md:table-cell">
                      {CATEGORY_LABELS[v.category] ?? v.category}
                    </td>
                    <td className="px-4 py-4 text-stone hidden lg:table-cell">
                      {v.city}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-medium ${
                          v.plan === "premium"
                            ? "text-gold"
                            : v.plan === "standard"
                            ? "text-blue-600"
                            : "text-stone"
                        }`}
                      >
                        {PLAN_LABELS[v.plan]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[v.status]}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-stone hidden lg:table-cell">
                      {v.leadCount}
                    </td>
                    <td className="px-4 py-4 text-stone text-xs hidden xl:table-cell">
                      {new Date(v.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
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
                        {(v.status === "active" ||
                          v.status === "pending") && (
                          <form action={suspendVendor.bind(null, v.id)}>
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:text-red-800 underline underline-offset-2"
                            >
                              השהה
                            </button>
                          </form>
                        )}
                        {v.status === "suspended" && (
                          <form action={approveVendor.bind(null, v.id)}>
                            <button
                              type="submit"
                              className="text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                            >
                              הפעל
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/vendors/${v.slug}`}
                          target="_blank"
                          className="text-stone hover:text-obsidian transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-champagne flex items-center justify-between">
            <p className="text-xs text-stone">
              עמוד {page} מתוך {totalPages} · {total} ספקים
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs bg-ivory border border-champagne rounded-lg text-obsidian hover:bg-champagne/30 transition-colors"
                >
                  הקודם
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs bg-obsidian rounded-lg text-white hover:bg-obsidian/80 transition-colors"
                >
                  הבא
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
