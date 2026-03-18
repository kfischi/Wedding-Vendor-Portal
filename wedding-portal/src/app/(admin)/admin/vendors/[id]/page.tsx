import { notFound } from "next/navigation";
import { db } from "@/lib/db/db";
import { vendors, leads, reviews } from "@/lib/db/schema";
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
  deleteVendor,
  approveReview,
  rejectReview,
} from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין",
  active: "פעיל",
  suspended: "מושהה",
  rejected: "נדחה",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "color:#fbbf24;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3)",
  active: "color:#34d399;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3)",
  suspended: "color:#f87171;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3)",
  rejected: "color:#9ca3af;background:rgba(156,163,175,0.12);border:1px solid rgba(156,163,175,0.3)",
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
  "wedding-dress-designers": "מעצבי שמלות כלה",
  "bridal-preparation": "התארגנות כלות",
  other: "אחר",
};

const PLAN_LABELS: Record<string, string> = {
  free: "חינם",
  premium: "פרמיום",
};

interface Props {
  params: Promise<{ id: string }>;
}

const card = {
  background: "#1a1a1a",
  border: "1px solid rgba(184,147,90,0.15)",
  borderRadius: "16px",
  padding: "20px",
} as const;

export default async function AdminVendorDetailPage({ params }: Props) {
  const { id } = await params;
  let vendor: typeof vendors.$inferSelect | null = null;
  let vendorLeads: (typeof leads.$inferSelect)[] = [];
  let vendorReviews: (typeof reviews.$inferSelect)[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);
    vendor = rows[0] ?? null;
    if (vendor) {
      [vendorLeads, vendorReviews] = await Promise.all([
        db
          .select()
          .from(leads)
          .where(eq(leads.vendorId, id))
          .orderBy(desc(leads.createdAt))
          .limit(20),
        db
          .select()
          .from(reviews)
          .where(eq(reviews.vendorId, id))
          .orderBy(desc(reviews.createdAt)),
      ]);
    }
  } catch {}

  if (!vendor) notFound();

  const impersonateAction = impersonateVendor.bind(null, vendor.email);
  const deleteAction = deleteVendor.bind(null, vendor.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/vendors"
        style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        <ChevronRight style={{ width: "16px", height: "16px" }} />
        ניהול ספקים
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "28px", color: "white", marginBottom: "8px" }}>
            {vendor.businessName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ ...parseStyle(STATUS_COLORS[vendor.status]), display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "999px", fontSize: "12px" }}>
              {STATUS_LABELS[vendor.status]}
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              {CATEGORY_LABELS[vendor.category]} · {vendor.city}
            </span>
            <span style={{
              fontSize: "12px", fontWeight: 600,
              color: vendor.plan === "premium" ? "#b8935a" : "rgba(255,255,255,0.4)"
            }}>
              {PLAN_LABELS[vendor.plan]}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href={`/vendors/${vendor.slug}`}
            target="_blank"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "13px", background: "#2a2a2a", border: "1px solid rgba(184,147,90,0.3)", borderRadius: "10px", color: "#b8935a" }}
          >
            <ExternalLink style={{ width: "14px", height: "14px" }} />
            צפה באתר
          </Link>
          <form action={impersonateAction}>
            <button
              type="submit"
              style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(184,147,90,0.2)", border: "1px solid rgba(184,147,90,0.4)", borderRadius: "10px", color: "#b8935a", cursor: "pointer" }}
            >
              כנס בשמו
            </button>
          </form>
          {vendor.status === "pending" && (
            <form action={approveVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", borderRadius: "10px", color: "#34d399", cursor: "pointer" }}
              >
                אשר ספק
              </button>
            </form>
          )}
          {vendor.status === "active" && (
            <form action={suspendVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "10px", color: "#f87171", cursor: "pointer" }}
              >
                השהה
              </button>
            </form>
          )}
          {vendor.status === "suspended" && (
            <form action={approveVendor.bind(null, vendor.id)}>
              <button
                type="submit"
                style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", borderRadius: "10px", color: "#34d399", cursor: "pointer" }}
              >
                הפעל מחדש
              </button>
            </form>
          )}
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(`למחוק את ${vendor.businessName}? פעולה זו בלתי הפיכה.`)) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              style={{ padding: "8px 14px", fontSize: "13px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", color: "#f87171", cursor: "pointer" }}
            >
              מחק ספק
            </button>
          </form>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right column: details + actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Contact info */}
          <div style={card}>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white", marginBottom: "16px" }}>
              פרטי קשר
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <Mail style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <a href={`mailto:${vendor.email}`} style={{ color: "#b8935a" }}>
                  {vendor.email}
                </a>
              </div>
              {vendor.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Phone style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.8)" }} dir="ltr">{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Globe style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <a href={vendor.website} target="_blank" style={{ color: "#b8935a" }}>{vendor.website}</a>
                </div>
              )}
              {vendor.instagram && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Instagram style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{vendor.instagram}</span>
                </div>
              )}
              {vendor.facebook && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Facebook style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{vendor.facebook}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={card}>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white", marginBottom: "16px" }}>
              סטטיסטיקות
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "לידים", value: vendor.leadCount, icon: MessageSquare, color: "#b8935a" },
                { label: "צפיות", value: vendor.viewCount, icon: Eye, color: "#60a5fa" },
                { label: "ביקורות", value: vendor.reviewCount, icon: Star, color: "#a78bfa" },
                { label: "דירוג", value: vendor.rating ? vendor.rating.toFixed(1) : "—", icon: Star, color: "#34d399" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "12px", textAlign: "center" }}
                >
                  <p style={{ fontSize: "22px", fontWeight: 700, color }}>{value}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div style={card}>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white", marginBottom: "16px" }}>
              מידע נוסף
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>נרשם</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  {new Date(vendor.createdAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>עודכן</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>
                  {new Date(vendor.updatedAt).toLocaleDateString("he-IL")}
                </span>
              </div>
              {vendor.stripeCustomerId && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Stripe ID</span>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.6)", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {vendor.stripeCustomerId}
                  </span>
                </div>
              )}
              {vendor.subscriptionStatus && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>מנוי</span>
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>{vendor.subscriptionStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Plan override */}
          <div style={card}>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white", marginBottom: "4px" }}>
              שינוי פלאן
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
              פלאן נוכחי: <strong style={{ color: "#b8935a" }}>{PLAN_LABELS[vendor.plan]}</strong>
            </p>
            <form action={overridePlan} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="hidden" name="vendorId" value={vendor.id} />
              <select
                name="plan"
                defaultValue={vendor.plan}
                style={{ width: "100%", padding: "10px 12px", background: "#111", border: "1px solid rgba(184,147,90,0.3)", borderRadius: "10px", fontSize: "13px", color: "rgba(255,255,255,0.8)", outline: "none" }}
              >
                <option value="free">חינם</option>
                <option value="premium">פרמיום (₪179/חודש)</option>
              </select>
              <button
                type="submit"
                style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg,#b8935a,#9a7d46)", border: "none", borderRadius: "10px", fontSize: "13px", color: "white", fontWeight: 600, cursor: "pointer" }}
              >
                עדכן פלאן
              </button>
            </form>
          </div>

          {/* Description */}
          {vendor.description && (
            <div style={card}>
              <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white", marginBottom: "12px" }}>
                תיאור
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                {vendor.description}
              </p>
            </div>
          )}
        </div>

        {/* Left column: leads + reviews */}
        <div className="lg:col-span-2 space-y-6">

          {/* Reviews moderation */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(184,147,90,0.15)" }}>
              <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white" }}>
                ביקורות
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                {vendorReviews.length > 0 ? `${vendorReviews.length} ביקורות` : "אין ביקורות"}
              </p>
            </div>
            {vendorReviews.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                אין ביקורות עדיין
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {vendorReviews.map((review) => {
                  const approveAction = approveReview.bind(null, review.id, id);
                  const rejectAction = rejectReview.bind(null, review.id, id);
                  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
                  return (
                    <div
                      key={review.id}
                      style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        display: "flex",
                        gap: "16px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                            {review.authorName}
                          </span>
                          <span style={{ fontSize: "14px", color: "#c9a84c", letterSpacing: "1px" }}>{stars}</span>
                          <span style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            ...(review.isPublished && review.isVerified
                              ? { background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
                              : { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }),
                          }}>
                            {review.isPublished && review.isVerified ? "מאושר" : "ממתין"}
                          </span>
                        </div>
                        {review.title && (
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "2px" }}>
                            {review.title}
                          </p>
                        )}
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5", margin: 0 }}>
                          {review.body}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>
                          {review.authorEmail} · {new Date(review.createdAt).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        {!(review.isPublished && review.isVerified) && (
                          <form action={approveAction}>
                            <button
                              type="submit"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", borderRadius: "8px", color: "#34d399", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              אשר
                            </button>
                          </form>
                        )}
                        {(review.isPublished || review.isVerified) && (
                          <form action={rejectAction}>
                            <button
                              type="submit"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", color: "#f87171", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              בטל
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leads history */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(184,147,90,0.15)" }}>
              <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "18px", color: "white" }}>
                היסטוריית לידים
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                {vendorLeads.length > 0
                  ? `${vendorLeads.length} לידים אחרונים`
                  : "אין לידים"}
              </p>
            </div>

            {vendorLeads.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                אין לידים עדיין
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>
                      {["שם", "אימייל", "טלפון", "סטטוס", "תאריך אירוע", "תאריך פנייה"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                          {lead.name}
                        </td>
                        <td className="hidden md:table-cell" style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.email}
                        </td>
                        <td className="hidden sm:table-cell" style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)" }} dir="ltr">
                          {lead.phone ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "999px" }}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell" style={{ padding: "12px 16px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                          {lead.eventDate
                            ? new Date(lead.eventDate).toLocaleDateString("he-IL")
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
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

// Helper to convert CSS string to React style object
function parseStyle(cssString: string): React.CSSProperties {
  return Object.fromEntries(
    cssString.split(";").filter(Boolean).map((s) => {
      const [k, v] = s.split(":").map((x) => x.trim());
      const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      return [camel, v];
    })
  ) as React.CSSProperties;
}
