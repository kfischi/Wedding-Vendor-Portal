import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Dev mode — no Supabase configured, allow everything
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
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

  // Protect /admin — must be admin
  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
    if (!isAdmin) return NextResponse.redirect(new URL("/dashboard", request.url));
    return response;
  }

  // Protect /dashboard — must be logged in
  if (pathname.startsWith("/dashboard")) {
    if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
    return response;
  }

  // Redirect logged-in users away from login page
  if (pathname === "/auth/login" && user) {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/auth/login"],
};
