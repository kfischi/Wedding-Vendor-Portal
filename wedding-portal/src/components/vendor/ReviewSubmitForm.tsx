"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

interface ReviewSubmitFormProps {
  vendorId: string;
  vendorName: string;
}

export function ReviewSubmitForm({ vendorId, vendorName }: ReviewSubmitFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    authorName: "",
    authorEmail: "",
    title: "",
    body: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("בחר דירוג בכוכבים");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          ...form,
          rating,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "שגיאה בשליחה");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-6 text-center">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-champagne/60 bg-cream-white text-sm font-medium text-obsidian hover:bg-champagne/30 transition-colors card-shadow"
        >
          <Star className="h-4 w-4 text-gold" />
          כתוב ביקורת על {vendorName}
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-cream-white border border-champagne/60 card-shadow text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="font-display text-xl text-obsidian mb-1">תודה על הביקורת!</p>
        <p className="text-sm text-stone leading-relaxed">
          הביקורת שלך התקבלה ותפורסם לאחר אימות על ידי הצוות שלנו.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 rounded-2xl bg-cream-white border border-champagne/60 card-shadow">
      <h3 className="font-display text-xl text-obsidian mb-5">
        כתוב ביקורת על {vendorName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        {/* Star rating */}
        <div>
          <label className="text-sm font-medium text-obsidian mb-2 block">
            דירוג <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none"
                aria-label={`${star} כוכבים`}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= (hovered || rating)
                      ? "text-gold fill-gold"
                      : "text-champagne fill-champagne"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Name & email in 2 columns */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-obsidian mb-1.5 block">
              שם מלא <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={form.authorName}
              onChange={(e) =>
                setForm((f) => ({ ...f, authorName: e.target.value }))
              }
              placeholder="ישראל ישראלי"
              className="w-full rounded-xl border border-champagne/60 bg-white px-3 py-2.5 text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-obsidian mb-1.5 block">
              אימייל <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              maxLength={255}
              value={form.authorEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, authorEmail: e.target.value }))
              }
              placeholder="your@email.com"
              dir="ltr"
              className="w-full rounded-xl border border-champagne/60 bg-white px-3 py-2.5 text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </div>

        {/* Optional title */}
        <div>
          <label className="text-sm font-medium text-obsidian mb-1.5 block">
            כותרת (אופציונלי)
          </label>
          <input
            type="text"
            maxLength={100}
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            placeholder="סיכום קצר של החוויה"
            className="w-full rounded-xl border border-champagne/60 bg-white px-3 py-2.5 text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* Review body */}
        <div>
          <label className="text-sm font-medium text-obsidian mb-1.5 block">
            הביקורת שלך <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            minLength={20}
            maxLength={2000}
            rows={4}
            value={form.body}
            onChange={(e) =>
              setForm((f) => ({ ...f, body: e.target.value }))
            }
            placeholder="תאר את החוויה שלך עם הספק — מה אהבת, מה היה מיוחד..."
            className="w-full rounded-xl border border-champagne/60 bg-white px-3 py-2.5 text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
          />
          <p className="text-xs text-stone/50 mt-1 text-left">
            {form.body.length}/2000
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "שולח..." : "שלח ביקורת"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-champagne/60 text-sm text-stone hover:bg-champagne/20 transition-colors"
          >
            ביטול
          </button>
        </div>

        <p className="text-xs text-stone/50 text-center">
          הביקורת תפורסם לאחר אימות על ידי צוות WeddingPro
        </p>
      </form>
    </div>
  );
}
