#!/usr/bin/env node
/**
 * netlify-watch.mjs — Real-time Netlify deploy monitor
 * Usage: node scripts/netlify-watch.mjs [deploy_id]
 *
 * Polls Netlify API every 5s, prints live status, exits 0 on success / 1 on fail
 */

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID       = process.env.NETLIFY_SITE_ID;
const DEPLOY_ID     = process.argv[2]; // optional — watches latest if omitted

if (!NETLIFY_TOKEN || !SITE_ID) {
  console.error("❌ Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID env vars");
  process.exit(1);
}

const BASE = "https://api.netlify.com/api/v1";

async function netlify(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
  });
  if (!r.ok) throw new Error(`Netlify API ${r.status}: ${await r.text()}`);
  return r.json();
}

function bar(pct, width = 30) {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

const STATUS_EMOJI = {
  building:   "🔨",
  enqueued:   "⏳",
  processing: "⚙️ ",
  uploading:  "📤",
  ready:      "✅",
  error:      "❌",
  cancelled:  "🚫",
};

async function getDeployId() {
  if (DEPLOY_ID) return DEPLOY_ID;
  const deploys = await netlify(`/sites/${SITE_ID}/deploys?per_page=1`);
  if (!deploys.length) throw new Error("No deploys found");
  return deploys[0].id;
}

async function watch() {
  const deployId = await getDeployId();
  console.log(`\n🔭 Watching deploy: ${deployId}`);
  console.log("─".repeat(60));

  let lastStatus = "";
  let dots = 0;

  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise(r => setTimeout(r, 5000));

    let deploy;
    try {
      deploy = await netlify(`/deploys/${deployId}`);
    } catch (e) {
      console.warn("  ⚠️  API error, retrying...", e.message);
      continue;
    }

    const { state, error_message, deploy_url, published_at, created_at } = deploy;
    const emoji = STATUS_EMOJI[state] ?? "🔄";

    // Estimate progress
    const elapsed = published_at
      ? (new Date(published_at) - new Date(created_at)) / 1000
      : (Date.now() - new Date(created_at)) / 1000;
    const pct = Math.min(Math.round((elapsed / 180) * 100), 99);

    if (state !== lastStatus) {
      process.stdout.write("\n");
      console.log(`${emoji} Status: ${state.toUpperCase()}`);
      lastStatus = state;
    }

    // Progress bar for active states
    if (!["ready", "error", "cancelled"].includes(state)) {
      process.stdout.write(`\r  [${bar(pct)}] ${pct}%  ${".".repeat(dots % 4)}   `);
      dots++;
    }

    if (state === "ready") {
      console.log(`\n\n✅ Deploy live!`);
      console.log(`   URL: ${deploy_url}`);
      console.log(`   Time: ${Math.round(elapsed)}s`);
      process.exit(0);
    }

    if (state === "error") {
      console.log(`\n\n❌ Deploy failed!`);
      if (error_message) console.log(`   Error: ${error_message}`);
      // Fetch build log summary
      try {
        const site = await netlify(`/sites/${SITE_ID}`);
        console.log(`\n📋 Site: ${site.name} (${site.url})`);
      } catch {}
      process.exit(1);
    }

    if (state === "cancelled") {
      console.log("\n\n🚫 Deploy cancelled");
      process.exit(1);
    }
  }

  console.log("\n\n⏱️  Timeout — deploy took too long (10 min)");
  process.exit(1);
}

watch().catch(e => {
  console.error("💥 Watcher crashed:", e);
  process.exit(1);
});
