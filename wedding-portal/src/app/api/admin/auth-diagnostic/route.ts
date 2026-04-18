import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { coupons, vendors } from "@/lib/db/schema";
import { eq, and, lte, or, isNull, gte } from "drizzle-orm";

/**
 * GET /api/admin/auth-diagnostic
 *
 * Runs a full auth-chain diagnostic and returns a JSON report.
 * Admin-only — returns 401/403 if not authenticated as admin.
 *
 * Checks:
 *  1. Supabase env vars present
 *  2. Service role key works (admin API reachable)
 *  3. Admin email configured + admin user exists in Supabase
 *  4. WEDDINGPRO coupon exists and is valid in the DB
 *  5. Database connectivity (vendor count)
 *  6. OAuth redirect URL sanity check
 *  7. Supabase Auth settings (fetched via Management API if possible)
 */
export async function GET(): Promise<NextResponse> {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, unknown>,
  };

  const checks = report.checks as Record<string, unknown>;

  // ── 1. Env vars ────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "✅ set" : "❌ MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "✅ set" : "❌ MISSING",
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? "✅ set" : "❌ MISSING",
    NEXT_PUBLIC_APP_URL: appUrl || "(not set — will use window.location.origin)",
    ADMIN_EMAIL: adminEmail ? `✅ ${adminEmail}` : "❌ MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "✅ set" : "❌ MISSING",
  };

  // ── 2. Supabase admin API reachable ────────────────────────────────────────
  let adminClient: ReturnType<typeof createSupabaseAdmin> | null = null;
  if (supabaseUrl && serviceRoleKey) {
    try {
      adminClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // List first page of users — just to confirm the admin API works
      const { data: usersPage, error: listErr } =
        await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });

      checks.supabase_admin_api = listErr
        ? { status: "❌ FAILED", error: listErr.message }
        : { status: "✅ reachable", totalUsersInFirstPage: usersPage?.users?.length ?? 0 };
    } catch (err) {
      checks.supabase_admin_api = { status: "❌ ERROR", error: String(err) };
    }
  } else {
    checks.supabase_admin_api = { status: "⚠️ skipped — missing env vars" };
  }

  // ── 3. Admin user in Supabase ──────────────────────────────────────────────
  if (adminClient && adminEmail) {
    try {
      const { data: usersSearch } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const adminUser = usersSearch?.users?.find((u) => u.email === adminEmail);
      checks.admin_user = adminUser
        ? {
            status: "✅ exists",
            id: adminUser.id,
            email: adminUser.email,
            emailConfirmed: !!adminUser.email_confirmed_at,
            lastSignIn: adminUser.last_sign_in_at ?? "never",
          }
        : { status: "⚠️ not found in Supabase — admin can only log in via Google (auto-creates account)" };
    } catch (err) {
      checks.admin_user = { status: "❌ ERROR", error: String(err) };
    }
  } else {
    checks.admin_user = { status: "⚠️ skipped" };
  }

  // ── 4. WEDDINGPRO coupon ───────────────────────────────────────────────────
  try {
    const now = new Date();
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, "WEDDINGPRO"),
          eq(coupons.isActive, true),
          lte(coupons.validFrom, now),
          or(isNull(coupons.validUntil), gte(coupons.validUntil, now))
        )
      )
      .limit(1);

    checks.coupon_weddingpro = coupon
      ? {
          status: "✅ valid",
          id: coupon.id,
          usedCount: coupon.usedCount,
          maxUses: coupon.maxUses ?? "unlimited",
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil ?? "never expires",
        }
      : {
          status: "❌ NOT FOUND or inactive/expired",
          fix: "Call GET /api/admin/seed-coupon to create it",
        };
  } catch (err) {
    checks.coupon_weddingpro = { status: "❌ DB ERROR", error: String(err) };
  }

  // ── 5. DB connectivity (vendor count) ─────────────────────────────────────
  try {
    const allVendors = await db.select({ id: vendors.id }).from(vendors);
    checks.database = { status: "✅ connected", vendorCount: allVendors.length };
  } catch (err) {
    checks.database = { status: "❌ FAILED", error: String(err) };
  }

  // ── 6. OAuth redirect URL sanity ──────────────────────────────────────────
  const callbackUrl = `${appUrl || "https://www.weddingpro.co.il"}/auth/callback`;
  checks.oauth_redirect = {
    expectedCallbackUrl: callbackUrl,
    instruction:
      `Verify that "${callbackUrl}" is listed in Supabase Dashboard → ` +
      "Authentication → URL Configuration → Redirect URLs",
    siteUrl:
      `Also set Site URL to "${appUrl || "https://www.weddingpro.co.il"}" ` +
      "in Supabase Dashboard → Authentication → URL Configuration",
  };

  // ── 7. Test create + login a throw-away user (verifies password auth) ──────
  const testEmail = `__diag_test_${Date.now()}@diag.internal`;
  const testPassword = `DiagTest_${Math.random().toString(36).slice(2, 10)}!`;

  if (adminClient) {
    try {
      // Create test user (email confirmed immediately via admin API)
      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
        });

      if (createErr) {
        checks.password_auth_test = { status: "❌ createUser failed", error: createErr.message };
      } else {
        // Immediately try to sign in with password using the ANON key (as the client would)
        const anonClient = createSupabaseAdmin(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: signInData, error: signInErr } =
          await anonClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          });

        if (signInErr) {
          checks.password_auth_test = {
            status: "❌ signInWithPassword failed",
            error: signInErr.message,
          };
        } else {
          checks.password_auth_test = {
            status: "✅ password auth works",
            userId: signInData.user?.id,
          };
        }

        // Clean up — delete the test user
        if (created?.user?.id) {
          await adminClient.auth.admin.deleteUser(created.user.id).catch(() => {});
        }
      }
    } catch (err) {
      checks.password_auth_test = { status: "❌ ERROR", error: String(err) };
    }
  } else {
    checks.password_auth_test = { status: "⚠️ skipped — service role key missing" };
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const failures = Object.entries(checks).filter(([, v]) =>
    JSON.stringify(v).includes("❌")
  );
  const warnings = Object.entries(checks).filter(([, v]) =>
    JSON.stringify(v).includes("⚠️")
  );

  report.summary = {
    failures: failures.map(([k]) => k),
    warnings: warnings.map(([k]) => k),
    overall:
      failures.length === 0
        ? "✅ All checks passed"
        : `❌ ${failures.length} failure(s) — see details above`,
  };

  return NextResponse.json(report, { status: 200 });
}
