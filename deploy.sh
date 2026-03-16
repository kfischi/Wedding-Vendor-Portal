#!/usr/bin/env bash
# ─── WeddingPro — Netlify Deploy Script ──────────────────────────────────────
# Run this from your LOCAL machine (not the server)
# Requirements: node, pnpm, netlify-cli
#
#   chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

SITE_NAME="wedding-vendor-portal"
ENV_FILE="wedding-portal/.env.production"

echo "🚀 WeddingPro — Netlify Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check dependencies
command -v netlify >/dev/null 2>&1 || { echo "❌ netlify-cli not found. Run: npm install -g netlify-cli"; exit 1; }
command -v pnpm    >/dev/null 2>&1 || { echo "❌ pnpm not found. Run: npm install -g pnpm"; exit 1; }

# 2. Login check
echo "🔐 Checking Netlify auth..."
netlify status >/dev/null 2>&1 || netlify login

# 3. Create or link site
echo "🌐 Linking site..."
if ! netlify status 2>&1 | grep -q "Current site"; then
  netlify sites:create --name "$SITE_NAME" --disable-linking || true
fi

# 4. Push environment variables
echo "📦 Setting environment variables..."
if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    # skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]]       && continue
    KEY="${line%%=*}"
    VAL="${line#*=}"
    [[ -z "$VAL" ]] && continue   # skip empty values
    netlify env:set "$KEY" "$VAL" --context production 2>/dev/null || true
  done < "$ENV_FILE"
  echo "✅ Environment variables set"
else
  echo "⚠️  $ENV_FILE not found — skipping env vars"
fi

# 5. Build & deploy
echo "🔨 Building and deploying..."
cd wedding-portal
netlify deploy --build --prod

echo ""
echo "✅ Deploy complete!"
echo "🌍 Site: https://portal.suite-hagit.co.il"
