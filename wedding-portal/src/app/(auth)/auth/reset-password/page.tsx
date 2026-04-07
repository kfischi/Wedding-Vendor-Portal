"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase PKCE flow: email link redirects here with ?code=XXX
    // Exchange the code for a session directly on this page.
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (!err) {
          setReady(true);
          // Clean the code from the URL
          window.history.replaceState({}, "", "/auth/reset-password");
        } else {
          setError("הקישור פג תוקף — בקש קישור חדש");
        }
      });
      return;
    }

    // Fallback: implicit flow (hash fragment) or existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("שגיאה באיפוס הסיסמה — נסה שוב");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl text-obsidian mb-2">הסיסמה עודכנה!</h2>
          <p className="text-stone text-sm">מעביר אותך ללוח הבקרה...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10 text-center space-y-4">
          {error ? (
            <>
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <Link href="/auth/forgot-password" className="text-gold hover:underline text-sm">
                בקש קישור חדש
              </Link>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
              <p className="text-stone text-sm">מאמת את הקישור...</p>
              <p className="text-stone/50 text-xs">
                אם העמוד לא נטען, ייתכן שהקישור פג תוקף.{" "}
                <Link href="/auth/forgot-password" className="text-gold hover:underline">
                  שלח קישור חדש
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md" dir="rtl">
      <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-obsidian tracking-tight">
            איפוס סיסמה
          </h1>
          <p className="text-stone text-sm mt-2">בחר סיסמה חדשה לחשבונך</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-obsidian">
              סיסמה חדשה
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 8 תווים"
                className="
                  w-full px-4 py-2.5 pl-10 rounded-lg
                  border border-champagne bg-ivory
                  text-obsidian placeholder:text-stone/60
                  focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                  transition-colors text-sm
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/40 hover:text-stone transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-obsidian">
              אישור סיסמה
            </label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              dir="ltr"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="הזן שוב את הסיסמה"
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
            disabled={loading}
            className="
              w-full py-3 rounded-lg
              bg-dusty-rose text-cream-white font-medium text-sm
              hover:bg-opacity-90 active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                מעדכן...
              </>
            ) : (
              "עדכן סיסמה"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-cream-white rounded-2xl card-shadow gold-border p-8 sm:p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
