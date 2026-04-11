/**
 * Auth chain integration test
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   DATABASE_URL=postgres://... \
 *   ADMIN_EMAIL=kfir.biz@gmail.com \
 *   npx tsx src/scripts/test-auth-chain.ts
 *
 * Or create .env.local with those values and just run:
 *   npx tsx src/scripts/test-auth-chain.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.weddingpro.co.il";

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

let failCount = 0;

function ok(label: string, detail?: string) {
  console.log(`${PASS} ${label}${detail ? `  →  ${detail}` : ""}`);
}
function fail(label: string, detail?: string) {
  failCount++;
  console.error(`${FAIL} ${label}${detail ? `  →  ${detail}` : ""}`);
}
function warn(label: string, detail?: string) {
  console.warn(`${WARN}${label}${detail ? `  →  ${detail}` : ""}`);
}
function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ─────────────────────────────────────────────────────────────────────────────

section("1 · Env vars");

SUPABASE_URL    ? ok("NEXT_PUBLIC_SUPABASE_URL",    SUPABASE_URL)   : fail("NEXT_PUBLIC_SUPABASE_URL missing");
SUPABASE_ANON_KEY ? ok("NEXT_PUBLIC_SUPABASE_ANON_KEY", "(set)")    : fail("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
SERVICE_ROLE_KEY  ? ok("SUPABASE_SERVICE_ROLE_KEY",     "(set)")    : fail("SUPABASE_SERVICE_ROLE_KEY missing");
ADMIN_EMAIL       ? ok("ADMIN_EMAIL",                   ADMIN_EMAIL): warn("ADMIN_EMAIL not set");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("\nCannot continue without Supabase credentials.\n");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────────────────────

section("2 · Supabase admin API");

const { data: usersPage, error: listErr } = await adminClient.auth.admin.listUsers({
  page: 1,
  perPage: 1,
});
if (listErr) {
  fail("Admin API (service role key)", listErr.message);
} else {
  ok("Admin API reachable", `${usersPage.total} total users in project`);
}

// ─────────────────────────────────────────────────────────────────────────────

section("3 · Admin user");

if (ADMIN_EMAIL) {
  const { data: allUsers } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const adminUser = allUsers?.users?.find((u) => u.email === ADMIN_EMAIL);
  if (adminUser) {
    ok("Admin user exists", `id=${adminUser.id.slice(0, 8)}… confirmed=${!!adminUser.email_confirmed_at} lastLogin=${adminUser.last_sign_in_at ?? "never"}`);
    if (!adminUser.email_confirmed_at) {
      warn("Admin email not confirmed — password login will fail with 'Email not confirmed'");
    }
  } else {
    warn("Admin user not in Supabase yet", "Will be auto-created on first Google login");
  }
} else {
  warn("Skipped (ADMIN_EMAIL not set)");
}

// ─────────────────────────────────────────────────────────────────────────────

section("4 · Password auth (end-to-end)");

const testEmail = `__test_${Date.now()}@diag.internal`;
const testPwd = `Test_${Math.random().toString(36).slice(2, 10)}!Az`;

// 4a. Create user via admin API (simulates /api/register-free)
const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
  email: testEmail,
  password: testPwd,
  email_confirm: true,
});

if (createErr) {
  fail("admin.createUser()", createErr.message);
} else {
  ok("admin.createUser()", `uid=${createdUser.user.id.slice(0, 8)}…`);

  // 4b. Sign in with password via anon client (simulates the login form)
  const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPwd,
  });

  if (signInErr) {
    fail("signInWithPassword()", signInErr.message);
  } else {
    ok("signInWithPassword()", `access_token=${signInData.session?.access_token.slice(0, 20)}…`);

    // 4c. Verify the token works (simulates the SSR getUser call)
    const verifyClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        // Manually inject the session
      },
    });
    await verifyClient.auth.setSession({
      access_token: signInData.session!.access_token,
      refresh_token: signInData.session!.refresh_token,
    });
    const { data: { user: verifiedUser }, error: verifyErr } = await verifyClient.auth.getUser();

    if (verifyErr || !verifiedUser) {
      fail("getUser() with token", verifyErr?.message ?? "no user returned");
    } else {
      ok("Token → getUser() verified", `email=${verifiedUser.email}`);
    }
  }

  // Cleanup
  await adminClient.auth.admin.deleteUser(createdUser.user.id).catch(() => {});
  ok("Cleanup: test user deleted");
}

// ─────────────────────────────────────────────────────────────────────────────

section("5 · Google OAuth PKCE configuration");

// We can't test the full browser OAuth redirect, but we can verify the
// auth settings are correct by checking what Supabase returns for an OAuth URL.
try {
  // Use a raw browser-like client (localStorage, PKCE)
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
      skipBrowserRedirect: true, // Don't actually redirect — just get the URL
    },
  });

  if (error) {
    fail("signInWithOAuth (Google, PKCE)", error.message);
  } else {
    const oauthUrl = data?.url ?? "";
    const hasCodeChallenge = oauthUrl.includes("code_challenge");
    const hasCodeMethod = oauthUrl.includes("code_challenge_method=S256");
    const redirectToParam = new URL(oauthUrl).searchParams.get("redirect_to") ?? new URL(oauthUrl).searchParams.get("redirectTo") ?? "";

    ok("signInWithOAuth generated URL", oauthUrl.slice(0, 80) + "…");

    hasCodeChallenge
      ? ok("PKCE code_challenge present → Supabase will return ?code= to callback")
      : fail("code_challenge MISSING → Supabase will use implicit flow (#access_token=)");

    hasCodeMethod
      ? ok("code_challenge_method=S256")
      : warn("code_challenge_method not found in URL");

    console.log(`\n  redirectTo in OAuth URL: ${redirectToParam || "(built into Supabase URL path)"}`);
    console.log(`  Expected callback:       ${APP_URL}/auth/callback`);
    console.log(`\n  ⚠️  Make sure this URL is in Supabase → Auth → URL Configuration → Redirect URLs:`);
    console.log(`       ${APP_URL}/auth/callback`);
    console.log(`  ⚠️  And Site URL is set to: ${APP_URL}`);
  }
} catch (err) {
  fail("signInWithOAuth check", String(err));
}

// ─────────────────────────────────────────────────────────────────────────────

section("Summary");

if (failCount === 0) {
  console.log(`${PASS} All checks passed — auth chain is correctly configured.`);
  console.log(`\n  The only thing that cannot be tested programmatically is:`);
  console.log(`  → Google's actual redirect back to your callback URL`);
  console.log(`  → Make sure ${APP_URL}/auth/callback is in Supabase Redirect URLs`);
} else {
  console.error(`${FAIL} ${failCount} check(s) failed — see above for details.`);
  process.exit(1);
}
