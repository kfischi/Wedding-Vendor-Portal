export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { CheckCircle2, Crown, Zap, CreditCard, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "חיוב | WeddingPro" };

const PLANS = [
  {
    key: "free",
    label: "חינמי",
    price: "₪0",
    period: "לתמיד",
    color: "border-champagne",
    features: [
      "פרופיל בסיסי",
      "עד 5 תמונות",
      "טופס יצירת קשר",
      "ממתין לאישור ידני",
    ],
  },
  {
    key: "standard",
    label: "Standard",
    price: "₪149",
    period: "לחודש",
    color: "border-dusty-rose",
    features: [
      "פרופיל מלא עם גלריה",
      "עד 20 תמונות",
      "לידים ישירים ללא הגבלה",
      "אישור מהיר תוך 24 שעות",
      "הופעה בדירקטורי",
    ],
  },
  {
    key: "premium",
    label: "Premium",
    price: "₪349",
    period: "לחודש",
    color: "border-gold",
    badge: "מומלץ",
    features: [
      "הכול ב-Standard",
      "תמונות וסרטוני וידאו ללא הגבלה",
      "חבילות מחירים מותאמות",
      "הופעה מובלטת בראש הרשימות",
      "SEO מתקדם (Meta Title/Description)",
      "אנליטיקס מלא",
    ],
  },
];

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="font-script text-xl text-gold">חשבון</p>
        <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">חיוב ותוכנית</h1>
      </div>

      {/* Current plan summary */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              currentPlan === "premium" ? "bg-gold/10" : "bg-champagne/40"
            }`}>
              {currentPlan === "premium" ? (
                <Crown className="h-5 w-5 text-gold" />
              ) : (
                <Zap className="h-5 w-5 text-dusty-rose" />
              )}
            </div>
            <div>
              <p className="text-xs text-stone/60 font-medium">התוכנית הנוכחית</p>
              <p className="font-display text-xl text-obsidian capitalize">
                {currentPlan === "premium" ? "Premium ✦" : currentPlan === "standard" ? "Standard" : "חינמי"}
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
              <a
                href="https://billing.stripe.com/p/login/test_00000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-stone/60 border border-champagne/60 bg-white px-3 py-1.5 rounded-lg hover:bg-champagne/20 transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" />
                נהל חיוב
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="font-semibold text-obsidian text-sm mb-4">השוו תוכניות</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col ${
                  isCurrent ? plan.color + " shadow-md" : "border-champagne/40"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-gold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 text-[10px] font-bold text-white bg-obsidian px-2.5 py-1 rounded-full whitespace-nowrap">
                    התוכנית שלך
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="font-display text-xl text-obsidian">{plan.label}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-3xl text-obsidian">{plan.price}</span>
                    <span className="text-xs text-stone/60">/ {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-stone">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2 text-center text-xs font-semibold text-stone/50 bg-champagne/20 rounded-xl">
                    התוכנית הנוכחית
                  </div>
                ) : plan.key !== "free" ? (
                  <CheckoutButton plan={plan.key as "standard" | "premium"} email={user.email ?? ""} />
                ) : null}
              </div>
            );
          })}
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

// ── Client checkout button ─────────────────────────────────────────────────────

function CheckoutButton({ plan, email }: { plan: "standard" | "premium"; email: string }) {
  // Server-rendered link to pricing page with plan pre-selected
  return (
    <Link
      href={`/pricing?plan=${plan}&email=${encodeURIComponent(email)}`}
      className="w-full py-2 text-center text-xs font-semibold text-white bg-dusty-rose hover:opacity-90 rounded-xl transition-opacity block"
    >
      שדרג ל-{plan === "premium" ? "Premium" : "Standard"}
    </Link>
  );
}
