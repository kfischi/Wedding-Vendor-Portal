import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    console.error("[auth/callback] No code in request. URL:", request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message, "code:", code.slice(0, 8) + "...");
    // Pass the error type so the UI can show a more helpful message
    const errParam = encodeURIComponent(error.message.slice(0, 120));
    return NextResponse.redirect(`${origin}/auth/login?error=auth&detail=${errParam}`);
  }

  if (next?.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (user.email === process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(`${origin}/admin`);
    }
    try {
      const [row] = await db
        .select({ role: vendors.role })
        .from(vendors)
        .where(eq(vendors.userId, user.id))
        .limit(1);
      if (row?.role === "admin") {
        return NextResponse.redirect(`${origin}/admin`);
      }
    } catch {}
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
