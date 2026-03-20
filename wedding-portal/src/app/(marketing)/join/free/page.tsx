"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Gift } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

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

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-champagne bg-surface-2 text-fg placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/50 transition-colors text-sm";
const labelCls = "block text-sm font-semibold text-fg/70 mb-1.5";

export default function JoinFreePage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    category: "",
    city: "",
    couponCode: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) { setError("בחר קטגוריה"); return; }
    if (!form.couponCode.trim()) { setError("קוד קופון נדרש"); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, couponCode: form.couponCode.trim().toUpperCase() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) { setError(data.error ?? "שגיאה בהרשמה"); return; }

      setDone(true);
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-950/40 border border-green-700/50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="font-display text-3xl text-fg mb-3">ברוכים הבאים!</h1>
          <p className="text-stone leading-relaxed mb-2">
            שלחנו לך אימייל עם קישור להגדרת סיסמה.
          </p>
          <p className="text-stone/70 text-sm leading-relaxed mb-8">
            לאחר הגדרת הסיסמה הפרופיל שלך יהיה פעיל מיד ויופיע בדירקטורי.
            תקופת הניסיון שלך (3 חודשים) כבר מתחילה לרוץ!
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 rounded-xl bg-dusty-rose text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            כניסה ללוח הבקרה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-ivory" dir="rtl">
        {/* Header */}
        <header className="border-b border-champagne glass sticky top-0 z-30 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link href="/" className="font-script text-2xl text-gold">WeddingPro</Link>
            <Link
              href="/auth/login"
              className="text-xs text-stone/60 hover:text-gold transition-colors"
            >
              כבר יש לך חשבון? כניסה
            </Link>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <p className="font-script text-xl text-gold mb-1">הצטרפות עם קוד קופון</p>
            <h1 className="font-display text-4xl text-obsidian leading-tight mb-3">
              3 חודשים ניסיון בחינם
            </h1>
            <p className="text-stone/70 leading-relaxed">
              הכנס קוד קופון ותקבל גישה מלאה לפלטפורמה למשך 3 חודשים — ללא כרטיס אשראי.
            </p>
          </div>

          {/* Trial features */}
          <div className="bg-surface-2 rounded-2xl border border-champagne p-5 mb-8 card-shadow">
            <p className="text-sm font-semibold text-fg/80 mb-3">מה כולל תקופת הניסיון:</p>
            <ul className="space-y-2">
              {[
                "פרופיל מלא עם גלריה עד 20 תמונות",
                "קבלת לידים ישירים ללא הגבלה",
                "הופעה בדירקטורי — פרסום מיידי, ללא אישור",
                "לוח בקרה לניהול פניות ואנליטיקס",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-stone">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone/50 mt-4 pt-3 border-t border-champagne/40">
              לאחר 3 חודשים תוכל לבחור תוכנית Standard (₪149/חודש) או Premium (₪349/חודש).
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Coupon code — prominent at top */}
            <div className="bg-surface-2 rounded-2xl border border-gold/25 p-5 card-shadow gold-glow">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-4 w-4 text-gold" />
                <h2 className="font-display text-lg text-fg">קוד קופון</h2>
              </div>
              <label className={labelCls}>קוד קופון *</label>
              <input
                type="text"
                required
                maxLength={50}
                value={form.couponCode}
                onChange={(e) => set("couponCode", e.target.value.toUpperCase())}
                placeholder="WEDDING2025"
                dir="ltr"
                className={inputCls + " font-mono tracking-widest uppercase"}
              />
              <p className="text-xs text-stone/50 mt-1.5">
                קיבלת קוד קופון? הכנס אותו כאן כדי להפעיל את תקופת הניסיון.
              </p>
            </div>

            <div className="bg-surface-2 rounded-2xl border border-champagne p-6 card-shadow space-y-5">
              <h2 className="font-display text-xl text-fg">פרטי העסק</h2>

              <div>
                <label className={labelCls}>שם העסק *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="לדוגמה: Studio Cohen Photography"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>קטגוריה *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— בחר —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>עיר *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="תל אביב"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-2 rounded-2xl border border-champagne p-6 card-shadow space-y-5">
              <h2 className="font-display text-xl text-fg">פרטי קשר</h2>

              <div>
                <label className={labelCls}>אימייל *</label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@yourbusiness.com"
                  dir="ltr"
                  className={inputCls}
                />
                <p className="text-xs text-stone/50 mt-1">
                  כתובת זו תשמש לכניסה ולקבלת פניות מלקוחות
                </p>
              </div>

              <div>
                <label className={labelCls}>טלפון / WhatsApp</label>
                <input
                  type="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-dusty-rose text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "יוצר חשבון..." : "הפעל ניסיון של 3 חודשים ←"}
            </button>

            <p className="text-center text-xs text-stone/50 leading-relaxed">
              בהרשמה אתם מסכימים ל
              <Link href="/terms" className="text-gold hover:underline mx-1">תנאי השימוש</Link>
              ול
              <Link href="/privacy" className="text-gold hover:underline mx-1">מדיניות הפרטיות</Link>
              של WeddingPro.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
