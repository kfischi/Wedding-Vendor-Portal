import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Dev mode — no Supabase configured, allow everything
  if (!supabaseUrl || !supabaseKey) return NextResponse.next({ request });

  // Must create supabaseResponse first and keep it in sync — per Supabase SSR docs
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set on request (for downstream server components)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Recreate response so cookies are attached
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin =
    user?.user_metadata?.role === "admin" ||
    user?.app_metadata?.role === "admin" ||
    (!!adminEmail && user?.email === adminEmail);

  // Helper: redirect while preserving Supabase auth cookies
  const redirectTo = (url: string) => {
    const res = NextResponse.redirect(new URL(url, request.url));
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
      res.cookies.set(name, value, opts);
    });
    return res;
  };

  // Protect /admin — must be admin
  if (pathname.startsWith("/admin")) {
    if (!user) return redirectTo("/auth/login");
    if (!isAdmin) return redirectTo("/dashboard");
    return supabaseResponse;
  }

  // Protect /dashboard — must be logged in
  if (pathname.startsWith("/dashboard")) {
    if (!user) return redirectTo("/auth/login");
    return supabaseResponse;
  }

  // Redirect logged-in users away from login page
  if (pathname === "/auth/login" && user) {
    return redirectTo(isAdmin ? "/admin" : "/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/auth/login"],
};
