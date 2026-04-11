"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createOAuthClient, syncSessionToCookies } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const next = searchParams.get("next");
      const destination = next?.startsWith("/") ? next : "/dashboard";

      // ── 1. PKCE flow: ?code= in query string ──────────────────────────────
      // The PKCE code verifier was stored in localStorage by createOAuthClient()
      // on the login page. It survives the full-page redirect chain through Google
      // and back because localStorage persists within the same origin.
      if (code) {
        const oauthClient = createOAuthClient();
        const { data, error } = await oauthClient.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[callback] exchangeCodeForSession:", error.message);
          router.replace(
            `/auth/login?error=auth&detail=${encodeURIComponent(error.message.slice(0, 120))}`
          );
          return;
        }

        if (data.session) {
          try {
            await syncSessionToCookies(
              data.session.access_token,
              data.session.refresh_token
            );
          } catch (syncErr) {
            console.warn("[callback] syncSessionToCookies failed:", syncErr);
          }
        }

        // Full-page reload so SSR sees the new cookies before the first server request
        window.location.href = destination;
        return;
      }

      // ── 2. Implicit / magic-link flow: #access_token= in URL hash ─────────
      // This happens when:
      //   a) The Supabase project has implicit flow enabled
      //   b) The redirectTo URL was not in Supabase's allowed list so Supabase
      //      fell back to the Site URL but still forwarded tokens as a hash
      //   c) Email magic links or password-reset links
      const rawHash = window.location.hash.slice(1);
      if (rawHash) {
        const hashParams = new URLSearchParams(rawHash);

        // Supabase may embed an error in the hash (e.g. expired link)
        const hashError = hashParams.get("error_code") ?? hashParams.get("error");
        const hashErrorDesc = hashParams.get("error_description");
        if (hashError) {
          const detail = (hashErrorDesc ?? hashError).slice(0, 120);
          router.replace(`/auth/login?error=auth&detail=${encodeURIComponent(detail)}`);
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          try {
            await syncSessionToCookies(accessToken, refreshToken);
            window.location.href = destination;
            return;
          } catch (syncErr) {
            console.error("[callback] hash sync failed:", syncErr);
            router.replace("/auth/login?error=auth&detail=sync_failed");
            return;
          }
        }
      }

      // ── 3. Last resort: session may already live in the localStorage client ─
      // Covers edge cases where a previous attempt partially succeeded.
      try {
        const oauthClient = createOAuthClient();
        const {
          data: { session },
        } = await oauthClient.auth.getSession();
        if (session) {
          await syncSessionToCookies(session.access_token, session.refresh_token);
          window.location.href = destination;
          return;
        }
      } catch {
        // ignore — fall through to error
      }

      // ── 4. Nothing worked ─────────────────────────────────────────────────
      router.replace("/auth/login?error=missing_code");
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
