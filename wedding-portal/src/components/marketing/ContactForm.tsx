"use client";

import { useState } from "react";
import { Loader2, Send, Check } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS = [
  "שאלה כללית",
  "תמיכה טכנית",
  "שאלה על מנוי",
  "דיווח על תקלה",
  "הצעת שיפור",
  "אחר",
];

const inputCls = `
  w-full px-4 py-3 rounded-xl text-sm
  border border-champagne bg-[#faf9f7]
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
  transition-colors
`;
const labelCls = "block text-xs font-semibold text-stone/60 uppercase tracking-wide mb-2";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "שגיאה בשליחה");
      }
      setSuccess(true);
      form.reset();
      toast.success("ההודעה נשלחה! נחזור אליכם בהקדם.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="font-display text-2xl text-obsidian mb-2">ההודעה נשלחה!</h3>
        <p className="text-stone/60 text-sm">נחזור אליכם תוך 1–2 ימי עסקים.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm text-gold hover:underline"
        >
          שלח הודעה נוספת
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>שם מלא *</label>
          <input name="name" required placeholder="ישראל ישראלי" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>אימייל *</label>
          <input name="email" type="email" required dir="ltr" placeholder="you@email.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>נושא *</label>
        <select name="subject" required className={inputCls}>
          <option value="">— בחרו נושא —</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>הודעה *</label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="כתבו את ההודעה שלכם כאן..."
          minLength={10}
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "שולח..." : "שלחו הודעה"}
      </button>
    </form>
  );
}
