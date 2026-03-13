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

  // Helper: determine if the current user is an admin
  const checkIsAdmin = () => {
    if (!user) return false;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) return true;
    // role can live in user_metadata (raw_user_meta_data) or app_metadata
    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined);
    console.log(
      "[proxy] email:", user.email,
      "user_metadata:", JSON.stringify(user.user_metadata),
      "app_metadata:", JSON.stringify(user.app_metadata),
      "role:", role
    );
    return role === "admin";
  };

  // מחובר → redirect מ-login
  if (user && pathname.startsWith("/auth/login")) {
    const isAdmin = checkIsAdmin();
    return NextResponse.redirect(
      new URL(isAdmin ? "/admin" : "/dashboard", request.url)
    );
  }

  // הגנה על /dashboard — דורש אימות
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // אדמין שמנסה לגשת ל-/dashboard → שלח ל-/admin
    if (checkIsAdmin()) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // הגנה על /admin — דורש אימות + תפקיד admin
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (!checkIsAdmin()) {
      console.log("[proxy] non-admin tried to access /admin, redirecting to /dashboard");
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
