"use client";

import { useEffect, useActionState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateContentAction, type ContentFormState } from "@/app/(dashboard)/dashboard/content/actions";
import type { Vendor } from "@/lib/db/schema";

const CATEGORIES = [
  { value: "photography", label: "צילום חתונות" },
  { value: "videography", label: "צילום וידאו" },
  { value: "venue", label: "אולם אירועים" },
  { value: "catering", label: "קייטרינג" },
  { value: "flowers", label: "עיצוב פרחים" },
  { value: "music", label: "מוזיקה חיה" },
  { value: "dj", label: "DJ" },
  { value: "makeup", label: "איפור כלה" },
  { value: "dress", label: "שמלת כלה" },
  { value: "suit", label: "חליפות חתן" },
  { value: "cake", label: "עוגות חתונה" },
  { value: "invitation", label: "הזמנות" },
  { value: "transport", label: "הסעות" },
  { value: "lighting", label: "תאורה" },
  { value: "planning", label: "מתכנן חתונות" },
  { value: "other", label: "אחר" },
];

const inputCls = `
  w-full px-4 py-2.5 rounded-lg text-sm
  border border-champagne bg-ivory
  text-obsidian placeholder:text-stone/50
  focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
  transition-colors
`;

const labelCls = "block text-sm font-medium text-obsidian mb-1.5";

interface ContentEditorProps {
  vendor: Vendor;
}

export function ContentEditor({ vendor }: ContentEditorProps) {
  const [state, formAction, isPending] = useActionState<ContentFormState, FormData>(
    updateContentAction,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("השינויים נשמרו בהצלחה");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">

      {/* ── Section 1: פרטי עסק ── */}
      <section className="bg-cream-white rounded-2xl card-shadow border border-champagne/60 p-6">
        <h2 className="font-display text-xl text-obsidian mb-5">פרטי עסק</h2>
        <div className="space-y-4">

          <div>
            <label className={labelCls}>שם העסק *</label>
            <input
              name="businessName"
              defaultValue={vendor.businessName}
              required
              placeholder="לדוגמה: Studio Rivka"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>תיאור קצר (Tagline)</label>
            <input
              name="shortDescription"
              defaultValue={vendor.shortDescription ?? ""}
              maxLength={160}
              placeholder="משפט אחד שמתאר את השירות שלך"
              className={inputCls}
            />
            <p className="text-stone/50 text-xs mt-1">עד 160 תווים</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>קטגוריה *</label>
              <select
                name="category"
                defaultValue={vendor.category}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>עיר *</label>
              <input
                name="city"
                defaultValue={vendor.city}
                required
                placeholder="תל אביב"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>אזור</label>
            <input
              name="region"
              defaultValue={vendor.region ?? ""}
              placeholder="מרכז, צפון, דרום..."
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>תיאור מלא</label>
            <textarea
              name="description"
              defaultValue={vendor.description ?? ""}
              rows={6}
              maxLength={5000}
              placeholder="ספר על עצמך, הניסיון שלך, הסגנון שלך..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: פרטי קשר ── */}
      <section className="bg-cream-white rounded-2xl card-shadow border border-champagne/60 p-6">
        <h2 className="font-display text-xl text-obsidian mb-5">פרטי קשר</h2>
        <div className="grid sm:grid-cols-2 gap-4">

          <div>
            <label className={labelCls}>טלפון</label>
            <input
              name="phone"
              type="tel"
              dir="ltr"
              defaultValue={vendor.phone ?? ""}
              placeholder="050-0000000"
              className={inputCls}
            />
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

          <div>
            <label className={labelCls}>אינסטגרם</label>
            <div className="flex items-center gap-2">
              <span className="text-stone text-sm shrink-0">@</span>
              <input
                name="instagram"
                dir="ltr"
                defaultValue={vendor.instagram?.replace("@", "") ?? ""}
                placeholder="yourusername"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: SEO — Premium בלבד ── */}
      <section className={`bg-cream-white rounded-2xl card-shadow border p-6 ${
        vendor.plan === "premium" ? "border-champagne/60" : "border-champagne/30 opacity-60"
      }`}>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-display text-xl text-obsidian">SEO</h2>
          {vendor.plan !== "premium" && (
            <span className="text-xs text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
              Premium בלבד
            </span>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Meta Title</label>
            <input
              name="seoTitle"
              defaultValue={vendor.seoTitle ?? ""}
              maxLength={70}
              disabled={vendor.plan !== "premium"}
              placeholder={`${vendor.businessName} | WeddingPro`}
              className={`${inputCls} disabled:cursor-not-allowed`}
            />
            <p className="text-stone/50 text-xs mt-1">עד 70 תווים</p>
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
              className={`${inputCls} resize-none disabled:cursor-not-allowed`}
            />
            <p className="text-stone/50 text-xs mt-1">עד 160 תווים</p>
          </div>
        </div>
      </section>

      {/* כפתור שמירה */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="
            px-8 py-3 rounded-xl text-sm font-medium
            bg-dusty-rose text-cream-white
            hover:opacity-90 active:scale-[0.99]
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-150
            flex items-center gap-2
          "
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "שומר..." : "שמור שינויים"}
        </button>
        {state.success && (
          <p className="text-sm text-green-600">✓ נשמר בהצלחה</p>
        )}
      </div>
    </form>
  );
}
