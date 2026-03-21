"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  User, Phone, Image as ImageIcon, Rocket,
  Loader2,
} from "lucide-react";
import type { Vendor } from "@/lib/db/schema";

const CATEGORIES = [
  { value: "photography",             label: "📷 צילום חתונות" },
  { value: "videography",             label: "🎬 צילום וידאו" },
  { value: "venue",                   label: "🏛️ אולם אירועים" },
  { value: "catering",                label: "🍽️ קייטרינג" },
  { value: "flowers",                 label: "💐 עיצוב פרחים" },
  { value: "music",                   label: "🎵 מוזיקה חיה" },
  { value: "dj",                      label: "🎧 DJ" },
  { value: "makeup",                  label: "💄 איפור כלה" },
  { value: "dress",                   label: "👗 שמלת כלה" },
  { value: "suit",                    label: "🤵 חליפות חתן" },
  { value: "cake",                    label: "🎂 עוגות חתונה" },
  { value: "invitation",              label: "✉️ הזמנות" },
  { value: "transport",               label: "🚗 הסעות" },
  { value: "lighting",                label: "💡 תאורה" },
  { value: "planning",                label: "📋 מתכנן חתונות" },
  { value: "wedding-dress-designers", label: "👰 מעצבי שמלות" },
  { value: "bridal-preparation",      label: "🌸 התארגנות כלות" },
  { value: "other",                   label: "📦 אחר" },
];

const STEPS = [
  { id: 0, label: "פרטי עסק",  icon: User },
  { id: 1, label: "פרטי קשר",  icon: Phone },
  { id: 2, label: "תיאור",     icon: ImageIcon },
  { id: 3, label: "סיום",      icon: Rocket },
];

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-champagne/60 bg-white text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors text-sm";
const labelCls = "block text-sm font-semibold text-obsidian mb-1.5";

interface Props { vendor: Vendor }

export function OnboardingWizard({ vendor }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    businessName: vendor.businessName ?? "",
    category:     vendor.category ?? "other",
    city:         vendor.city ?? "",
    region:       vendor.region ?? "",
    phone:        vendor.phone ?? "",
    email:        vendor.email ?? "",
    website:      vendor.website ?? "",
    instagram:    vendor.instagram ?? "",
    shortDescription: vendor.shortDescription ?? "",
    description:  vendor.description ?? "",
  });

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function saveAndContinue() {
    if (step === 1 && !form.phone.trim()) {
      toast.error("טלפון / WhatsApp נדרש");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // Use the existing updateContentAction via API
      const res = await fetch("/api/onboarding-save", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "שגיאה בשמירה");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשמירה");
      setSaving(false);
      return;
    }
    setSaving(false);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }

  async function finish() {
    await saveAndContinue();
    toast.success("הפרופיל נשמר! בקרוב תקבל אישור מהצוות שלנו 🎉");
    router.push("/dashboard");
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="text-center">
        <p className="font-script text-2xl text-gold mb-1">ברוכים הבאים</p>
        <h1 className="font-display text-3xl text-obsidian">הגדרת הפרופיל שלך</h1>
        <p className="text-stone/60 text-sm mt-2">
          מלא את הפרטים — ייקח רק 2 דקות
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => idx < step && setStep(idx)}
              className={`
                flex flex-col items-center gap-1 px-3
                ${idx < step ? "cursor-pointer" : "cursor-default"}
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${idx < step  ? "bg-green-500 text-white" :
                  idx === step ? "bg-gold text-white shadow-md shadow-gold/30" :
                                 "bg-champagne/50 text-stone/40"}
              `}>
                {idx < step
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <s.icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                idx === step ? "text-gold" : "text-stone/50"
              }`}>
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mb-5 transition-colors ${
                idx < step ? "bg-green-400" : "bg-champagne/50"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-champagne/60 shadow-sm p-7 space-y-5">

        {/* Step 0: Business details */}
        {step === 0 && (
          <>
            <h2 className="font-display text-xl text-obsidian">פרטי העסק</h2>

            <div>
              <label className={labelCls}>שם העסק *</label>
              <input
                type="text"
                required
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
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={inputCls}
                >
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
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="תל אביב"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Tagline — משפט שיווקי קצר</label>
              <input
                type="text"
                maxLength={100}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="לדוגמה: צלם חתונות פרמיום — מגשים רגעים לצמיתות"
                className={inputCls}
              />
              <p className="text-xs text-stone/40 mt-1">מופיע מתחת לשם בכרטיס בדירקטורי</p>
            </div>
          </>
        )}

        {/* Step 1: Contact */}
        {step === 1 && (
          <>
            <h2 className="font-display text-xl text-obsidian">פרטי קשר</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>טלפון / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="050-0000000"
                  className={inputCls}
                />
                <p className="text-xs text-stone/40 mt-1">יופיע כפתור WhatsApp בפרופיל</p>
              </div>
              <div>
                <label className={labelCls}>אימייל *</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>אתר אינטרנט</label>
              <input
                type="url"
                dir="ltr"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://yoursite.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>אינסטגרם</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone/40 text-sm select-none">@</span>
                <input
                  type="text"
                  dir="ltr"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="yourusername"
                  className={`${inputCls} pr-8`}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <>
            <h2 className="font-display text-xl text-obsidian">תיאור העסק</h2>
            <p className="text-sm text-stone/60 -mt-2">
              תיאור טוב מגדיל משמעותית את הסיכוי שלקוח יפנה אליך.
            </p>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className={labelCls} style={{margin:0}}>תיאור מלא</label>
                <span className={`text-xs ${form.description.length > 900 ? "text-amber-500" : "text-stone/40"}`}>
                  {form.description.length}/1000
                </span>
              </div>
              <textarea
                rows={7}
                maxLength={1000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={`ספר על עצמך — ניסיון, סגנון, מה מייחד אותך.

לדוגמה:
"מעל 10 שנות ניסיון בצילום חתונות. מתמחה בצילום אינטימי ורגשי שמספר את הסיפור שלכם. עובד עם ציוד Sony A-series מקצועי ומספק גלריה מעובדת תוך 4 שבועות."`}
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-stone/40 mt-1">
                💡 טיפ: תיאורים עם לפחות 150 מילים מקבלים 3× יותר פניות
              </p>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <>
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto">
                <Rocket className="h-9 w-9 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-obsidian mb-2">הפרופיל כמעט מוכן!</h2>
                <p className="text-stone/70 text-sm leading-relaxed max-w-sm mx-auto">
                  לאחר שמירה, הפרופיל שלך יישלח לאישור קצר מצוות WeddingPro.
                  בינתיים תוכל להעלות תמונות ולמלא פרטים נוספים.
                </p>
              </div>

              <div className="bg-champagne/20 rounded-xl border border-champagne/50 p-4 text-sm text-stone/70 text-right space-y-1.5">
                <p className="font-semibold text-obsidian text-xs mb-2">הצעדים הבאים אחרי האישור:</p>
                {[
                  "📸 העלה תמונות ב-לוח הבקרה → מדיה",
                  "💰 הוסף חבילות מחירים (Premium)",
                  "🔗 שתף את קישור הפרופיל שלך",
                  "📊 עקוב אחרי הצפיות והלידים שלך",
                ].map((tip) => (
                  <p key={tip} className="text-xs">{tip}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-champagne/60 text-sm text-stone hover:bg-champagne/20 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
            הקודם
          </button>
        )}

        <button
          onClick={isLastStep ? finish : saveAndContinue}
          disabled={saving || !form.businessName || !form.city || !form.email}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md shadow-gold/20"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "שומר..." : isLastStep ? "סיים וגש ללוח הבקרה 🎉" : (
            <span className="flex items-center gap-1.5">
              הבא
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>

      {/* Skip link */}
      {!isLastStep && (
        <p className="text-center text-xs text-stone/40">
          <button onClick={() => router.push("/dashboard")} className="hover:text-gold transition-colors">
            דלג — אמלא אחר כך
          </button>
        </p>
      )}
    </div>
  );
}
