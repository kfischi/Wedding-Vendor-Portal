export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { CheckCircle2, Crown, AlertCircle, Clock } from "lucide-react";
import { PortalButton } from "@/components/dashboard/PortalButton";

export const metadata: Metadata = { title: "חיוב | WeddingPro" };

const PLAN = {
  key: "standard",
  label: "מנוי חודשי",
  price: "₪179",
  period: "לחודש",
  features: [
    "פרופיל מלא עם גלריה ותמונות ללא הגבלה",
    "לידים ישירים ללא הגבלה — ללא עמלות",
    "הופעה בדירקטורי ובתוצאות החיפוש",
    "לוח בקרה עם אנליטיקס מלא",
    "SEO מתקדם (Meta Title/Description)",
    "תמיכה ישירה בוואטסאפ",
  ],
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
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

  const currentPlan = vendor.plan;
  const periodEnd = vendor.subscriptionCurrentPeriodEnd;
  const subStatus = vendor.subscriptionStatus;
  const trialEndsAt = vendor.trialEndsAt ? new Date(vendor.trialEndsAt) : null;
  const now = new Date();
  const trialActive = trialEndsAt && now < trialEndsAt && !vendor.stripeSubscriptionId;
  const trialDaysLeft = trialActive
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const trialEndDisplay = trialEndsAt
    ? new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(trialEndsAt)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="font-script text-xl text-gold">חשבון</p>
        <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">חיוב ותוכנית</h1>
      </div>

      {/* Trial banner */}
      {trialActive && (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
          trialDaysLeft <= 14
            ? "bg-amber-50 border-amber-200"
            : "bg-green-50 border-green-200"
        }`}>
          <Clock className={`h-5 w-5 mt-0.5 shrink-0 ${trialDaysLeft <= 14 ? "text-amber-500" : "text-green-500"}`} />
          <div>
            <p className={`font-semibold text-sm ${trialDaysLeft <= 14 ? "text-amber-800" : "text-green-800"}`}>
              {trialDaysLeft <= 14
                ? `⚠️ תקופת הניסיון מסתיימת בעוד ${trialDaysLeft} ימים (${trialEndDisplay})`
                : `✓ תקופת ניסיון פעילה — ${trialDaysLeft} ימים נותרו (עד ${trialEndDisplay})`
              }
            </p>
            <p className={`text-xs mt-1 ${trialDaysLeft <= 14 ? "text-amber-700" : "text-green-700"}`}>
              {trialDaysLeft <= 14
                ? "כדי שהפרופיל ימשיך להופיע בדירקטורי — בחר תוכנית מנוי לפני שהניסיון מסתיים."
                : "הפרופיל שלך פעיל ומופיע בדירקטורי. לאחר הניסיון תצטרך לבחור תוכנית מנוי."
              }
            </p>
          </div>
        </div>
      )}

      {/* Current plan summary */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10">
              <Crown className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-xs text-stone/60 font-medium">התוכנית הנוכחית</p>
              <p className="font-display text-xl text-obsidian">
                {currentPlan === "standard" ? "מנוי חודשי" : "ניסיון חינם"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {subStatus && (
              <div className="text-sm text-stone/60">
                {subStatus === "active" ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    מנוי פעיל
                  </span>
                ) : subStatus === "canceled" ? (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    בוטל
                  </span>
                ) : subStatus}
              </div>
            )}
            {periodEnd && (
              <span className="text-xs text-stone/50">
                חידוש:{" "}
                {new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" })
                  .format(new Date(periodEnd))}
              </span>
            )}
            {vendor.stripeCustomerId && (
              <PortalButton />
            )}
          </div>
        </div>
      </div>

      {/* Plan */}
      <div>
        <h2 className="font-semibold text-obsidian text-sm mb-4">התוכנית</h2>
        <div className="max-w-sm">
          <div className="relative bg-white rounded-2xl border-2 border-gold p-5 shadow-sm flex flex-col">
            {currentPlan === PLAN.key && (
              <span className="absolute -top-3 right-4 text-[10px] font-bold text-white bg-obsidian px-2.5 py-1 rounded-full whitespace-nowrap">
                התוכנית שלך
              </span>
            )}
            <div className="mb-4">
              <h3 className="font-display text-xl text-obsidian">{PLAN.label}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display text-3xl text-obsidian">{PLAN.price}</span>
                <span className="text-xs text-stone/60">/ {PLAN.period}</span>
              </div>
              <p className="text-xs text-stone/50 mt-1">3 חודשי ניסיון חינם · ביטול בכל עת</p>
            </div>
            <ul className="space-y-2 flex-1 mb-5">
              {PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-stone">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {currentPlan === PLAN.key ? (
              <div className="w-full py-2 text-center text-xs font-semibold text-stone/50 bg-champagne/20 rounded-xl">
                התוכנית הנוכחית
              </div>
            ) : (
              <CheckoutButton plan="standard" email={user.email ?? ""} />
            )}
          </div>
        </div>
      </div>

      {/* FAQ / notes */}
      <div className="bg-champagne/20 rounded-2xl border border-champagne/50 p-5 text-xs text-stone/70 space-y-1.5">
        <p><strong className="text-obsidian">שאלות נפוצות:</strong></p>
        <p>• ניתן לשדרג ולשנמך בכל עת. שינויים ייכנסו לתוקף מיד.</p>
        <p>• ביטול מנוי יכנס לתוקף בסוף תקופת החיוב הנוכחית.</p>
        <p>• לפרטים נוספים: <a href="mailto:support@weddingpro.co.il" className="text-gold hover:underline">support@weddingpro.co.il</a></p>
      </div>
    </div>
  );
}

// ── Client components ─────────────────────────────────────────────────────────

function CheckoutButton({ plan, email }: { plan: "standard"; email: string }) {
  return (
    <Link
      href={`/pricing?plan=${plan}&email=${encodeURIComponent(email)}`}
      className="w-full py-2 text-center text-xs font-semibold text-white bg-dusty-rose hover:opacity-90 rounded-xl transition-opacity block"
    >
      עבור למנוי חודשי
    </Link>
  );
}

