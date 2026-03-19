"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="w-full max-w-[380px] mx-auto">

      {/* Logo mark */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{
            background: "rgb(24 24 27)",
            border: "1px solid rgb(39 39 42)",
            boxShadow: "0 0 0 1px rgb(39 39 42 / 0.5), 0 4px 16px rgb(0 0 0 / 0.4)",
          }}
        >
          <span className="font-script text-gold text-xl leading-none" style={{ color: "rgb(201 168 84)" }}>
            W
          </span>
        </div>

        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "rgb(250 250 250)" }}>
          כניסה ל-WeddingPro
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "rgb(113 113 122)" }}>
          אין לך חשבון?{" "}
          <Link
            href="/join/free"
            className="font-medium transition-colors"
            style={{ color: "rgb(250 250 250)" }}
          >
            הצטרף בחינם
          </Link>
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-7"
        style={{
          background: "rgb(15 15 18)",
          border: "1px solid rgb(39 39 42)",
          boxShadow: "0 0 0 1px rgb(39 39 42 / 0.4), 0 8px 32px rgb(0 0 0 / 0.5)",
        }}
      >
        {/* Error */}
        {state.error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm"
            style={{
              background: "rgb(220 38 38 / 0.08)",
              border: "1px solid rgb(220 38 38 / 0.2)",
              color: "rgb(252 165 165)",
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: "rgb(212 212 216)" }}
            >
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              placeholder="you@example.com"
              className="input-dark"
              style={{ fontSize: "0.9375rem" }}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: "rgb(212 212 216)" }}
              >
                סיסמה
              </label>
              <Link
                href="/auth/reset"
                className="text-xs font-medium transition-colors"
                style={{ color: "rgb(113 113 122)" }}
              >
                שכחת סיסמה?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              placeholder="••••••••"
              className="input-dark"
              style={{ fontSize: "0.9375rem" }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-[0.65rem] rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 mt-2"
            style={{
              background: isPending ? "rgb(39 39 42)" : "rgb(250 250 250)",
              color: "rgb(9 9 11)",
              opacity: isPending ? 0.7 : 1,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgb(113 113 122)" }} />
                <span style={{ color: "rgb(113 113 122)" }}>מתחבר...</span>
              </>
            ) : (
              "כניסה"
            )}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs mt-6" style={{ color: "rgb(82 82 91)" }}>
        בכניסה אתה מסכים ל
        <Link href="/terms" className="hover:underline mx-1" style={{ color: "rgb(82 82 91)" }}>
          תנאי שימוש
        </Link>
        ול
        <Link href="/privacy" className="hover:underline mx-1" style={{ color: "rgb(82 82 91)" }}>
          מדיניות פרטיות
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full max-w-[380px] mx-auto h-96 rounded-2xl shimmer"
          style={{ border: "1px solid rgb(39 39 42)" }}
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
