"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  if (state.success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl text-obsidian mb-3">
            בדוק את תיבת האימייל שלך
          </h2>
          <p className="text-stone text-sm leading-relaxed mb-6">
            אם כתובת האימייל קיימת במערכת, שלחנו לך קישור לאיפוס הסיסמה.
            הקישור תקף ל-60 דקות.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה לדף הכניסה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md" dir="rtl">
      <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-obsidian tracking-tight">
            שכחת סיסמה?
          </h1>
          <p className="text-stone text-sm mt-3 leading-relaxed">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>

        {/* Error */}
        {state.error && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center"
          >
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-obsidian">
              כתובת אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              placeholder="you@example.com"
              className="
                w-full px-4 py-2.5 rounded-lg
                border border-champagne bg-ivory
                text-obsidian placeholder:text-stone/60
                focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                transition-colors text-sm
              "
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="
              w-full py-3 rounded-lg
              bg-dusty-rose text-cream-white font-medium text-sm
              hover:bg-opacity-90 active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              "שלח קישור לאיפוס"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-stone mt-6">
          <Link
            href="/auth/login"
            className="text-gold hover:underline inline-flex items-center gap-1"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            חזרה לכניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
