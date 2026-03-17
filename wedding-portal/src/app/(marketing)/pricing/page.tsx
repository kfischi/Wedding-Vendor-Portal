"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PaidPlan } from "@/lib/stripe/config";

// Server action לניתוב ל-Stripe (מוגדר כאן כ-API call פשוט)
async function startCheckout(plan: PaidPlan, email: string, coupon: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email, coupon: coupon.trim() || undefined }),
  });
  if (!res.ok) throw new Error("שגיאה ביצירת תשלום");
  const { url } = (await res.json()) as { url: string };
  return url;
}

const FEATURES_STANDARD = [
  "פרופיל ספק מלא",
  "גלריה עד 50 תמונות",
  "כפתור WhatsApp ישיר",
  "קישורי רשתות חברתיות (אינסטגרם, טיקטוק, יוטיוב)",
  "קבלת לידים ללא הגבלה",
  "אנליטיקס בסיסי",
  "תמיכה באימייל",
];

const FEATURES_PREMIUM = [
  "כל מה שב-Standard",
  "גלריה ללא הגבלת תמונות + וידאו",
  "הופעה ראשונה בחיפוש",
  "תג 'מומלץ' על הפרופיל",
  "אנליטיקס מתקדם",
  "תמיכה בעדיפות",
];

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);

  function handleCheckout(plan: PaidPlan) {
    if (!email) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }
    setSelectedPlan(plan);
    startTransition(async () => {
      try {
        const url = await startCheckout(plan, email, coupon);
        window.location.href = url;
      } catch {
        toast.error("שגיאה ביצירת תשלום — נסה שוב");
        setSelectedPlan(null);
      }
    });
  }

  return (
    <main className="min-h-screen bg-ivory section-padding">
      <div className="max-w-5xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-14">
          <p className="font-script text-2xl text-gold mb-2">הצטרף אלינו</p>
          <h1 className="font-display text-5xl sm:text-6xl text-obsidian mb-4">
            תוכניות ומחירים
          </h1>
          <p className="text-stone text-lg max-w-xl mx-auto leading-relaxed">
            בחר את התוכנית המתאימה לעסק שלך. ניתן לבטל בכל עת.
          </p>
        </div>

        {/* שדה אימייל */}
        <div className="max-w-sm mx-auto mb-10">
          <label className="block text-sm font-medium text-obsidian mb-1.5">
            כתובת האימייל שלך
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            className="
              w-full px-4 py-2.5 rounded-lg
              border border-champagne bg-cream-white
              text-obsidian placeholder:text-stone/50
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
              transition-colors text-sm
            "
          />
        </div>

        {/* כרטיסי מחיר */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Standard */}
          <div className="bg-cream-white rounded-2xl card-shadow border border-champagne p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="font-display text-2xl text-obsidian mb-1">
                Standard
              </h2>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display text-4xl text-obsidian">
                  ₪149
                </span>
                <span className="text-stone text-sm">/ חודש</span>
              </div>
              <p className="text-stone text-sm mt-2">
                מתאים לספקים שמתחילים את דרכם
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES_STANDARD.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-obsidian">
                  <Check className="h-4 w-4 text-dusty-rose shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("standard")}
              disabled={isPending}
              className="
                w-full py-3 rounded-xl text-sm font-medium
                border-2 border-dusty-rose text-dusty-rose
                hover:bg-dusty-rose hover:text-cream-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                flex items-center justify-center gap-2
              "
            >
              {isPending && selectedPlan === "standard" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                "התחל עכשיו"
              )}
            </button>
          </div>

          {/* Premium */}
          <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 flex flex-col relative overflow-hidden">
            {/* תג מומלץ */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/30">
                <Sparkles className="h-3 w-3" />
                מומלץ
              </span>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl text-obsidian mb-1">
                Premium
              </h2>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display text-4xl text-obsidian">
                  ₪349
                </span>
                <span className="text-stone text-sm">/ חודש</span>
              </div>
              <p className="text-stone text-sm mt-2">
                לספקים שרוצים לבלוט ולצמוח
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES_PREMIUM.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-obsidian">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("premium")}
              disabled={isPending}
              className="
                w-full py-3 rounded-xl text-sm font-medium
                bg-dusty-rose text-cream-white
                hover:opacity-90 active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
                flex items-center justify-center gap-2
              "
            >
              {isPending && selectedPlan === "premium" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                "התחל עכשיו"
              )}
            </button>
          </div>
        </div>

        {/* שדה קוד קופון */}
        <div className="max-w-sm mx-auto mt-8 text-center">
          <p className="text-stone text-sm mb-2">יש לך קוד קופון?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="COUPON123"
              dir="ltr"
              className="
                flex-1 px-4 py-2.5 rounded-lg
                border border-champagne bg-cream-white
                text-obsidian placeholder:text-stone/40
                focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                transition-colors text-sm text-center tracking-widest
              "
            />
          </div>
          <p className="text-stone/60 text-xs mt-2">
            הקוד יוחל אוטומטית בעמוד התשלום
          </p>
        </div>

        {/* הסבר */}
        <p className="text-center text-stone/60 text-xs mt-10">
          התשלום מאובטח על ידי Stripe · ניתן לבטל בכל עת · ללא עמלות הסתרה
        </p>
      </div>
    </main>
  );
}
