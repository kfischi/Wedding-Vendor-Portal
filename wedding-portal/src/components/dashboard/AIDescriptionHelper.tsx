"use client";

import { useState } from "react";
import { Sparkles, X, ChevronLeft, Loader2 } from "lucide-react";

interface Props {
  category: string;
  city: string;
  businessName: string;
  onResult: (description: string) => void;
}

const QUESTIONS = [
  {
    key: "years" as const,
    label: "כמה שנות ניסיון יש לך בתחום?",
    placeholder: "לדוגמה: 8 שנים",
  },
  {
    key: "uniqueness" as const,
    label: "מה מייחד אותך מספקים אחרים?",
    placeholder: "לדוגמה: סגנון דוקומנטרי, זמינות 24/7, גישה אישית...",
  },
  {
    key: "services" as const,
    label: "אילו שירותים / ציוד / סגנון אתה מציע?",
    placeholder: "לדוגמה: ציוד Sony, גלריה תוך 3 שבועות, שני צלמים...",
  },
  {
    key: "achievement" as const,
    label: "יש לך הישג או סיפור מיוחד? (לא חובה)",
    placeholder: "לדוגמה: 200+ חתונות, עבודה עם זוגות מחו\"ל...",
    optional: true,
  },
];

type Answers = Record<"years" | "uniqueness" | "services" | "achievement", string>;

export function AIDescriptionHelper({ category, city, businessName, onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    years: "", uniqueness: "", services: "", achievement: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQ = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  function handleOpen() {
    setOpen(true);
    setStep(0);
    setAnswers({ years: "", uniqueness: "", services: "", achievement: "" });
    setError(null);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleNext() {
    if (!answers[currentQ.key] && !currentQ.optional) return;
    if (isLast) {
      generate();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, city, businessName, ...answers }),
      });
      const data = (await res.json()) as { description?: string; error?: string };
      if (!res.ok || !data.description) throw new Error(data.error ?? "שגיאה");
      onResult(data.description);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה ביצירת התיאור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/80 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        כתוב לי עם AI
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-champagne/60 overflow-hidden" dir="rtl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-champagne/40 bg-gradient-to-l from-gold/5 to-transparent">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="font-semibold text-obsidian text-sm">כתיבה חכמה עם AI</span>
              </div>
              <button onClick={handleClose} className="text-stone/40 hover:text-stone transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 px-5 pt-4">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i < step ? "bg-gold" : i === step ? "bg-gold/60" : "bg-champagne/50"
                  }`}
                />
              ))}
            </div>

            {/* Question */}
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="text-center py-8 space-y-3">
                  <Sparkles className="h-8 w-8 text-gold mx-auto animate-pulse" />
                  <p className="text-obsidian font-medium text-sm">כותב תיאור מקצועי...</p>
                  <p className="text-stone/50 text-xs">זה לוקח כמה שניות</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-obsidian mb-1">
                      {currentQ.label}
                      {currentQ.optional && (
                        <span className="text-stone/40 font-normal mr-1">(לא חובה)</span>
                      )}
                    </p>
                    <textarea
                      autoFocus
                      rows={3}
                      value={answers[currentQ.key]}
                      onChange={(e) => setAnswers((a) => ({ ...a, [currentQ.key]: e.target.value }))}
                      placeholder={currentQ.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-champagne bg-ivory text-obsidian text-sm placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.metaKey) handleNext();
                      }}
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs">{error}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        className="text-xs text-stone/50 hover:text-stone transition-colors"
                      >
                        ← חזור
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!answers[currentQ.key] && !currentQ.optional}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isLast ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          צור תיאור
                        </>
                      ) : (
                        <>
                          הבא
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
