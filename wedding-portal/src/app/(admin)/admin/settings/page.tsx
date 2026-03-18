import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { broadcastAnnouncement } from "../actions";
import { Check, X, Megaphone, Users, CreditCard, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const PLAN_FEATURES = [
  { feature: "מיני-סייט ציבורי",          free: true,          premium: true },
  { feature: "טופס ליד",                  free: true,          premium: true },
  { feature: "גלריית תמונות (מקסימום)",   free: "10 תמונות",  premium: "20 תמונות" },
  { feature: "וידאו בגלריה",              free: false,         premium: true },
  { feature: "תמונת הירו",                free: false,         premium: true },
  { feature: "כפתור WhatsApp",            free: false,         premium: true },
  { feature: "חבילות מחיר",               free: false,         premium: true },
  { feature: "אנליטיקס מתקדם",            free: false,         premium: true },
  { feature: "SEO מותאם אישית",           free: false,         premium: true },
  { feature: "מיקום מועדף בחיפוש",        free: false,         premium: true },
  { feature: "תמיכה בעדיפות",             free: false,         premium: true },
];

const PLAN_PRICES = [
  { plan: "free",    label: "חינמי",   price: null, accent: "rgba(255,255,255,0.4)" },
  { plan: "premium", label: "פרימיום", price: 179,  accent: "#b8935a" },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 mx-auto" style={{ color: "#34d399" }} />
  ) : (
    <X className="w-4 h-4 mx-auto" style={{ color: "rgba(255,255,255,0.2)" }} />
  );
}

export default async function AdminSettingsPage() {
  let activeCount = 0;
  try {
    const res = await db.select({ c: count() }).from(vendors).where(eq(vendors.status, "active"));
    activeCount = Number(res[0]?.c ?? 0);
  } catch {}

  const card: React.CSSProperties = {
    background: "#1a1a1a",
    border: "1px solid rgba(184,147,90,0.15)",
    borderRadius: "1rem",
    overflow: "hidden",
  };

  const cardHeader: React.CSSProperties = {
    padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(184,147,90,0.15)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    background: "#111111",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    color: "rgba(255,255,255,0.85)",
    outline: "none",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white">הגדרות מערכת</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          תצורת פלטפורמה וכלי ניהול
        </p>
      </div>

      {/* Plan pricing */}
      <div style={card}>
        <div style={cardHeader}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,147,90,0.15)" }}>
            <CreditCard className="w-4 h-4" style={{ color: "#b8935a" }} />
          </div>
          <div>
            <h2 className="font-display text-xl text-white">מחירי פלאנים</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              מחירים מוגדרים ב-Stripe — לשינוי יש לעדכן את price IDs
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {PLAN_PRICES.map(({ plan, label, price, accent }) => (
              <div
                key={plan}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "#111111",
                  border: `1px solid ${accent}30`,
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: accent }}>
                  {label}
                </p>
                {price !== null ? (
                  <>
                    <p className="text-2xl font-semibold" style={{ color: accent }}>
                      ₪{price}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      לחודש
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
                    חינם
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature flags matrix */}
      <div style={card}>
        <div style={cardHeader}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.12)" }}>
            <Zap className="w-4 h-4" style={{ color: "#60a5fa" }} />
          </div>
          <h2 className="font-display text-xl text-white">Feature Flags לפי פלאן</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="px-6 py-3 text-right text-xs font-medium w-2/3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  תכונה
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                  חינמי
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: "#b8935a" }}>
                  פרימיום
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map(({ feature, free, premium }, i) => (
                <tr
                  key={feature}
                  style={{
                    borderBottom: i < PLAN_FEATURES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <td className="px-6 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {feature}
                  </td>
                  <td className="px-4 py-3.5 text-center"><FeatureCell value={free} /></td>
                  <td className="px-4 py-3.5 text-center"><FeatureCell value={premium} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast */}
      <div style={card}>
        <div style={cardHeader}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(167,139,250,0.12)" }}>
            <Megaphone className="w-4 h-4" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h2 className="font-display text-xl text-white">הודעת מערכת לספקים</h2>
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              <Users className="w-3 h-3" />
              תישלח ל-{activeCount} ספקים פעילים באימייל
            </p>
          </div>
        </div>

        <div className="p-6">
          <form action={broadcastAnnouncement} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                נושא ההודעה *
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder="עדכון חשוב לגבי הפלטפורמה"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                תוכן ההודעה *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder={"שלום לכל הספקים הנכבדים,\n\nברצוננו ליידע אתכם..."}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all"
                style={{ background: "#b8935a", color: "#0a0a0a" }}
              >
                <Megaphone className="w-4 h-4" />
                שלח הודעה לכל הספקים
              </button>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {activeCount > 0 ? `${activeCount} אימיילים יישלחו` : "אין ספקים פעילים"}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
