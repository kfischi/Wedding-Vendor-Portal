import { createBrowserClient } from "@supabase/ssr";
import { createClient as createRawSupabase } from "@supabase/supabase-js";

/**
 * SSR-aware client — stores session in cookies so server components can read it.
 * Use this for everything EXCEPT initiating OAuth.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Raw browser client — stores auth state (including PKCE code-verifier) in
 * localStorage instead of cookies.  Use ONLY for the OAuth sign-in flow where
 * cookie-based PKCE breaks because the cross-domain redirect chain
 * (app → Google → Supabase → app) loses cookies under some browser / CDN
 * configurations.
 *
 * After the code exchange succeeds, call syncSessionToCookies() so the
 * SSR-aware client can also see the session.
 */
let _rawClient: ReturnType<typeof createRawSupabase> | null = null;

export function createOAuthClient() {
  if (typeof window === "undefined") return createRawSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { detectSessionInUrl: false, storageKey: "sb-oauth-pkce" } }
  );
  if (!_rawClient) {
    _rawClient = createRawSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Separate storage key — avoids "Multiple GoTrueClient" conflict with SSR client
          storageKey: "sb-oauth-pkce",
          // We call exchangeCodeForSession manually; disable auto-detection to prevent
          // race condition where the client tries to auto-exchange the URL code
          detectSessionInUrl: false,
        },
      }
    );
  }
  return _rawClient;
}

/**
 * After the OAuth code is exchanged with createOAuthClient(), call this to
 * sync the session into the cookie-based SSR client so /dashboard and other
 * server components can see the authenticated user.
 */
export async function syncSessionToCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const ssrClient = createClient();
  await ssrClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
}
