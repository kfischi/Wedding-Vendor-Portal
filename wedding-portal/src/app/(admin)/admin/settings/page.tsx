import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { broadcastAnnouncement } from "../actions";
import {
  Check,
  X,
  Megaphone,
  Users,
  CreditCard,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PLAN_FEATURES = [
  {
    feature: "מיני-סייט ציבורי",
    free: true,
    standard: true,
    premium: true,
  },
  {
    feature: "טופס ליד",
    free: true,
    standard: true,
    premium: true,
  },
  {
    feature: "גלריית תמונות (מקסימום)",
    free: "5 תמונות",
    standard: "30 תמונות",
    premium: "ללא הגבלה",
  },
  {
    feature: "חבילות מחיר",
    free: false,
    standard: true,
    premium: true,
  },
  {
    feature: "אנליטיקס מתקדם",
    free: false,
    standard: false,
    premium: true,
  },
  {
    feature: "תגית Featured",
    free: false,
    standard: false,
    premium: true,
  },
  {
    feature: "SEO מותאם אישית",
    free: false,
    standard: true,
    premium: true,
  },
  {
    feature: "תמיכה מועדפת",
    free: false,
    standard: false,
    premium: true,
  },
];

const PLAN_PRICES = [
  { plan: "free", label: "חינמי", price: null, color: "text-stone" },
  {
    plan: "standard",
    label: "סטנדרט",
    price: 299,
    color: "text-blue-600",
  },
  {
    plan: "premium",
    label: "פרימיום",
    price: 599,
    color: "text-gold",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-xs text-obsidian">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
  ) : (
    <X className="w-4 h-4 text-stone/30 mx-auto" />
  );
}

export default async function AdminSettingsPage() {
  let activeCount = 0;
  try {
    const res = await db
      .select({ c: count() })
      .from(vendors)
      .where(eq(vendors.status, "active"));
    activeCount = Number(res[0]?.c ?? 0);
  } catch {}

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-obsidian">הגדרות מערכת</h1>
        <p className="text-stone mt-1 text-sm">תצורת פלטפורמה וכלי ניהול</p>
      </div>

      {/* Plan pricing */}
      <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-champagne flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="font-display text-xl text-obsidian">מחירי פלאנים</h2>
            <p className="text-xs text-stone mt-0.5">
              מחירים מוגדרים ב-Stripe — לשינוי יש לעדכן את price IDs
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {PLAN_PRICES.map(({ plan, label, price, color }) => (
              <div
                key={plan}
                className="bg-ivory rounded-2xl p-4 text-center border border-champagne/50"
              >
                <p className={`text-xs font-medium uppercase tracking-wide ${color} mb-2`}>
                  {label}
                </p>
                {price !== null ? (
                  <>
                    <p className="text-2xl font-semibold text-obsidian">
                      ₪{price}
                    </p>
                    <p className="text-xs text-stone mt-0.5">לחודש</p>
                  </>
                ) : (
                  <p className="text-2xl font-semibold text-stone">חינם</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature flags matrix */}
      <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-champagne flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-display text-xl text-obsidian">
            Feature Flags לפי פלאן
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-champagne bg-ivory/50">
                <th className="px-6 py-3 text-right text-xs font-medium text-stone w-1/2">
                  תכונה
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone">
                  חינמי
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-blue-600">
                  סטנדרט
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gold">
                  פרימיום
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-champagne/50">
              {PLAN_FEATURES.map(({ feature, free, standard, premium }) => (
                <tr key={feature} className="hover:bg-ivory/40 transition-colors">
                  <td className="px-6 py-3.5 text-obsidian text-sm">
                    {feature}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <FeatureCell value={free} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <FeatureCell value={standard} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <FeatureCell value={premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast announcement */}
      <div className="bg-cream-white rounded-2xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-champagne flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="font-display text-xl text-obsidian">
              הודעת מערכת לספקים
            </h2>
            <p className="text-xs text-stone mt-0.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              תישלח ל-{activeCount} ספקים פעילים באימייל
            </p>
          </div>
        </div>

        <div className="p-6">
          <form action={broadcastAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                נושא ההודעה *
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder="עדכון חשוב לגבי הפלטפורמה"
                className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                תוכן ההודעה *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="שלום לכל הספקים הנכבדים,&#10;&#10;ברצוננו ליידע אתכם..."
                className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-obsidian text-white rounded-xl hover:bg-obsidian/80 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                שלח הודעה לכל הספקים
              </button>
              <p className="text-xs text-stone">
                {activeCount > 0
                  ? `${activeCount} אימיילים יישלחו`
                  : "אין ספקים פעילים כרגע"}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
