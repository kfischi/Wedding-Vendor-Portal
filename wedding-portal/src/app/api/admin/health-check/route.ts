import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { vendors, leads, automationLogs } from "@/lib/db/schema";
import { eq, count, gte, and, lt } from "drizzle-orm";
import { Resend } from "resend";
import { RESEND_API_KEY, ADMIN_EMAIL, N8N_API_KEY, NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const runtime = "nodejs";

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
  details?: unknown;
}

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (auth && N8N_API_KEY && auth === `Bearer ${N8N_API_KEY}`) return true;
  const secret = request.headers.get("x-admin-secret");
  if (secret && secret === process.env.PING_SECRET) return true;
  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: CheckResult[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── 1. DB connectivity ────────────────────────────────────────────────────────
  try {
    const [{ value }] = await db.select({ value: count() }).from(vendors);
    checks.push({
      name: "database",
      status: "ok",
      message: `DB מחובר — ${value} ספקים`,
    });
  } catch (err) {
    checks.push({
      name: "database",
      status: "error",
      message: `DB לא זמין: ${err instanceof Error ? err.message : "unknown"}`,
    });
  }

  // ── 2. Pending vendors > 7 days ───────────────────────────────────────────────
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(vendors)
      .where(and(eq(vendors.status, "pending"), lt(vendors.createdAt, sevenDaysAgo)));

    checks.push({
      name: "pending_vendors",
      status: Number(value) > 0 ? "warn" : "ok",
      message: Number(value) > 0
        ? `⚠️ ${value} ספקים ממתינים לאישור יותר מ-7 ימים`
        : "אין ספקים תקועים",
      details: { count: Number(value) },
    });
  } catch {
    checks.push({ name: "pending_vendors", status: "warn", message: "לא ניתן לבדוק" });
  }

  // ── 3. Leads in last 24h ──────────────────────────────────────────────────────
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(leads)
      .where(gte(leads.createdAt, oneDayAgo));

    checks.push({
      name: "leads_24h",
      status: "ok",
      message: `${value} לידים ב-24 שעות אחרונות`,
      details: { count: Number(value) },
    });
  } catch {
    checks.push({ name: "leads_24h", status: "warn", message: "לא ניתן לבדוק לידים" });
  }

  // ── 4. Automation errors in last 24h ─────────────────────────────────────────
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(automationLogs)
      .where(and(eq(automationLogs.status, "failed"), gte(automationLogs.createdAt, oneDayAgo)));

    checks.push({
      name: "automation_errors",
      status: Number(value) > 3 ? "error" : Number(value) > 0 ? "warn" : "ok",
      message: Number(value) > 0
        ? `⚠️ ${value} שגיאות אוטומציה ב-24 שעות`
        : "אין שגיאות אוטומציה",
      details: { errors: Number(value) },
    });
  } catch {
    checks.push({ name: "automation_errors", status: "ok", message: "לא ניתן לבדוק" });
  }

  // ── 5. ENV vars check ─────────────────────────────────────────────────────────
  const missingEnv: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missingEnv.push("STRIPE_SECRET_KEY");
  if (!process.env.RESEND_API_KEY) missingEnv.push("RESEND_API_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.ANTHROPIC_API_KEY) missingEnv.push("ANTHROPIC_API_KEY");

  checks.push({
    name: "env_vars",
    status: missingEnv.length > 0 ? "error" : "ok",
    message: missingEnv.length > 0
      ? `חסרים: ${missingEnv.join(", ")}`
      : "כל משתני הסביבה מוגדרים",
    details: { missing: missingEnv },
  });

  // ── Summary ───────────────────────────────────────────────────────────────────
  const hasErrors = checks.some((c) => c.status === "error");
  const hasWarnings = checks.some((c) => c.status === "warn");
  const overallStatus = hasErrors ? "error" : hasWarnings ? "warn" : "ok";

  // ── Send email alert if there are issues ──────────────────────────────────────
  const shouldAlert = (hasErrors || hasWarnings) && RESEND_API_KEY && ADMIN_EMAIL;
  if (shouldAlert) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const baseUrl = NEXT_PUBLIC_APP_URL;
      const hostname = new URL(baseUrl).hostname;

      const issueRows = checks
        .filter((c) => c.status !== "ok")
        .map((c) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0ece8;">${c.name}</td><td style="padding:6px 8px;border-bottom:1px solid #f0ece8;color:${c.status === "error" ? "#dc2626" : "#d97706"};">${c.status.toUpperCase()}</td><td style="padding:6px 8px;border-bottom:1px solid #f0ece8;">${c.message}</td></tr>`)
        .join("");

      await resend.emails.send({
        from: `WeddingPro Monitor <noreply@${hostname}>`,
        to: ADMIN_EMAIL,
        subject: `[WeddingPro] ${hasErrors ? "🔴 בעיה" : "🟡 אזהרה"} — Health Check`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1a1614,#2d2420);padding:20px 24px;">
              <p style="margin:0;font-size:18px;color:#b8976a;font-weight:bold;">WeddingPro Monitor</p>
            </div>
            <div style="padding:20px 24px;background:#fff;">
              <h2 style="color:#1a1614;margin:0 0 12px;">Health Check — ${hasErrors ? "בעיה נמצאה" : "אזהרות"}</h2>
              <p style="color:#5a4a42;font-size:13px;">בדיקה שבוצעה: ${new Date().toLocaleString("he-IL")}</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
                <thead>
                  <tr style="background:#faf8f5;">
                    <th style="padding:8px;text-align:right;border-bottom:2px solid #e8ddd0;">בדיקה</th>
                    <th style="padding:8px;text-align:right;border-bottom:2px solid #e8ddd0;">סטטוס</th>
                    <th style="padding:8px;text-align:right;border-bottom:2px solid #e8ddd0;">פרטים</th>
                  </tr>
                </thead>
                <tbody>${issueRows}</tbody>
              </table>
              <div style="margin-top:20px;text-align:center;">
                <a href="${baseUrl}/admin" style="background:linear-gradient(135deg,#b8976a,#9a7d56);color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">
                  פתח פאנל ניהול
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("[health-check] email error:", err);
    }
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: now.toISOString(),
    alertSent: !!shouldAlert,
    checks,
  });
}
