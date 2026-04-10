"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next");

    if (!code) {
      router.replace("/auth/login?error=missing_code");
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (error) {
        console.error("[auth/callback]", error.message);
        router.replace(
          `/auth/login?error=auth&detail=${encodeURIComponent(error.message.slice(0, 120))}`
        );
        return;
      }

      if (next?.startsWith("/")) {
        router.replace(next);
        return;
      }

      // Redirect admin to /admin, vendors to /dashboard
      router.replace("/dashboard");
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
        <p className="text-stone text-sm">מאמת את החשבון...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
