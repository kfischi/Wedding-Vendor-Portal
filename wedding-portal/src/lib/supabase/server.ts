import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      // In production these variables are mandatory — fail loudly so the issue
      // is caught immediately rather than silently bypassing authentication.
      throw new Error(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
          "must be set in production. Check your environment configuration."
      );
    }

    // Development / CI without Supabase — return a no-op client so the dev
    // server boots, but log a clear warning.
    console.warn(
      "[supabase] ⚠  Supabase env vars not set — using placeholder client. " +
        "Auth calls will return null users."
    );

    return createServerClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot set cookies — handled by middleware instead
        }
      },
    },
  });
}
