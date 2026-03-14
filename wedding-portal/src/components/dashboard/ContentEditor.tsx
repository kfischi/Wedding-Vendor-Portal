"use client";

import { useEffect, useActionState, useState } from "react";
import { toast } from "sonner";
import { Loader2, User, Phone, Globe, Check } from "lucide-react";
import { updateContentAction, type ContentFormState } from "@/app/(dashboard)/dashboard/content/actions";
import type { Vendor } from "@/lib/db/schema";

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "photography",            label: "צילום חתונות" },
  { value: "videography",            label: "צילום וידאו" },
  { value: "venue",                  label: "אולם אירועים" },
  { value: "catering",               label: "קייטרינג" },
  { value: "flowers",                label: "עיצוב פרחים" },
  { value: "music",                  label: "מוזיקה חיה" },
  { value: "dj",                     label: "DJ" },
  { value: "makeup",                 label: "איפור כלה" },
  { value: "dress",                  label: "שמלת כלה" },
  { value: "suit",                   label: "חליפות חתן" },
  { value: "cake",                   label: "עוגות חתונה" },
  { value: "invitation",             label: "הזמנות" },
  { value: "transport",              label: "הסעות" },
  { value: "lighting",               label: "תאורה" },
  { value: "planning",               label: "מתכנן חתונות" },
  { value: "wedding-dress-designers", label: "מעצבי שמלות כלה" },
  { value: "bridal-preparation",     label: "התארגנות כלות" },
  { value: "other",                  label: "אחר" },
];

const REGIONS = [
  { value: "",        label: "— בחר אזור —" },
  { value: "מרכז",   label: "מרכז" },
  { value: "צפון",   label: "צפון" },
  { value: "דרום",   label: "דרום" },
  { value: "ירושלים", label: "ירושלים והסביבה" },
  { value: "שרון",   label: "השרון" },
  { value: "שפלה",   label: "שפלה" },
  { value: "ערבה",   label: "ערבה ונגב" },
];

// ── Style constants ───────────────────────────────────────────────────────────

const inputCls = `
  w-full px-4 py-2.5 rounded-xl text-sm
  border border-champagne bg-white
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
  transition-colors
`;
const labelCls = "block text-xs font-semibold text-stone/70 mb-1.5 uppercase tracking-wide";
const hintCls  = "text-stone/40 text-xs mt-1";

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 0, label: "פרטים בסיסיים", icon: User },
  { id: 1, label: "פרטי קשר",      icon: Phone },
  { id: 2, label: "סושיאל / SEO",  icon: Globe },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface ContentEditorProps {
  vendor: Vendor;
}

export function ContentEditor({ vendor }: ContentEditorProps) {
  const [state, formAction, isPending] = useActionState<ContentFormState, FormData>(
    updateContentAction,
    {}
  );
  const [tab, setTab] = useState(0);
  const [descLen, setDescLen] = useState(vendor.description?.length ?? 0);
  const [shortLen, setShortLen] = useState(vendor.shortDescription?.length ?? 0);

  useEffect(() => {
    if (state.success) toast.success("השינויים נשמרו בהצלחה ✓");
    if (state.error)   toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-5">
      {/* ── Slug preview ── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-champagne/60 text-xs text-stone/60">
        <span className="font-medium text-stone/40">הפרופיל שלך:</span>
        <span dir="ltr" className="font-mono text-gold/80 truncate">
          weddingpro.co.il/vendors/{vendor.slug}
        </span>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex bg-champagne/30 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              tab === t.id
                ? "bg-white text-obsidian shadow-sm"
                : "text-stone/60 hover:text-obsidian"
            }`}
          >
            <t.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Form — all fields always rendered, tabs control visibility ── */}
      <form action={formAction}>
        {/* ────────── Tab 0: Basic info ────────── */}
        <div className={tab === 0 ? "space-y-5" : "hidden"}>
          <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm space-y-5">
            <h2 className="font-display text-xl text-obsidian">פרטי עסק</h2>

            <div>
              <label className={labelCls}>שם העסק *</label>
              <input
                name="businessName"
                defaultValue={vendor.businessName}
                required
                maxLength={100}
                placeholder="לדוגמה: Studio Rivka"
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} style={{ margin: 0 }}>תיאור קצר (Tagline)</label>
                <span className={`text-[10px] ${shortLen > 90 ? "text-amber-500" : "text-stone/40"}`}>
                  {shortLen}/100
                </span>
              </div>
              <input
                name="shortDescription"
                defaultValue={vendor.shortDescription ?? ""}
                maxLength={100}
                placeholder="משפט אחד שמתאר את השירות שלך"
                className={inputCls}
                onChange={(e) => setShortLen(e.target.value.length)}
              />
              <p className={hintCls}>מופיע מתחת לשם בפרופיל</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>קטגוריה *</label>
                <select name="category" defaultValue={vendor.category} className={inputCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>עיר *</label>
                <input
                  name="city"
                  defaultValue={vendor.city}
                  required
                  maxLength={50}
                  placeholder="תל אביב"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>אזור</label>
              <select name="region" defaultValue={vendor.region ?? ""} className={inputCls}>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls} style={{ margin: 0 }}>תיאור מלא</label>
                <span className={`text-[10px] ${descLen > 900 ? "text-amber-500" : "text-stone/40"}`}>
                  {descLen}/1000
                </span>
              </div>
              <textarea
                name="description"
                defaultValue={vendor.description ?? ""}
                rows={6}
                maxLength={1000}
                placeholder="ספר על עצמך, הניסיון שלך, הסגנון שלך..."
                className={`${inputCls} resize-none`}
                onChange={(e) => setDescLen(e.target.value.length)}
              />
            </div>
          </div>
        </div>

        {/* ────────── Tab 1: Contact ────────── */}
        <div className={tab === 1 ? "space-y-5" : "hidden"}>
          <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm space-y-5">
            <h2 className="font-display text-xl text-obsidian">פרטי קשר</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>טלפון / WhatsApp</label>
                <input
                  name="phone"
                  type="tel"
                  dir="ltr"
                  defaultValue={vendor.phone ?? ""}
                  placeholder="050-0000000"
                  className={inputCls}
                />
                <p className={hintCls}>גם מופיע כפתור WhatsApp בפרופיל</p>
              </div>
              <div>
                <label className={labelCls}>אימייל *</label>
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  defaultValue={vendor.email}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>אתר אינטרנט</label>
              <input
                name="website"
                type="url"
                dir="ltr"
                defaultValue={vendor.website ?? ""}
                placeholder="https://yoursite.com"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ────────── Tab 2: Social + SEO ────────── */}
        <div className={tab === 2 ? "space-y-5" : "hidden"}>
          <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm space-y-5">
            <h2 className="font-display text-xl text-obsidian">רשתות חברתיות</h2>

            <div>
              <label className={labelCls}>אינסטגרם</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone/40 text-sm select-none font-medium">@</span>
                <input
                  name="instagram"
                  dir="ltr"
                  defaultValue={vendor.instagram?.replace("@", "") ?? ""}
                  placeholder="yourusername"
                  className={`${inputCls} pr-8`}
                />
              </div>
            </div>
          </div>

          {/* SEO — Premium only */}
          <div
            className={`bg-white rounded-2xl border p-5 shadow-sm space-y-5 ${
              vendor.plan === "premium" ? "border-champagne/60" : "border-champagne/30 opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl text-obsidian">SEO</h2>
              {vendor.plan !== "premium" && (
                <span className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                  Premium בלבד
                </span>
              )}
            </div>

            <div>
              <label className={labelCls}>Meta Title</label>
              <input
                name="seoTitle"
                defaultValue={vendor.seoTitle ?? ""}
                maxLength={70}
                disabled={vendor.plan !== "premium"}
                placeholder={`${vendor.businessName} | WeddingPro`}
                className={`${inputCls} disabled:cursor-not-allowed disabled:bg-champagne/20`}
              />
              <p className={hintCls}>עד 70 תווים</p>
            </div>

            <div>
              <label className={labelCls}>Meta Description</label>
              <textarea
                name="seoDescription"
                defaultValue={vendor.seoDescription ?? ""}
                maxLength={160}
                rows={3}
                disabled={vendor.plan !== "premium"}
                placeholder={vendor.shortDescription ?? "תיאור לגוגל..."}
                className={`${inputCls} resize-none disabled:cursor-not-allowed disabled:bg-champagne/20`}
              />
              <p className={hintCls}>עד 160 תווים</p>
            </div>
          </div>
        </div>

        {/* Hidden fields for non-active tabs so the form still submits them */}
        {tab !== 0 && (
          <>
            <input type="hidden" name="businessName" value={vendor.businessName} />
            <input type="hidden" name="shortDescription" value={vendor.shortDescription ?? ""} />
            <input type="hidden" name="category" value={vendor.category} />
            <input type="hidden" name="city" value={vendor.city} />
            <input type="hidden" name="region" value={vendor.region ?? ""} />
            <input type="hidden" name="description" value={vendor.description ?? ""} />
          </>
        )}
        {tab !== 1 && (
          <>
            <input type="hidden" name="phone" value={vendor.phone ?? ""} />
            <input type="hidden" name="email" value={vendor.email} />
            <input type="hidden" name="website" value={vendor.website ?? ""} />
          </>
        )}
        {tab !== 2 && (
          <>
            <input type="hidden" name="instagram" value={vendor.instagram ?? ""} />
            <input type="hidden" name="seoTitle" value={vendor.seoTitle ?? ""} />
            <input type="hidden" name="seoDescription" value={vendor.seoDescription ?? ""} />
          </>
        )}

        {/* ── Sticky save button ── */}
        <div className="sticky bottom-4 mt-5 flex items-center gap-4 bg-white/90 backdrop-blur-sm px-5 py-4 rounded-2xl border border-champagne/60 shadow-lg">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-dusty-rose text-white hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isPending ? "שומר..." : "שמור שינויים"}
          </button>
          {state.success && (
            <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              נשמר בהצלחה
            </p>
          )}
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
