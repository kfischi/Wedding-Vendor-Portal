#!/usr/bin/env bash
# ─── WeddingPro Self-Healing Deploy Script ────────────────────────────────────
# Builds → Deploys → Watches → Auto-heals → Re-deploys
#
# Usage: ./scripts/deploy-and-heal.sh [--prod]
#
# Requires env vars:
#   NETLIFY_AUTH_TOKEN  — from Netlify user settings
#   NETLIFY_SITE_ID     — from Site settings → General → Site ID
#   ANTHROPIC_API_KEY   — for Claude self-healing
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROD_FLAG=${1:-""}
MAX_HEAL_ATTEMPTS=3
PROJECT="wedding-portal"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

log()   { echo -e "${BOLD}${BLUE}[$(date +%H:%M:%S)]${RESET} $*"; }
ok()    { echo -e "${GREEN}✅ $*${RESET}"; }
warn()  { echo -e "${YELLOW}⚠️  $*${RESET}"; }
error() { echo -e "${RED}❌ $*${RESET}"; }
die()   { error "$*"; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
[ -z "${NETLIFY_AUTH_TOKEN:-}" ] && die "NETLIFY_AUTH_TOKEN not set"
[ -z "${NETLIFY_SITE_ID:-}"    ] && die "NETLIFY_SITE_ID not set"
[ -z "${ANTHROPIC_API_KEY:-}"  ] && die "ANTHROPIC_API_KEY not set"

command -v pnpm        >/dev/null || die "pnpm not installed"
command -v netlify     >/dev/null || die "netlify-cli not installed (npm i -g netlify-cli)"
command -v node        >/dev/null || die "node not installed"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}   🤖 WeddingPro Self-Healing Deploy${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

attempt=0

try_build_and_deploy() {
  local attempt=$1
  local errors_file="/tmp/build-errors-${attempt}.txt"

  log "Attempt $attempt — Installing dependencies..."
  cd "$PROJECT"
  pnpm install --frozen-lockfile 2>&1 | tail -5

  log "Type checking..."
  if ! npx tsc --noEmit > "$errors_file" 2>&1; then
    warn "TypeScript errors found"
    cat "$errors_file"
    return 1
  fi
  ok "TypeScript clean"

  log "Building..."
  if ! pnpm build >> "$errors_file" 2>&1; then
    warn "Build failed"
    tail -50 "$errors_file"
    return 2
  fi
  ok "Build successful"

  log "Deploying to Netlify..."
  if [ "$PROD_FLAG" = "--prod" ]; then
    DEPLOY_OUTPUT=$(netlify deploy --dir=.next --prod --json 2>&1)
  else
    DEPLOY_OUTPUT=$(netlify deploy --dir=.next --json 2>&1)
  fi

  echo "$DEPLOY_OUTPUT" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  print('Deploy URL:', d.get('deploy_url', d.get('url', 'N/A')))
  print('Deploy ID:', d.get('deploy_id', 'N/A'))
  open('/tmp/deploy_id', 'w').write(d.get('deploy_id',''))
except: print('Raw output:', sys.stdin.read()[:500])
" 2>/dev/null || true

  DEPLOY_ID=$(cat /tmp/deploy_id 2>/dev/null || echo "")

  cd ..
  return 0
}

auto_heal() {
  local errors_file=$1
  log "🔧 Calling Claude to auto-heal..."
  node scripts/claude-fixer.mjs "$errors_file" "$PROJECT"
  local fix_exit=$?

  if [ $fix_exit -eq 0 ]; then
    ok "Claude applied fixes"
    git add -A
    git diff --staged --quiet || git commit -m "fix: auto-heal build errors (attempt $attempt)"
    git push origin HEAD
  else
    error "Claude could not fix all errors"
    return 1
  fi
}

# ── Main loop ─────────────────────────────────────────────────────────────────
for attempt in $(seq 1 $MAX_HEAL_ATTEMPTS); do
  log "Deploy attempt $attempt / $MAX_HEAL_ATTEMPTS"

  errors_file="/tmp/build-errors-${attempt}.txt"

  if try_build_and_deploy $attempt; then
    ok "Deploy triggered! Watching status..."

    # Watch Netlify deploy in real-time
    if [ -n "${DEPLOY_ID:-}" ]; then
      node scripts/netlify-watch.mjs "$DEPLOY_ID" && break
    else
      node scripts/netlify-watch.mjs && break
    fi

    WATCH_EXIT=$?
    if [ $WATCH_EXIT -eq 0 ]; then
      break
    else
      error "Deploy failed at Netlify level"
      cat "$errors_file" 2>/dev/null || true
    fi
  fi

  if [ $attempt -lt $MAX_HEAL_ATTEMPTS ]; then
    warn "Healing before attempt $((attempt+1))..."
    auto_heal "$errors_file" || die "Auto-heal failed — manual intervention required"
  else
    die "All $MAX_HEAL_ATTEMPTS attempts failed. Check logs above."
  fi
done

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
ok "Pipeline complete — WeddingPro is LIVE 🎉"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
