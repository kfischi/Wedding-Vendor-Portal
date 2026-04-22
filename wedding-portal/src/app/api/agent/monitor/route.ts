/**
 * Self-healing AI agent — monitors the portal and auto-fixes issues.
 *
 * GET  /api/agent/monitor        → run health check (read-only)
 * POST /api/agent/monitor        → run health check + auto-fix safe issues
 *
 * Designed to be called by Vercel Cron every hour.
 * Protect with: Authorization: Bearer <AGENT_SECRET>
 */

import { db } from "@/lib/db/db";
import { vendors, vendorMedia, leads } from "@/lib/db/schema";
import { eq, isNull, and, lt, sql } from "drizzle-orm";
import { ANTHROPIC_API_KEY, RESEND_API_KEY, NEXT_PUBLIC_APP_URL, ADMIN_EMAIL } from "@/lib/env";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

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
  fixAction?: string;
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
        orCondition(isNull(vendors.shortDescription), sql`length(${vendors.shortDescription}) < 10`)
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

  // 3. Vendors with subscription expired but still active (paid plan)
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
        sql`${vendors.trialEndsAt} < now()`,
        sql`${vendors.trialEndsAt} is not null`,
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
    .select({ id: vendors.id, businessName: vendors.businessName, createdAt: vendors.createdAt })
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

  // 7. Vendors with 0 views in last 30 days (invisible vendors)
  const noViews = await db
    .select({ id: vendors.id, businessName: vendors.businessName })
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        sql`${vendors.createdAt} < now() - interval '30 days'`,
        sql`${vendors.viewCount} = 0`
      )
    );

  for (const v of noViews) {
    issues.push({
      type: "no_views",
      severity: "info",
      vendorId: v.id,
      vendorName: v.businessName,
      detail: `ספק ללא צפיות: ${v.businessName} — יתכן שהדף לא נצפה כלל`,
    });
  }

  return issues;
}

// ── Auto-fix: actually fix safe issues ───────────────────────────────────────

async function autoFix(issues: Issue[]): Promise<Issue[]> {
  const fixed: Issue[] = [];

  for (const issue of issues) {
    // Fix 1: Downgrade expired paid subscriptions to free plan
    if (issue.type === "expired_subscription" && issue.vendorId) {
      try {
        await db
          .update(vendors)
          .set({ plan: "free", subscriptionStatus: "expired" })
          .where(eq(vendors.id, issue.vendorId));
        fixed.push({ ...issue, fixed: true, fixAction: "הורד לתוכנית חינמית" });
      } catch (err) {
        console.error(`[monitor] auto-fix expired_subscription failed for ${issue.vendorId}:`, err);
        fixed.push(issue);
      }
      continue;
    }

    // Fix 2: Mark expired trial vendors accordingly (suspend trial flag)
    if (issue.type === "expired_trial" && issue.vendorId) {
      try {
        await db
          .update(vendors)
          .set({ trialEndsAt: null })
          .where(eq(vendors.id, issue.vendorId));
        fixed.push({ ...issue, fixed: true, fixAction: "נוקה דגל הניסיון" });
      } catch (err) {
        console.error(`[monitor] auto-fix expired_trial failed for ${issue.vendorId}:`, err);
        fixed.push(issue);
      }
      continue;
    }

    fixed.push(issue);
  }

  return fixed;
}

// ── Send admin alert email ────────────────────────────────────────────────────

async function sendAdminAlert(
  issues: Issue[],
  healthScore: number,
  analysis: string
): Promise<void> {
  if (!RESEND_API_KEY || !ADMIN_EMAIL) return;

  const critical = issues.filter((i) => i.severity === "critical");
  if (critical.length === 0 && healthScore > 85) return; // Only alert when there are real problems

  const resend = new Resend(RESEND_API_KEY);
  const baseUrl = NEXT_PUBLIC_APP_URL;

  const issueRows = issues
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 10px; border-bottom:1px solid #e8ddd0;">
          <span style="display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:bold;
            background:${i.severity === "critical" ? "#fee2e2" : i.severity === "warning" ? "#fef9c3" : "#f0f9ff"};
            color:${i.severity === "critical" ? "#dc2626" : i.severity === "warning" ? "#b45309" : "#0369a1"}">
            ${i.severity.toUpperCase()}
          </span>
        </td>
        <td style="padding:6px 10px; border-bottom:1px solid #e8ddd0; font-size:13px; color:#1a1614;">
          ${i.detail}${i.fixed ? ' ✅ <em style="color:#16a34a">תוקן אוטומטית</em>' : ""}
        </td>
      </tr>`
    )
    .join("");

  await resend.emails.send({
    from: `WeddingPro Monitor <noreply@${new URL(baseUrl).hostname}>`,
    to: ADMIN_EMAIL,
    subject: `🤖 דוח בריאות מערכת — ציון ${healthScore}/100`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif; max-width:640px; margin:0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1614 0%,#2d2420 100%); padding:24px 32px;">
          <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">🤖 WeddingPro — דוח בריאות</p>
          <p style="margin:8px 0 0; font-size:28px; color:${healthScore >= 80 ? "#4ade80" : healthScore >= 60 ? "#fbbf24" : "#f87171"}; font-weight:bold;">
            ציון: ${healthScore}/100
          </p>
        </div>
        <div style="padding:24px 32px; background:#fff;">
          <p style="margin:0 0 16px; font-size:14px; color:#5a4a42;">${analysis}</p>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e8ddd0; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:#faf8f5;">
                <th style="padding:8px 10px; font-size:12px; color:#9e8e86; text-align:right;">חומרה</th>
                <th style="padding:8px 10px; font-size:12px; color:#9e8e86; text-align:right;">פרטים</th>
              </tr>
            </thead>
            <tbody>${issueRows}</tbody>
          </table>
          <div style="margin-top:20px; text-align:center;">
            <a href="${baseUrl}/admin" style="display:inline-block; background:linear-gradient(135deg,#b8976a 0%,#9a7d56 100%); color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
              כנס לפאנל האדמין
            </a>
          </div>
        </div>
        <div style="padding:14px 32px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
          WeddingPro Self-Healing Robot · ${new Date().toLocaleDateString("he-IL")}
        </div>
      </div>
    `,
  });
}

// ── Claude analysis ────────────────────────────────────────────────────────────

async function analyzeWithClaude(issues: Issue[]): Promise<string> {
  if (!ANTHROPIC_API_KEY || !issues.length) return "מערכת תקינה ✅";

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `אתה סוכן ניטור של פלטפורמת WeddingPro. מצאת את הבעיות הבאות:

${issues.map((i, n) => `${n + 1}. [${i.severity.toUpperCase()}] ${i.detail}${i.fixed ? " (תוקן)" : ""}`).join("\n")}

כתוב סיכום קצר בעברית עם:
1. הבעיות החמורות ביותר שדורשות טיפול מיידי
2. פעולות מומלצות לאדמין
3. הערכת בריאות כללית (0-100)

היה תמציתי — מקסימום 150 מילים.`,
      },
    ],
  });

  return response.content[0]?.type === "text" ? response.content[0].text : "ניתוח לא זמין";
}

// ── Helper ────────────────────────────────────────────────────────────────────

function orCondition(
  ...conditions: (ReturnType<typeof eq> | ReturnType<typeof isNull> | ReturnType<typeof sql>)[]
) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(autoFixEnabled: boolean, req: Request) {
  if (AGENT_SECRET) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${AGENT_SECRET}`) return authError();
  }

  const started = Date.now();
  let issues = await runHealthChecks();

  // Auto-fix if POST
  if (autoFixEnabled) {
    issues = await autoFix(issues);
  }

  const analysis = await analyzeWithClaude(issues);

  const critical = issues.filter((i) => i.severity === "critical");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  const fixedCount = issues.filter((i) => i.fixed).length;

  const healthScore = Math.max(
    0,
    100 - critical.length * 20 - warnings.length * 5 - infos.length * 1
  );

  // Send email alert (non-blocking)
  if (autoFixEnabled) {
    void sendAdminAlert(issues, healthScore, analysis);
  }

  return Response.json({
    ok: critical.length === 0,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    health_score: healthScore,
    summary: {
      critical: critical.length,
      warnings: warnings.length,
      info: infos.length,
      total: issues.length,
      auto_fixed: fixedCount,
    },
    issues,
    analysis,
    auto_fix: autoFixEnabled ? "enabled" : "off",
  });
}

export async function GET(req: Request) {
  return handle(false, req);
}

export async function POST(req: Request) {
  return handle(true, req);
}
