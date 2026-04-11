/**
 * Auth chain integration test
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ADMIN_EMAIL=kfir.biz@gmail.com \
 *   npx tsx src/scripts/test-auth-chain.ts
 *
 * Or create .env.local with those values and run without inline vars.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

function ok(label: string, detail?: string) {
  console.log(`${PASS} ${label}${detail ? `  →  ${detail}` : ""}`);
}
function fail(label: string, detail?: string) {
  console.error(`${FAIL} ${label}${detail ? `  →  ${detail}` : ""}`);
  return 1;
}
function warn(label: string, detail?: string) {
  console.warn(`${WARN}${label}${detail ? `  →  ${detail}` : ""}`);
}
function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

async function main() {
  let failCount = 0;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.weddingpro.co.il";

  // ── 1. Env vars ─────────────────────────────────────────────────────────────
  section("1 · Env vars");

  SUPABASE_URL     ? ok("NEXT_PUBLIC_SUPABASE_URL",    SUPABASE_URL)  : (failCount += fail("NEXT_PUBLIC_SUPABASE_URL missing"));
  SUPABASE_ANON_KEY ? ok("NEXT_PUBLIC_SUPABASE_ANON_KEY", "(set)")   : (failCount += fail("NEXT_PUBLIC_SUPABASE_ANON_KEY missing"));
  SERVICE_ROLE_KEY  ? ok("SUPABASE_SERVICE_ROLE_KEY",     "(set)")   : warn("SUPABASE_SERVICE_ROLE_KEY not provided — skipping admin tests");
  ADMIN_EMAIL       ? ok("ADMIN_EMAIL",                   ADMIN_EMAIL): warn("ADMIN_EMAIL not set");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("\nCannot continue without Supabase URL and anon key.\n");
    process.exit(1);
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 2. Supabase reachable (anon) ────────────────────────────────────────────
  section("2 · Supabase connectivity (anon key)");

  try {
    // getSession with no session set — just tests that the API responds
    const { error } = await anonClient.auth.getSession();
    if (error) {
      failCount += fail("Supabase anon API", error.message);
    } else {
      ok("Supabase anon API reachable", SUPABASE_URL);
    }
  } catch (err) {
    failCount += fail("Supabase anon API", String(err));
  }

  // ── 3. Admin API (service role) ─────────────────────────────────────────────
  section("3 · Admin API + admin user (service role key)");

  let adminClient: ReturnType<typeof createClient> | null = null;

  if (SERVICE_ROLE_KEY) {
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const { data: usersPage, error: listErr } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (listErr) {
        failCount += fail("Admin API (service role key)", listErr.message);
      } else {
        ok("Admin API reachable", `${usersPage.total} total users in project`);
      }
    } catch (err) {
      failCount += fail("Admin API", String(err));
    }

    if (ADMIN_EMAIL) {
      try {
        const { data: all } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const adminUser = all?.users?.find((u) => u.email === ADMIN_EMAIL);
        if (adminUser) {
          ok("Admin user exists", `confirmed=${!!adminUser.email_confirmed_at}  lastLogin=${adminUser.last_sign_in_at ?? "never"}`);
          if (!adminUser.email_confirmed_at) {
            warn("Email not confirmed → password login will fail");
          }
        } else {
          warn("Admin user not in Supabase yet", "Will be auto-created on first Google login");
        }
      } catch (err) {
        failCount += fail("Admin user lookup", String(err));
      }
    }
  } else {
    warn("Skipped — no SUPABASE_SERVICE_ROLE_KEY provided");
  }

  // ── 4. Password auth end-to-end ─────────────────────────────────────────────
  section("4 · Password auth end-to-end (create → login → verify → delete)");

  if (adminClient) {
    const testEmail = `__test_${Date.now()}@diag.internal`;
    const testPwd = `Test_${Math.random().toString(36).slice(2, 10)}!Az`;
    let createdUserId: string | null = null;

    try {
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPwd,
        email_confirm: true,
      });

      if (createErr) {
        failCount += fail("admin.createUser()", createErr.message);
      } else {
        createdUserId = created.user.id;
        ok("admin.createUser()", `uid=${created.user.id.slice(0, 8)}…`);

        // Sign in via anon client (same as login form)
        const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
          email: testEmail,
          password: testPwd,
        });

        if (signInErr) {
          failCount += fail("signInWithPassword()", signInErr.message);
        } else {
          ok("signInWithPassword()", `token=${signInData.session?.access_token.slice(0, 20)}…`);

          // Verify token
          const verifyClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          await verifyClient.auth.setSession({
            access_token: signInData.session!.access_token,
            refresh_token: signInData.session!.refresh_token,
          });
          const { data: { user: verifiedUser }, error: verifyErr } = await verifyClient.auth.getUser();
          if (verifyErr || !verifiedUser) {
            failCount += fail("Token → getUser()", verifyErr?.message ?? "no user returned");
          } else {
            ok("Token verified via getUser()", `email=${verifiedUser.email}`);
          }
        }
      }
    } catch (err) {
      failCount += fail("Password auth test", String(err));
    } finally {
      if (createdUserId) {
        await adminClient.auth.admin.deleteUser(createdUserId).catch(() => {});
        ok("Cleanup: test user deleted");
      }
    }
  } else {
    warn("Skipped — no service role key");
  }

  // ── 5. Google OAuth PKCE URL check ──────────────────────────────────────────
  section("5 · Google OAuth PKCE configuration");

  try {
    const pkceClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await pkceClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      failCount += fail("signInWithOAuth (Google, PKCE)", error.message);
    } else {
      const oauthUrl = data?.url ?? "";
      const parsed = new URL(oauthUrl);
      const hasCodeChallenge = oauthUrl.includes("code_challenge");
      const hasS256 = oauthUrl.includes("code_challenge_method=S256");

      ok("signInWithOAuth generated URL");
      console.log(`     ${oauthUrl.slice(0, 100)}…`);

      hasCodeChallenge
        ? ok("PKCE code_challenge present → Supabase will return ?code= to callback")
        : (failCount += fail("code_challenge MISSING", "Supabase will return #access_token= instead of ?code="));

      hasS256 ? ok("code_challenge_method=S256") : warn("S256 not visible in URL");

      const redirectTo = parsed.searchParams.get("redirect_to") ?? "";
      if (redirectTo) {
        console.log(`\n  redirect_to in URL: ${redirectTo}`);
        if (redirectTo === `${APP_URL}/auth/callback`) {
          ok("redirect_to matches expected callback URL");
        } else {
          warn(`redirect_to mismatch`, `got ${redirectTo}, expected ${APP_URL}/auth/callback`);
        }
      }

      console.log(`\n  Required Supabase config:`);
      console.log(`    Dashboard → Auth → URL Configuration`);
      console.log(`    Site URL:      ${APP_URL}`);
      console.log(`    Redirect URLs: ${APP_URL}/auth/callback`);
    }
  } catch (err) {
    failCount += fail("OAuth URL generation", String(err));
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  section("Summary");

  if (failCount === 0) {
    console.log(`${PASS} All checks passed — auth chain is correctly configured.\n`);
  } else {
    console.error(`${FAIL} ${failCount} check(s) failed — see above.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
