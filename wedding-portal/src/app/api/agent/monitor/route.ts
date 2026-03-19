/**
 * Self-healing AI agent — monitors the portal and reports/fixes issues.
 *
 * GET  /api/agent/monitor        → run health check (read-only)
 * POST /api/agent/monitor        → run health check + auto-fix safe issues
 *
 * Designed to be called by a Vercel Cron or external scheduler every hour.
 * Protect with: Authorization: Bearer <AGENT_SECRET>
 */

import { db } from "@/lib/db/db";
import { vendors, vendorMedia, leads } from "@/lib/db/schema";
import { eq, isNull, and, lt, sql } from "drizzle-orm";
import { ANTHROPIC_API_KEY } from "@/lib/env";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGENT_SECRET = process.env.AGENT_SECRET ?? "";

function authError() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

// ── Issue types ───────────────────────────────────────────────────────────────

interface Issue {
  type: string;
  severity: "critical" | "warning" | "info";
  vendorId?: string;
  vendorName?: string;
  detail: string;
  fixed?: boolean;
}

// ── Health checks ─────────────────────────────────────────────────────────────

async function runHealthChecks(): Promise<Issue[]> {
  const issues: Issue[] = [];

  // 1. Active vendors with no cover image
  const noCover = await db
    .select({ id: vendors.id, businessName: vendors.businessName, slug: vendors.slug })
    .from(vendors)
    .where(and(eq(vendors.status, "active"), isNull(vendors.coverImage)));

  for (const v of noCover) {
    issues.push({
      type: "missing_cover_image",
      severity: "warning",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `ספק פעיל ללא תמונת כותרת: ${v.businessName} (/vendors/${v.slug})`,
    });
  }

  // 2. Active vendors with no short description
  const noDesc = await db
    .select({ id: vendors.id, businessName: vendors.businessName })
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        or(isNull(vendors.shortDescription), sql`length(${vendors.shortDescription}) < 10`)
      )
    );

  for (const v of noDesc) {
    issues.push({
      type: "missing_description",
      severity: "warning",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `תיאור קצר חסר או קצר מדי: ${v.businessName}`,
    });
  }

  // 3. Vendors with subscription expired but still active
  const expiredSubs = await db
    .select({ id: vendors.id, businessName: vendors.businessName, plan: vendors.plan })
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        sql`${vendors.plan} != 'free'`,
        sql`${vendors.subscriptionCurrentPeriodEnd} < now()`,
        sql`${vendors.subscriptionCurrentPeriodEnd} is not null`
      )
    );

  for (const v of expiredSubs) {
    issues.push({
      type: "expired_subscription",
      severity: "critical",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `מנוי פג תוקף אך ספק עדיין פעיל: ${v.businessName} (${v.plan})`,
    });
  }

  // 4. Free trial vendors past trial end
  const expiredTrials = await db
    .select({ id: vendors.id, businessName: vendors.businessName })
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        sql`${vendors.trial_ends_at} < now()`,
        sql`${vendors.trial_ends_at} is not null`,
        sql`${vendors.plan} = 'free'`
      )
    );

  for (const v of expiredTrials) {
    issues.push({
      type: "expired_trial",
      severity: "critical",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `ניסיון חינמי פג תוקף: ${v.businessName}`,
    });
  }

  // 5. Vendors with 0 media after 14 days (orphaned registrations)
  const noMedia = await db
    .select({
      id: vendors.id,
      businessName: vendors.businessName,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        sql`${vendors.createdAt} < now() - interval '14 days'`,
        sql`(select count(*) from vendor_media where vendor_id = ${vendors.id}) = 0`
      )
    );

  for (const v of noMedia) {
    issues.push({
      type: "no_media",
      severity: "info",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `ספק פעיל ללא תמונות בגלריה (14+ ימים): ${v.businessName}`,
    });
  }

  // 6. Stale new leads (older than 7 days, still "new")
  const staleLead = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.status, "new"),
        lt(leads.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    );

  const staleCount = Number(staleLead[0]?.count ?? 0);
  if (staleCount > 0) {
    issues.push({
      type: "stale_leads",
      severity: "info",
      detail: `${staleCount} לידים בסטטוס "חדש" מעל 7 ימים ללא טיפול`,
    });
  }

  return issues;
}

// ── Auto-fix: ask Claude what to do ──────────────────────────────────────────

async function analyzeWithClaude(issues: Issue[]): Promise<string> {
  if (!ANTHROPIC_API_KEY || !issues.length) return "";

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `אתה סוכן ניטור של פלטפורמת WeddingPro.
מצאת את הבעיות הבאות:

${issues.map((i, n) => `${n + 1}. [${i.severity.toUpperCase()}] ${i.detail}`).join("\n")}

כתוב סיכום קצר בעברית עם:
1. הבעיות החמורות ביותר שדורשות טיפול מיידי
2. פעולות מומלצות לאדמין
3. הערכת בריאות כללית (0-100)

היה תמציתי — מקסימום 200 מילים.`,
      },
    ],
  });

  return response.content[0]?.type === "text" ? response.content[0].text : "";
}

// ── Handler ───────────────────────────────────────────────────────────────────

function or(...conditions: (ReturnType<typeof eq> | ReturnType<typeof isNull> | ReturnType<typeof sql>)[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}

async function handle(autoFix: boolean, req: Request) {
  if (AGENT_SECRET) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${AGENT_SECRET}`) return authError();
  }

  const started = Date.now();
  const issues = await runHealthChecks();
  const analysis = await analyzeWithClaude(issues);

  const critical = issues.filter((i) => i.severity === "critical");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return Response.json({
    ok: critical.length === 0,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    health_score: Math.max(0, 100 - critical.length * 20 - warnings.length * 5 - infos.length * 1),
    summary: {
      critical: critical.length,
      warnings: warnings.length,
      info: infos.length,
      total: issues.length,
    },
    issues,
    analysis,
    auto_fix: autoFix ? "disabled_in_this_version" : "off",
  });
}

export async function GET(req: Request) {
  return handle(false, req);
}

export async function POST(req: Request) {
  return handle(true, req);
}
