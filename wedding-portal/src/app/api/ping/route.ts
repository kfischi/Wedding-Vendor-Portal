import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";
import { vendors, leads } from "@/lib/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface PingCheck {
  name: string;
  status: "ok" | "warn" | "error";
  detail: string;
  latencyMs?: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PING_SECRET;
  if (secret) {
    // Accept via header (auto-heal) or query param (keep-alive cron)
    const header = req.headers.get("x-ping-secret");
    const query = req.nextUrl.searchParams.get("token");
    if (header !== secret && query !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const checks: PingCheck[] = [];

  // DB connectivity
  try {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    const ms = Date.now() - t0;
    checks.push({ name: "db", status: ms < 2000 ? "ok" : "warn", latencyMs: ms, detail: `${ms}ms` });
  } catch (err) {
    checks.push({ name: "db", status: "error", detail: String(err) });
  }

  // Data sanity
  try {
    const [vCount, lCount] = await Promise.all([
      db.select({ c: count() }).from(vendors),
      db.select({ c: count() }).from(leads),
    ]);
    checks.push({ name: "data", status: "ok", detail: `vendors:${vCount[0].c} leads:${lCount[0].c}` });
  } catch (err) {
    checks.push({ name: "data", status: "warn", detail: String(err) });
  }

  // Required env vars
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "DATABASE_URL"];
  const missing = required.filter((k) => !process.env[k]);
  checks.push({
    name: "env",
    status: missing.length > 0 ? "error" : "ok",
    detail: missing.length > 0 ? `missing: ${missing.join(", ")}` : "ok",
  });

  const overall = checks.some((c) => c.status === "error")
    ? "error"
    : checks.some((c) => c.status === "warn")
    ? "warn"
    : "ok";

  return NextResponse.json(
    { ok: overall === "ok", overall, timestamp: new Date().toISOString(), checks },
    { status: overall === "error" ? 503 : 200 }
  );
}
