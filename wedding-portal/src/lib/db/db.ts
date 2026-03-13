import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[db] FATAL: DATABASE_URL environment variable is not set");
}

// Disable prefetch as it is not supported for Supabase Transaction mode
const client = postgres(connectionString ?? "postgresql://localhost/missing", {
  prepare: false,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
