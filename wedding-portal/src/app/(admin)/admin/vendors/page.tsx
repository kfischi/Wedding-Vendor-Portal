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
  "wedding-dress-designers": "מעצבי שמלות",
  other: "אחר",
};

// inline-style CSS string for status badges on dark bg
const STATUS_STYLE: Record<string, string> = {
  pending: "color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25)",
  active:  "color:#34d399;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25)",
  suspended:"color:#f87171;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25)",
  rejected: "color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)",
};

interface Props {
  searchParams: Promise<{ status?: string; plan?: string; q?: string; page?: string }>;
}

export default async function AdminVendorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter = params.status && params.status !== "all" ? params.status : null;
  const planFilter = params.plan && params.plan !== "all" ? params.plan : null;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1));

  let vendorList: (typeof vendors.$inferSelect)[] = [];
  let total = 0;

  try {
    const filters: SQL[] = [];
    if (statusFilter) filters.push(eq(vendors.status, statusFilter as "pending" | "active" | "suspended" | "rejected"));
    if (planFilter) filters.push(eq(vendors.plan, planFilter as "free" | "standard" | "premium"));
    if (query) filters.push(ilike(vendors.businessName, `%${query}%`));
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, countRes] = await Promise.all([
      db.select().from(vendors).where(where).orderBy(desc(vendors.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
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
    Object.entries(overrides).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
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

  const card = { background: "#1a1a1a", border: "1px solid rgba(184,147,90,0.15)", borderRadius: "1rem", overflow: "hidden" };
  const th = { color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" };
  const tableHeader = { background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const tableRow = { borderBottom: "1px solid rgba(255,255,255,0.04)" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white">ניהול ספקים</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {total} ספקים נמצאו
        </p>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form method="GET" action="/admin/vendors" className="flex-1">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {planFilter && <input type="hidden" name="plan" value={planFilter} />}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                name="q"
                defaultValue={query}
                placeholder="חפש שם עסק..."
                className="w-full pr-9 pl-4 py-2.5 text-sm rounded-xl focus:outline-none transition-colors"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                }}
              />
            </div>
          </form>

          {/* Status tabs */}
          <div className="flex gap-1 p-1 rounded-xl self-start sm:self-auto flex-wrap" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            {statusTabs.map((tab) => {
              const active = (tab.value === "all" && !statusFilter) || tab.value === statusFilter;
              return (
                <Link
                  key={tab.value}
                  href={buildUrl({ status: tab.value === "all" ? "" : tab.value, page: "1" })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={active
                    ? { background: "#b8935a", color: "#0a0a0a" }
                    : { color: "rgba(255,255,255,0.4)" }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Plan tabs */}
        <div className="flex gap-1 p-1 rounded-xl self-start flex-wrap" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          {planTabs.map((tab) => {
            const active = (tab.value === "all" && !planFilter) || tab.value === planFilter;
            return (
              <Link
                key={tab.value}
                href={buildUrl({ plan: tab.value === "all" ? "" : tab.value, page: "1" })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={active
                  ? { background: "#b8935a", color: "#0a0a0a" }
                  : { color: "rgba(255,255,255,0.4)" }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        {vendorList.length === 0 ? (
          <div className="p-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            לא נמצאו ספקים
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={tableHeader}>
                  <th className="px-6 py-3.5 text-xs font-medium text-right" style={th}>שם עסק</th>
                  <th className="px-4 py-3.5 text-xs font-medium hidden md:table-cell text-right" style={th}>קטגוריה</th>
                  <th className="px-4 py-3.5 text-xs font-medium hidden lg:table-cell text-right" style={th}>עיר</th>
                  <th className="px-4 py-3.5 text-xs font-medium text-right" style={th}>פלאן</th>
                  <th className="px-4 py-3.5 text-xs font-medium text-right" style={th}>סטטוס</th>
                  <th className="px-4 py-3.5 text-xs font-medium hidden lg:table-cell text-right" style={th}>לידים</th>
                  <th className="px-4 py-3.5 text-xs font-medium hidden xl:table-cell text-right" style={th}>הצטרף</th>
                  <th className="px-6 py-3.5 text-xs font-medium text-right" style={th}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {vendorList.map((v) => (
                  <tr key={v.id} style={tableRow}>
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="font-medium block hover:text-gold transition-colors"
                          style={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {v.businessName}
                        </Link>
                        <span className="text-xs truncate block max-w-[200px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {v.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {CATEGORY_LABELS[v.category] ?? v.category}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {v.city}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium" style={{
                        color: v.plan === "premium" ? "#b8935a" : v.plan === "standard" ? "#60a5fa" : "rgba(255,255,255,0.35)",
                      }}>
                        {PLAN_LABELS[v.plan]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                        style={{ cssText: STATUS_STYLE[v.status] } as React.CSSProperties}
                      >
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {v.leadCount}
                    </td>
                    <td className="px-4 py-4 text-xs hidden xl:table-cell" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {new Date(v.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
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
                        {(v.status === "active" || v.status === "pending") && (
                          <form action={suspendVendor.bind(null, v.id)}>
                            <button type="submit" className="text-xs underline underline-offset-2" style={{ color: "#f87171" }}>
                              השהה
                            </button>
                          </form>
                        )}
                        {v.status === "suspended" && (
                          <form action={approveVendor.bind(null, v.id)}>
                            <button type="submit" className="text-xs underline underline-offset-2" style={{ color: "#34d399" }}>
                              הפעל
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/vendors/${v.slug}`}
                          target="_blank"
                          style={{ color: "rgba(255,255,255,0.3)" }}
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
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              עמוד {page} מתוך {totalPages} · {total} ספקים
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  הקודם
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ background: "#b8935a", color: "#0a0a0a" }}
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
