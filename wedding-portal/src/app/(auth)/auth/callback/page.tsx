"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createOAuthClient, syncSessionToCookies } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next");

    async function handleCallback() {
      // Use the raw OAuth client (localStorage) — PKCE verifier is stored here,
      // not in cookies, so it survives the cross-domain OAuth redirect chain.
      const oauthClient = createOAuthClient();

      if (code) {
        const { data, error } = await oauthClient.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[callback] exchangeCodeForSession:", error.message);
          router.replace(
            `/auth/login?error=auth&detail=${encodeURIComponent(error.message.slice(0, 120))}`
          );
          return;
        }

        if (data.session) {
          // Sync the session into cookie storage so SSR pages can see the user
          try {
            await syncSessionToCookies(
              data.session.access_token,
              data.session.refresh_token
            );
          } catch (syncErr) {
            console.warn("[callback] syncSessionToCookies failed:", syncErr);
          }
        }
      } else {
        // No code — check if session already exists (e.g. hash-based implicit)
        const { data: { session } } = await oauthClient.auth.getSession();
        if (!session) {
          router.replace("/auth/login?error=missing_code");
          return;
        }
        try {
          await syncSessionToCookies(session.access_token, session.refresh_token);
        } catch {}
      }

      const destination = next?.startsWith("/") ? next : "/dashboard";
      // Full page reload (not client-side nav) so cookies written via document.cookie
      // are guaranteed to be in the browser jar before the server request fires.
      window.location.href = destination;
    }

    handleCallback();
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
