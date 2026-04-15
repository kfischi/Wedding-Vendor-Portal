/**
 * Build-time migration script.
 * Runs before `next build` in Netlify.
 *
 * Requires DIRECT_URL (direct Postgres, port 5432) — not the pooled URL.
 * Falls back to DATABASE_URL but DDL statements may fail through PgBouncer.
 *
 * Set DIRECT_URL in Netlify:
 *   postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  // DIRECT_URL bypasses PgBouncer — required for DDL (ALTER TYPE, etc.)
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("❌  Missing DIRECT_URL and DATABASE_URL");
    process.exit(1);
  }

  const isPooled = url.includes(":6543");
  if (isPooled) {
    console.warn("⚠️  Using pooled URL (port 6543). DDL migrations may fail.");
    console.warn("   Set DIRECT_URL (port 5432) for reliable migrations.");
  }

  console.log(`🔄  Running Drizzle migrations (${isPooled ? "pooled" : "direct"} connection)...`);

  const client = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
    connect_timeout: 30,
  });

  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
    console.log("✅  Migrations complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
