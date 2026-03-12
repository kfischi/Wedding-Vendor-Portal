import { notFound } from "next/navigation";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Star,
  Eye,
  MessageSquare,
} from "lucide-react";
import {
  approveVendor,
  suspendVendor,
  overridePlan,
  impersonateVendor,
} from "../../actions";

export const dynamic = "force-dynamic";

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

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  contacted: "פנו אליו",
  qualified: "מוסמך",
  closed: "סגור",
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
  other: "אחר",
};

const PLAN_LABELS: Record<string, string> = {
  free: "חינם",
  standard: "סטנדרטי",
  premium: "פרמיום",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminVendorDetailPage({ params }: Props) {
  const { id } = await params;
  let vendor: typeof vendors.$inferSelect | null = null;
  let vendorLeads: (typeof leads.$inferSelect)[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);
    vendor = rows[0] ?? null;
    if (vendor) {
      vendorLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.vendorId, id))
        .orderBy(desc(leads.createdAt))
        .limit(20);
    }
  } catch {}

  if (!vendor) notFound();

  const impersonateAction = impersonateVendor.bind(null, vendor.email);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/vendors"
        className="inline-flex items-center gap-1 text-sm text-stone hover:text-obsidian transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
        ניהול ספקים
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-obsidian">
            {vendor.businessName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${STATUS_COLORS[vendor.status]}`}
            >
              {STATUS_LABELS[vendor.status]}
            </span>
            <span className="text-xs text-stone">
              {CATEGORY_LABELS[vendor.category]} · {vendor.city}
            </span>
            <span
              className={`text-xs font-medium ${
                vendor.plan === "premium"
                  ? "text-gold"
                  : vendor.plan === "standard"
                  ? "text-blue-600"
                  : "text-stone"
              }`}
            >
              {PLAN_LABELS[vendor.plan]}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link
            href={`/vendors/${vendor.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-ivory border border-champagne rounded-xl text-obsidian hover:bg-champagne/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            צפה באתר
          </Link>
          <form action={impersonateAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-obsidian text-white rounded-xl hover:bg-obsidian/80 transition-colors"
            >
              כנס בשמו
            </button>
          </form>
          {vendor.status === "pending" && (
            <form action={approveVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                אשר ספק
              </button>
            </form>
          )}
          {vendor.status === "active" && (
            <form action={suspendVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                השהה
              </button>
            </form>
          )}
          {vendor.status === "suspended" && (
            <form action={approveVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                הפעל מחדש
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right column: details + actions */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="bg-cream-white rounded-2xl card-shadow p-5">
            <h2 className="font-display text-xl text-obsidian mb-4">
              פרטי קשר
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-stone flex-shrink-0" />
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-obsidian hover:text-dusty-rose transition-colors truncate"
                >
                  {vendor.email}
                </a>
              </div>
              {vendor.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-stone flex-shrink-0" />
                  <span className="text-obsidian" dir="ltr">
                    {vendor.phone}
                  </span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Globe className="w-4 h-4 text-stone flex-shrink-0" />
                  <a
                    href={vendor.website}
                    target="_blank"
                    className="text-gold hover:underline truncate"
                  >
                    {vendor.website}
                  </a>
                </div>
              )}
              {vendor.instagram && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Instagram className="w-4 h-4 text-stone flex-shrink-0" />
                  <span className="text-obsidian">{vendor.instagram}</span>
                </div>
              )}
              {vendor.facebook && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Facebook className="w-4 h-4 text-stone flex-shrink-0" />
                  <span className="text-obsidian">{vendor.facebook}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-cream-white rounded-2xl card-shadow p-5">
            <h2 className="font-display text-xl text-obsidian mb-4">
              סטטיסטיקות
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "לידים",
                  value: vendor.leadCount,
                  icon: MessageSquare,
                },
                { label: "צפיות", value: vendor.viewCount, icon: Eye },
                {
                  label: "ביקורות",
                  value: vendor.reviewCount,
                  icon: Star,
                },
                {
                  label: "דירוג",
                  value: vendor.rating ? vendor.rating.toFixed(1) : "—",
                  icon: Star,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-ivory rounded-xl p-3 text-center"
                >
                  <p className="text-xl font-semibold text-obsidian">
                    {value}
                  </p>
                  <p className="text-xs text-stone mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="bg-cream-white rounded-2xl card-shadow p-5">
            <h2 className="font-display text-xl text-obsidian mb-4">
              מידע נוסף
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone">נרשם</span>
                <span className="text-obsidian">
                  {new Date(vendor.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">עודכן</span>
                <span className="text-obsidian">
                  {new Date(vendor.updatedAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              {vendor.stripeCustomerId && (
                <div className="flex justify-between">
                  <span className="text-stone">Stripe ID</span>
                  <span className="font-mono text-xs text-obsidian truncate max-w-[120px]">
                    {vendor.stripeCustomerId}
                  </span>
                </div>
              )}
              {vendor.subscriptionStatus && (
                <div className="flex justify-between">
                  <span className="text-stone">מנוי</span>
                  <span className="text-obsidian">
                    {vendor.subscriptionStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Plan override */}
          <div className="bg-cream-white rounded-2xl card-shadow p-5">
            <h2 className="font-display text-xl text-obsidian mb-1">
              שינוי פלאן
            </h2>
            <p className="text-xs text-stone mb-4">
              פלאן נוכחי:{" "}
              <strong className="text-obsidian">{PLAN_LABELS[vendor.plan]}</strong>
            </p>
            <form action={overridePlan} className="space-y-3">
              <input type="hidden" name="vendorId" value={vendor.id} />
              <select
                name="plan"
                defaultValue={vendor.plan}
                className="w-full px-3 py-2.5 bg-ivory border border-champagne rounded-xl text-sm text-obsidian focus:outline-none focus:border-gold transition-colors"
              >
                <option value="free">חינם</option>
                <option value="standard">סטנדרטי (₪299/חודש)</option>
                <option value="premium">פרמיום (₪599/חודש)</option>
              </select>
              <button
                type="submit"
                className="w-full py-2.5 bg-obsidian text-white text-sm rounded-xl hover:bg-obsidian/80 transition-colors"
              >
                עדכן פלאן
              </button>
            </form>
          </div>

          {/* Description */}
          {vendor.description && (
            <div className="bg-cream-white rounded-2xl card-shadow p-5">
              <h2 className="font-display text-xl text-obsidian mb-3">
                תיאור
              </h2>
              <p className="text-sm text-stone leading-relaxed">
                {vendor.description}
              </p>
            </div>
          )}
        </div>

        {/* Left column: leads history */}
        <div className="lg:col-span-2">
          <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-champagne">
              <h2 className="font-display text-xl text-obsidian">
                היסטוריית לידים
              </h2>
              <p className="text-xs text-stone mt-0.5">
                {vendorLeads.length > 0
                  ? `${vendorLeads.length} לידים אחרונים`
                  : "אין לידים"}
              </p>
            </div>

            {vendorLeads.length === 0 ? (
              <div className="p-16 text-center text-stone text-sm">
                אין לידים עדיין
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-champagne bg-ivory/50 text-right">
                      <th className="px-6 py-3 text-xs font-medium text-stone">
                        שם
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-stone hidden md:table-cell">
                        אימייל
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-stone hidden sm:table-cell">
                        טלפון
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-stone">
                        סטטוס
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-stone hidden lg:table-cell">
                        תאריך אירוע
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-stone hidden lg:table-cell">
                        תקציב
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-stone">
                        תאריך פנייה
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-champagne/50">
                    {vendorLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-ivory/60 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-obsidian">
                          {lead.name}
                        </td>
                        <td className="px-4 py-3.5 text-stone hidden md:table-cell truncate max-w-[150px]">
                          {lead.email}
                        </td>
                        <td className="px-4 py-3.5 text-stone hidden sm:table-cell" dir="ltr">
                          {lead.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-stone bg-champagne/50 px-2 py-0.5 rounded-full">
                            {LEAD_STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-stone text-xs hidden lg:table-cell">
                          {lead.eventDate
                            ? new Date(lead.eventDate).toLocaleDateString(
                                "he-IL"
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-stone text-xs hidden lg:table-cell">
                          {lead.budget ? `₪${lead.budget.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-6 py-3.5 text-stone text-xs">
                          {new Date(lead.createdAt).toLocaleDateString("he-IL")}
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
    </div>
  );
}
