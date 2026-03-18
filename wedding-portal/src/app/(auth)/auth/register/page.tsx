"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import { registerAction, type RegisterState } from "./actions";

const CATEGORIES = [
  { value: "photography",             label: "צילום חתונות" },
  { value: "videography",             label: "צילום וידאו" },
  { value: "venue",                   label: "אולם אירועים" },
  { value: "catering",                label: "קייטרינג" },
  { value: "flowers",                 label: "עיצוב פרחים" },
  { value: "music",                   label: "מוזיקה חיה" },
  { value: "dj",                      label: "DJ" },
  { value: "makeup",                  label: "איפור כלה" },
  { value: "dress",                   label: "שמלת כלה" },
  { value: "suit",                    label: "חליפות חתן" },
  { value: "cake",                    label: "עוגות חתונה" },
  { value: "invitation",              label: "הזמנות" },
  { value: "transport",               label: "הסעות" },
  { value: "lighting",                label: "תאורה" },
  { value: "planning",                label: "מתכנן חתונות" },
  { value: "wedding-dress-designers", label: "מעצבי שמלות כלה" },
  { value: "bridal-preparation",      label: "התארגנות כלות" },
  { value: "other",                   label: "אחר" },
];

const inputCls = `
  w-full px-4 py-2.5 rounded-xl text-sm
  border border-champagne bg-ivory
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
  transition-colors
`;
const labelCls = "block text-sm font-medium text-obsidian mb-1.5";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    registerAction,
    {}
  );

  return (
    <div className="w-full max-w-lg" dir="rtl">
      <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/" className="font-script text-3xl text-gold">WeddingPro</Link>
          <h1 className="font-display text-2xl text-obsidian mt-2">הצטרפו כספק</h1>
          <p className="text-stone text-sm mt-1">מנוי חינמי — ללא כרטיס אשראי</p>
        </div>

        {state.error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          {/* פרטי עסק */}
          <div className="bg-white/60 rounded-xl border border-champagne/60 p-5 space-y-4">
            <h2 className="font-semibold text-obsidian text-sm">פרטי העסק</h2>

            <div>
              <label className={labelCls}>שם העסק *</label>
              <input
                name="businessName"
                required
                minLength={2}
                maxLength={100}
                placeholder="לדוגמה: Studio Cohen Photography"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>קטגוריה *</label>
                <select name="category" required defaultValue="" className={inputCls}>
                  <option value="" disabled>— בחר —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>עיר *</label>
                <input
                  name="city"
                  required
                  maxLength={50}
                  placeholder="תל אביב"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>טלפון / WhatsApp</label>
              <input
                name="phone"
                type="tel"
                dir="ltr"
                maxLength={20}
                placeholder="050-0000000"
                className={inputCls}
              />
            </div>
          </div>

          {/* פרטי כניסה */}
          <div className="bg-white/60 rounded-xl border border-champagne/60 p-5 space-y-4">
            <h2 className="font-semibold text-obsidian text-sm">פרטי כניסה</h2>

            <div>
              <label className={labelCls}>אימייל *</label>
              <input
                name="email"
                type="email"
                required
                dir="ltr"
                maxLength={255}
                placeholder="you@yourbusiness.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>סיסמה * (לפחות 6 תווים)</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                dir="ltr"
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="
              w-full py-3 rounded-xl text-sm font-semibold
              bg-dusty-rose text-cream-white
              hover:opacity-90 active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />יוצר חשבון...</>
            ) : (
              <><Check className="h-4 w-4" />צור חשבון חינמי</>
            )}
          </button>

          <p className="text-center text-xs text-stone/50">
            בהרשמה אתם מסכימים ל
            <Link href="/terms" className="text-gold hover:underline mx-1">תנאי השימוש</Link>
            ול
            <Link href="/privacy" className="text-gold hover:underline mx-1">מדיניות הפרטיות</Link>
          </p>
        </form>

        <p className="text-center text-sm text-stone mt-6">
          כבר יש לך חשבון?{" "}
          <Link href="/auth/login" className="text-gold hover:underline font-medium">כניסה</Link>
        </p>

        <p className="text-center text-sm text-stone mt-2">
          רוצה Premium?{" "}
          <Link href="/pricing" className="text-gold hover:underline font-medium">ראה תוכניות</Link>
        </p>
      </div>
    </div>
  );
}
