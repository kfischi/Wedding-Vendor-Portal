"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight, UserPlus } from "lucide-react";

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

const input = "w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-colors";
const label = "block text-xs font-medium text-white/50 mb-1.5";

export default function CreateVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ slug: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    businessName: "",
    category: "",
    city: "",
    phone: "",
    password: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) { setError("בחר קטגוריה"); return; }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/rescue-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          businessName: form.businessName,
          category: form.category,
          city: form.city,
          phone: form.phone || undefined,
          password: form.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה ביצירת הספק");
        return;
      }
      setSuccess({ slug: data.slug, email: form.email });
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto" dir="rtl">
        <div className="rounded-2xl p-8 text-center" style={{ background: "#1a1a1a", border: "1px solid rgba(52,211,153,0.3)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(52,211,153,0.1)" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: "#34d399" }} />
          </div>
          <h2 className="font-display text-2xl text-white mb-2">חשבון נוצר בהצלחה</h2>
          <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            אימייל: <span className="text-white">{success.email}</span>
          </p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Slug: <span className="font-mono text-gold">{success.slug}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin/vendors"
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "rgba(184,147,90,0.15)", color: "#b8935a", border: "1px solid rgba(184,147,90,0.3)" }}
            >
              חזור לספקים
            </Link>
            <button
              onClick={() => { setSuccess(null); setForm({ email: "", businessName: "", category: "", city: "", phone: "", password: "" }); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              ספק נוסף
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto" dir="rtl">
      {/* Back */}
      <Link
        href="/admin/vendors"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לספקים
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,147,90,0.15)" }}>
            <UserPlus className="w-4 h-4" style={{ color: "#b8935a" }} />
          </div>
          <h1 className="font-display text-2xl text-white">יצירת ספק ידנית</h1>
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          יוצר חשבון Supabase + פרופיל ספק ישירות — עוקף את טופס ההרשמה
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: "#1a1a1a", border: "1px solid rgba(184,147,90,0.15)" }}>

        <div>
          <label className={label}>אימייל *</label>
          <input
            type="email"
            required
            dir="ltr"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            placeholder="vendor@example.com"
            className={input}
          />
        </div>

        <div>
          <label className={label}>שם עסק *</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={form.businessName}
            onChange={e => set("businessName", e.target.value)}
            placeholder="לדוגמה: Studio Cohen Photography"
            className={input}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>קטגוריה *</label>
            <select
              required
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className={input}
            >
              <option value="">— בחר —</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>עיר *</label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="תל אביב"
              className={input}
            />
          </div>
        </div>

        <div>
          <label className={label}>טלפון</label>
          <input
            type="tel"
            maxLength={20}
            dir="ltr"
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            placeholder="050-0000000"
            className={input}
          />
        </div>

        <div>
          <label className={label}>סיסמה ראשונית (אופציונלי)</label>
          <input
            type="text"
            dir="ltr"
            minLength={8}
            value={form.password}
            onChange={e => set("password", e.target.value)}
            placeholder="אם ריק, הספק יאפס סיסמה בדואל"
            className={input}
          />
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            אם האימייל כבר קיים ב-Supabase, הסיסמה שהוזנה כאן תיעלם
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #b8935a, #9a7d56)", color: "white" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "יוצר חשבון..." : "צור חשבון ספק ←"}
        </button>
      </form>
    </div>
  );
}
