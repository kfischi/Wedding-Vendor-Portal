import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { automationLogs } from "@/lib/db/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const event = searchParams.get("event");
  const since = searchParams.get("since"); // ISO date
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  const conditions = [];
  if (channel) conditions.push(eq(automationLogs.channel, channel as "n8n" | "waha" | "email" | "ai" | "cron"));
  if (status) conditions.push(eq(automationLogs.status, status as "sent" | "failed" | "skipped" | "pending"));
  if (event) conditions.push(eq(automationLogs.event, event));
  if (since) conditions.push(gte(automationLogs.createdAt, new Date(since)));

  const rows = await db
    .select()
    .from(automationLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(automationLogs.createdAt))
    .limit(limit);

  // Summary stats for last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      failed: sql<number>`count(*) filter (where ${automationLogs.status} = 'failed')`,
      sent: sql<number>`count(*) filter (where ${automationLogs.status} = 'sent')`,
      skipped: sql<number>`count(*) filter (where ${automationLogs.status} = 'skipped')`,
    })
    .from(automationLogs)
    .where(gte(automationLogs.createdAt, yesterday));

  return NextResponse.json({ logs: rows, stats });
}
