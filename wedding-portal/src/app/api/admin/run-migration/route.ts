import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolve } from "path";

/**
 * POST /api/admin/run-migration
 *
 * Applies all pending Drizzle migrations using DIRECT_URL (bypasses PgBouncer).
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

  // DIRECT_URL bypasses PgBouncer — needed for DDL (ALTER TYPE, etc.)
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "Missing DIRECT_URL and DATABASE_URL" }, { status: 500 });
  }

  const isPooled = url.includes(":6543");
  if (isPooled && !process.env.DIRECT_URL) {
    return NextResponse.json({
      error: "DIRECT_URL is not set. ALTER TYPE requires a direct connection (port 5432), not PgBouncer (port 6543). Add DIRECT_URL to Netlify env vars.",
      hint: "Get it from: Supabase Dashboard → Settings → Database → Connection string (Direct, not Pooled)",
    }, { status: 400 });
  }

  const client = postgres(url, { max: 1, ssl: "require", prepare: false, connect_timeout: 30 });
  const db = drizzle(client);

  try {
    // Use Drizzle's migrate() which tracks applied migrations
    const migrationsFolder = resolve(process.cwd(), "drizzle");
    await migrate(db, { migrationsFolder });
    return NextResponse.json({ ok: true, detail: "כל ה-migrations הוחלו בהצלחה" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    await client.end();
  }
}
