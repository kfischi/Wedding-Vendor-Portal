import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow for OAuth so no PKCE code-verifier cookie is needed.
        // PKCE flow breaks when cookies are lost during cross-site redirects
        // (Google → Supabase → back to app) on some hosting setups.
        flowType: "implicit",
      },
    }
  );
}
