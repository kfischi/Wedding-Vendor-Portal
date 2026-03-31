import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/db";

// GET /api/ping?token=...
// Used by GitHub Actions cron every 3 days to keep Supabase from pausing.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.PING_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[ping] DB error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
