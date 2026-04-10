"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();

    // Implicit flow: Supabase puts #access_token= in the URL hash.
    // The browser client detects it automatically via onAuthStateChange.
    // PKCE flow: Supabase puts ?code= in the query string.
    // We handle both cases for robustness.
    const code = searchParams.get("code");

    async function handleSession() {
      if (code) {
        // PKCE fallback
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[callback] exchangeCodeForSession:", error.message);
          router.replace(
            `/auth/login?error=auth&detail=${encodeURIComponent(error.message.slice(0, 120))}`
          );
          return;
        }
      }

      // Wait for session (covers both implicit hash and PKCE code paths)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectAfterLogin();
        return;
      }

      // Implicit flow: session arrives async via hash — listen for it
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            redirectAfterLogin();
          }
          if (event === "SIGNED_OUT") {
            subscription.unsubscribe();
            router.replace("/auth/login?error=auth");
          }
        }
      );

      // Timeout fallback after 8 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/auth/login?error=auth&detail=timeout");
      }, 8000);
    }

    function redirectAfterLogin() {
      const next = searchParams.get("next");
      if (next?.startsWith("/")) {
        router.replace(next);
      } else {
        router.replace("/dashboard");
      }
    }

    handleSession();
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
