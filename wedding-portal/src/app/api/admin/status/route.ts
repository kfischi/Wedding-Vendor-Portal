import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";
import { vendors, leads } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Check {
  name: string;
  status: "ok" | "warn" | "error";
  latencyMs?: number;
  detail: string;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const checks: Check[] = [];

  // ── 1. DB connectivity + latency ──────────────────────────────────────────────
  try {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    const ms = Date.now() - t0;
    checks.push({ name: "DB Connection", status: ms < 1000 ? "ok" : "warn", latencyMs: ms, detail: `מגיב ב-${ms}ms` });
  } catch (err) {
    checks.push({ name: "DB Connection", status: "error", detail: String(err) });
  }

  // ── 2. DB vendor_category enum values ─────────────────────────────────────────
  try {
    const result = await db.execute(sql`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'vendor_category'
      ORDER BY enumsortorder
    `);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = (result as any[]).map((r: { enumlabel: string }) => r.enumlabel);
    const hasBridal = values.includes("bridal-preparation");
    const hasWeddingDress = values.includes("wedding-dress-designers");
    const missing = [!hasBridal && "bridal-preparation", !hasWeddingDress && "wedding-dress-designers"].filter(Boolean);
    checks.push({
      name: "vendor_category Enum",
      status: missing.length === 0 ? "ok" : "error",
      detail: missing.length === 0
        ? `${values.length} ערכים — כולם נמצאים`
        : `חסרים: ${missing.join(", ")}. הרץ migration!`,
    });
  } catch (err) {
    checks.push({ name: "vendor_category Enum", status: "warn", detail: String(err) });
  }

  // ── 3. Vendor + lead counts ───────────────────────────────────────────────────
  try {
    const [vCount, lCount] = await Promise.all([
      db.select({ c: count() }).from(vendors),
      db.select({ c: count() }).from(leads),
    ]);
    checks.push({ name: "DB Data", status: "ok", detail: `${vCount[0].c} ספקים | ${lCount[0].c} לידים` });
  } catch (err) {
    checks.push({ name: "DB Data", status: "warn", detail: String(err) });
  }

  // ── 4. Supabase Admin API ─────────────────────────────────────────────────────
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("חסרים NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    const t0 = Date.now();
    const admin = createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    const ms = Date.now() - t0;
    checks.push({ name: "Supabase Admin API", status: "ok", latencyMs: ms, detail: `מגיב ב-${ms}ms` });
  } catch (err) {
    checks.push({ name: "Supabase Admin API", status: "error", detail: String(err) });
  }

  // ── 5. Env vars ───────────────────────────────────────────────────────────────
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "ADMIN_EMAIL"];
  const optional = ["RESEND_API_KEY", "CLOUDINARY_CLOUD_NAME", "PING_SECRET"];
  const missingRequired = required.filter(k => !process.env[k]);
  const missingOptional = optional.filter(k => !process.env[k]);
  checks.push({
    name: "Env Vars",
    status: missingRequired.length > 0 ? "error" : missingOptional.length > 0 ? "warn" : "ok",
    detail: missingRequired.length > 0
      ? `חסרים (קריטי): ${missingRequired.join(", ")}`
      : missingOptional.length > 0
      ? `חסרים (אופציונלי): ${missingOptional.join(", ")}`
      : "כל המשתנים מוגדרים",
  });

  const overall = checks.some(c => c.status === "error") ? "error"
    : checks.some(c => c.status === "warn") ? "warn" : "ok";

  return NextResponse.json({ overall, timestamp: new Date().toISOString(), checks });
}
