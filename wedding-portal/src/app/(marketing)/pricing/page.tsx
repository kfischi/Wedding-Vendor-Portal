"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Sparkles, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

async function startCheckout(email: string) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: "standard", email }),
  });
  if (!res.ok) throw new Error("שגיאה ביצירת תשלום");
  const { url } = (await res.json()) as { url: string };
  return url;
}

const FEATURES = [
  "פרופיל ספק מלא",
  "גלריה עד 20 תמונות",
  "קישורי רשתות חברתיות",
  "קבלת לידים ללא הגבלה",
  "אנליטיקס בסיסי",
  "תמיכה באימייל",
];

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    if (!email) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }
    startTransition(async () => {
      try {
        const url = await startCheckout(email);
        window.location.href = url;
      } catch {
        toast.error("שגיאה ביצירת תשלום — נסה שוב");
      }
    });
  }

  return (
    <main className="min-h-screen bg-ivory section-padding" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-14">
          <p className="font-script text-2xl text-gold mb-2">הצטרף אלינו</p>
          <h1 className="font-display text-5xl sm:text-6xl text-obsidian mb-4">
            תוכניות ומחירים
          </h1>
          <p className="text-stone text-lg max-w-xl mx-auto leading-relaxed">
            שני מסלולים פשוטים — תתחיל בחינם עם קופון, או הצטרף ישירות.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* מסלול חינם עם קופון */}
          <div className="bg-cream-white rounded-2xl card-shadow border border-champagne p-8 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-gold" />
                <h2 className="font-display text-2xl text-obsidian">ניסיון חינם</h2>
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display text-4xl text-obsidian">₪0</span>
                <span className="text-stone text-sm">/ 3 חודשים</span>
              </div>
              <p className="text-stone text-sm mt-2">
                עם קוד קופון — ללא כרטיס אשראי
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-obsidian">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/join/free"
              className="w-full py-3 rounded-xl text-sm font-medium border-2 border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-cream-white transition-all duration-150 flex items-center justify-center gap-2"
            >
              הכנס קוד קופון
            </Link>
          </div>

          {/* מסלול תשלום */}
          <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/30">
                <Sparkles className="h-3 w-3" />
                ללא קופון
              </span>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl text-obsidian mb-1">
                מנוי חודשי
              </h2>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display text-4xl text-obsidian">₪179</span>
                <span className="text-stone text-sm">/ חודש</span>
              </div>
              <p className="text-stone text-sm mt-2">
                התחל מיד, בטל בכל עת
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-obsidian">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-cream-white text-obsidian placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors text-sm"
              />
              <button
                onClick={handleCheckout}
                disabled={isPending}
                className="w-full py-3 rounded-xl text-sm font-medium bg-dusty-rose text-cream-white hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isPending ? (
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
        </div>

        <p className="text-center text-stone/60 text-xs mt-10">
          התשלום מאובטח על ידי Stripe · ניתן לבטל בכל עת · ללא עמלות נסתרות
        </p>
      </div>
    </main>
  );
}
