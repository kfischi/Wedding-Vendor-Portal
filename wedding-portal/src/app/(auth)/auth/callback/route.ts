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
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
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
