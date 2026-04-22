/**
 * בדיקה ותיקון של הגדרות Supabase דרך Management API
 *
 * הרצה רגילה (בדיקה בלבד):
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npx tsx src/scripts/check-supabase-config.ts
 *
 * הרצה עם תיקון אוטומטי של Redirect URLs:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npx tsx src/scripts/check-supabase-config.ts --fix
 *
 * את הטוקן תמצא ב: https://supabase.com/dashboard/account/tokens
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PROJECT_REF = "ulfwxmjerugxayuyliug";
const MGMT_API = "https://api.supabase.com";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN ?? "";
const APP_URL = "https://www.weddingpro.co.il";
const EXPECTED_CALLBACK = `${APP_URL}/auth/callback`;
const EXPECTED_CLIENT_ID =
  "479115807614-46g2a7sm2lm5apmuns45jlml41p95jrn.apps.googleusercontent.com";

function pass(msg: string) { console.log(`✅ ${msg}`); }
function fail(msg: string) { console.error(`❌ ${msg}`); }
function warn(msg: string) { console.warn(`⚠️  ${msg}`); }
function hr(title?: string) {
  console.log("\n" + "─".repeat(60));
  if (title) { console.log(`  ${title}`); console.log("─".repeat(60)); }
}

type AuthConfig = Record<string, unknown>;

async function getConfig(headers: Record<string, string>): Promise<AuthConfig> {
  const res = await fetch(`${MGMT_API}/v1/projects/${PROJECT_REF}/config/auth`, { headers });
  if (!res.ok) {
    fail(`Management API שגיאה: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }
  return res.json();
}

async function check(cfg: AuthConfig): Promise<string[]> {
  const problems: string[] = [];

  // ── URL Configuration ──────────────────────────────────────────────────
  hr("הגדרות URL");

  const siteUrl = String(cfg.site_url ?? "").replace(/\/$/, "");
  console.log(`Site URL:      ${siteUrl || "(ריק)"}`);
  if (siteUrl === APP_URL) {
    pass("Site URL תקין");
  } else {
    fail(`Site URL שגוי — נוכחי: "${siteUrl}", נדרש: "${APP_URL}"`);
    problems.push("Site URL שגוי");
  }

  const redirectRaw = String(cfg.uri_allow_list ?? "");
  const redirectList = redirectRaw.split(",").map((u) => u.trim()).filter(Boolean);
  console.log(`\nRedirect URLs: ${redirectList.length ? redirectList.join(", ") : "(ריק)"}`);
  if (redirectList.includes(EXPECTED_CALLBACK)) {
    pass(`${EXPECTED_CALLBACK} קיים`);
  } else {
    fail(`חסר: ${EXPECTED_CALLBACK}`);
    problems.push("Redirect URL חסר");
  }

  // ── Google OAuth ────────────────────────────────────────────────────────
  hr("Google OAuth");

  const googleEnabled = Boolean(cfg.external_google_enabled);
  googleEnabled ? pass("Google OAuth מופעל") : fail("Google OAuth כבוי");
  if (!googleEnabled) problems.push("Google OAuth כבוי");

  const googleClientId = String(cfg.external_google_client_id ?? "");
  if (googleClientId) {
    if (googleClientId === EXPECTED_CLIENT_ID) {
      pass(`Client ID תקין: ${googleClientId.slice(0, 30)}…`);
    } else {
      warn(
        `Client ID שונה מהצפוי:\n   יש:   ${googleClientId}\n   צפוי: ${EXPECTED_CLIENT_ID}`
      );
      problems.push("Google Client ID לא תואם");
    }
  } else {
    fail("Google Client ID חסר ב-Supabase");
    problems.push("Google Client ID חסר");
  }

  // ── Email / Signup ──────────────────────────────────────────────────────
  hr("הרשמה ואימות");

  if (cfg.disable_signup) {
    fail("הרשמה חדשה מושבתת — לא ניתן ליצור משתמשים");
    problems.push("הרשמה מושבתת");
  } else {
    pass("הרשמה חדשה מופעלת");
  }

  cfg.external_email_enabled
    ? pass("Email/Password Auth מופעל")
    : warn("Email/Password Auth כבוי");

  return problems;
}

async function fixRedirectUrl(
  headers: Record<string, string>,
  cfg: AuthConfig
): Promise<void> {
  console.log("\n🔧 מוסיף Redirect URL אוטומטית...");
  const redirectRaw = String(cfg.uri_allow_list ?? "");
  const list = redirectRaw.split(",").map((u) => u.trim()).filter(Boolean);

  if (list.includes(EXPECTED_CALLBACK)) {
    pass("Redirect URL כבר קיים — אין צורך בתיקון");
    return;
  }

  list.push(EXPECTED_CALLBACK);
  const res = await fetch(`${MGMT_API}/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ uri_allow_list: list.join(",") }),
  });

  if (res.ok) {
    pass(`נוסף בהצלחה: ${EXPECTED_CALLBACK}`);
  } else {
    fail(`שגיאה בעדכון: ${res.status}`);
    console.error(await res.text());
  }
}

async function run() {
  if (!ACCESS_TOKEN) {
    fail("SUPABASE_ACCESS_TOKEN חסר");
    console.error("   צור טוקן ב: https://supabase.com/dashboard/account/tokens");
    process.exit(1);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  console.log("🔍 שולף הגדרות Auth מ-Supabase Management API...");
  const cfg = await getConfig(headers);

  if (process.argv.includes("--fix")) {
    await fixRedirectUrl(headers, cfg);
    // Re-fetch after fix
    const updated = await getConfig(headers);
    const problems = await check(updated);
    hr();
    console.log("═".repeat(60));
    problems.length === 0
      ? pass("כל ההגדרות תקינות אחרי התיקון")
      : fail(`נותרו ${problems.length} בעיות: ${problems.join(", ")}`);
    console.log("═".repeat(60) + "\n");
    if (problems.length > 0) process.exit(1);
    return;
  }

  const problems = await check(cfg);

  hr();
  console.log("═".repeat(60));
  if (problems.length === 0) {
    pass("כל ההגדרות תקינות — Google OAuth אמור לעבוד ✓");
  } else {
    fail(`${problems.length} בעיה/ות נמצאו:`);
    problems.forEach((p) => console.log(`   • ${p}`));
    if (problems.includes("Redirect URL חסר")) {
      console.log(`\n   הרץ עם --fix כדי להוסיף אוטומטית את ה-Redirect URL`);
    }
  }
  console.log("═".repeat(60) + "\n");
  if (problems.length > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
