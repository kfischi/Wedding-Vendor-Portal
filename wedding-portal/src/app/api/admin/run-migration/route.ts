import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";

/**
 * POST /api/admin/run-migration
 *
 * Adds missing enum values to the production DB.
 * Safe to run multiple times (IF NOT EXISTS).
 * Requires admin auth.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: { statement: string; status: "ok" | "error"; detail: string }[] = [];

  const migrations = [
    `ALTER TYPE "public"."vendor_category" ADD VALUE IF NOT EXISTS 'wedding-dress-designers'`,
    `ALTER TYPE "public"."vendor_category" ADD VALUE IF NOT EXISTS 'bridal-preparation'`,
  ];

  for (const statement of migrations) {
    try {
      await db.execute(sql.raw(statement));
      results.push({ statement, status: "ok", detail: "הצליח" });
    } catch (err) {
      results.push({ statement, status: "error", detail: String(err) });
    }
  }

  const allOk = results.every(r => r.status === "ok");
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 });
}
