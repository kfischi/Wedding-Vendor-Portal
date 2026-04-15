import { NextResponse } from "next/server";
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
export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: { statement: string; status: "ok" | "error"; detail: string }[] = [];

  // Each ALTER TYPE must run separately (cannot be batched in one execute call)
  const statements = [
    "ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'wedding-dress-designers'",
    "ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'bridal-preparation'",
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
      results.push({ statement, status: "ok", detail: "הצליח" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ statement, status: "error", detail: msg });
    }
  }

  // Verify the values now exist
  try {
    const check = await db.execute(sql`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'vendor_category'
    `);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = (check as any[]).map((r: { enumlabel: string }) => r.enumlabel);
    results.push({
      statement: "verify",
      status: values.includes("bridal-preparation") && values.includes("wedding-dress-designers") ? "ok" : "error",
      detail: `ערכים קיימים: ${values.join(", ")}`,
    });
  } catch (err) {
    results.push({ statement: "verify", status: "error", detail: String(err) });
  }

  const allOk = results.every(r => r.status === "ok");
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 207 });
}
