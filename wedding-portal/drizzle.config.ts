import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// DIRECT_URL = direct Postgres (port 5432) — required for DDL like ALTER TYPE
// DATABASE_URL = pooled PgBouncer (port 6543) — runtime queries only
const migrateUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const parsed = new URL(migrateUrl);

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: parsed.hostname,
    port: Number(parsed.port) || 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
    ssl: true,
  },
  verbose: true,
  strict: true,
} satisfies Config;
