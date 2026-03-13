import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // אם Supabase לא מוגדר — מאפשרים הכול (dev mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
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

  // מחובר → redirect מ-login
  if (user && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // הגנה על /dashboard
  if (pathname.startsWith("/dashboard") && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // הגנה על /admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Debug: log what metadata the JWT contains
    console.log("[admin-guard] user.email:", user.email);
    console.log("[admin-guard] user_metadata:", JSON.stringify(user.user_metadata));
    console.log("[admin-guard] app_metadata:", JSON.stringify(user.app_metadata));

    // Check role in user_metadata (raw_user_meta_data) or app_metadata
    const metaRole =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined);

    // Also allow ADMIN_EMAIL bypass (matches layout.tsx + actions.ts logic)
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = metaRole === "admin" || (adminEmail && user.email === adminEmail);

    console.log("[admin-guard] metaRole:", metaRole, "isAdmin:", isAdmin);

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
