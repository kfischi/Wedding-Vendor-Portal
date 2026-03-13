"use client";

export const dynamic = "force-dynamic";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="w-full max-w-md">
      {/* כרטיס */}
      <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10">
        {/* לוגו */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-obsidian tracking-tight">
            WeddingPro
          </h1>
          <p className="font-script text-xl text-gold mt-1">
            פלטפורמת ספקי חתונות
          </p>
          <p className="text-stone text-sm mt-3">
            כניסה לחשבון הספק שלך
          </p>
        </div>

        {/* שגיאה */}
        {state.error && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center"
          >
            {state.error}
          </div>
        )}

        {/* טופס */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="next" value={next} />

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-obsidian"
            >
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

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-obsidian"
            >
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              placeholder="••••••••"
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
                מתחבר...
              </>
            ) : (
              "כניסה"
            )}
          </button>
        </form>

        {/* קישור לעמוד תמחור */}
        <p className="text-center text-sm text-stone mt-6">
          עדיין אין לך חשבון?{" "}
          <Link
            href="/pricing"
            className="text-gold hover:underline font-medium"
          >
            התחל עכשיו
          </Link>
        </p>
      </div>
    </div>
  );
}
