import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/test-register
 *
 * Diagnostic endpoint: tests every prerequisite for /api/register-free.
 * Requires admin auth. Does NOT create real data — creates and immediately
 * deletes a test Supabase user to verify admin client works.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const steps: { step: string; status: "ok" | "error"; detail: string }[] = [];

  // ── 1. Env vars ──────────────────────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  steps.push({
    step: "env_vars",
    status: url && key ? "ok" : "error",
    detail: url && key
      ? `URL: ${url?.slice(0, 40)}… | KEY: ${key?.slice(0, 20)}…`
      : `Missing: ${!url ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!key ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`,
  });

  if (!url || !key) {
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── 2. DB connectivity ───────────────────────────────────────────────────────
  try {
    await db.execute(sql`SELECT 1`);
    steps.push({ step: "db_connection", status: "ok", detail: "DB מגיב תקין" });
  } catch (err) {
    steps.push({ step: "db_connection", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── 3. Supabase admin client ─────────────────────────────────────────────────
  let admin: ReturnType<typeof createSupabaseAdmin>;
  try {
    admin = createSupabaseAdmin(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    steps.push({ step: "supabase_admin_client", status: "ok", detail: "Admin client נוצר" });
  } catch (err) {
    steps.push({ step: "supabase_admin_client", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── 4. listUsers (tests service role key permissions) ───────────────────────
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    steps.push({
      step: "supabase_list_users",
      status: "ok",
      detail: `listUsers עבד — ${data.users.length} משתמשים בעמוד 1`,
    });
  } catch (err) {
    steps.push({ step: "supabase_list_users", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // ── 5. createUser + deleteUser (round-trip test) ─────────────────────────────
  const testEmail = `diag-test-${Date.now()}@weddingpro-test.invalid`;
  let testUserId: string | undefined;
  try {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: "TestPass1234!",
      email_confirm: true,
    });
    if (createErr) throw createErr;
    testUserId = created.user?.id;
    steps.push({ step: "supabase_create_user", status: "ok", detail: `נוצר: ${testUserId}` });
  } catch (err) {
    steps.push({ step: "supabase_create_user", status: "error", detail: String(err) });
    return NextResponse.json({ steps, overall: "error" });
  }

  // cleanup
  if (testUserId) {
    try {
      await admin.auth.admin.deleteUser(testUserId);
      steps.push({ step: "supabase_delete_user", status: "ok", detail: "Cleanup בוצע" });
    } catch {
      steps.push({ step: "supabase_delete_user", status: "error", detail: "Cleanup נכשל (לא קריטי)" });
    }
  }

  const overall = steps.every((s) => s.status === "ok") ? "ok" : "error";
  return NextResponse.json({ steps, overall });
}
