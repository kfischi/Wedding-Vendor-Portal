#!/usr/bin/env bash
# Claude Code pre-commit quality hook
# Called by PreToolUse on Bash when command contains "git commit"
# Reads JSON from stdin, outputs JSON with systemMessage

set -euo pipefail

CMD=$(jq -r '.tool_input.command // ""' 2>/dev/null)

# Only act on git commit commands
if ! echo "$CMD" | grep -qE "git (commit|push)"; then
  exit 0
fi

PROJECT="/home/user/Wedding-Vendor-Portal/wedding-portal"
cd "$PROJECT"

MSGS=()

# 1. ESLint auto-fix
if pnpm lint --fix > /tmp/lint-out.txt 2>&1; then
  MSGS+=("✅ ESLint: clean")
else
  COUNT=$(grep -c "error\|warning" /tmp/lint-out.txt 2>/dev/null || echo "?")
  MSGS+=("⚠️  ESLint: $COUNT issues (auto-fixed what was possible)")
fi

# 2. TypeScript check (warn only — do not block pre-existing errors)
TSC_OUT=$(npx tsc --noEmit 2>&1 || true)
TSC_COUNT=$(echo "$TSC_OUT" | grep -c "error TS" || echo 0)

if [ "$TSC_COUNT" -eq 0 ]; then
  MSGS+=("✅ TypeScript: no errors")
else
  MSGS+=("⚠️  TypeScript: $TSC_COUNT error(s)")
  # Append first 3 errors for context
  FIRST_ERRORS=$(echo "$TSC_OUT" | grep "error TS" | head -3 | sed 's/"/\\"/g' | tr '\n' '|' | sed 's/|/\\n/g')
  MSGS+=("$FIRST_ERRORS")
fi

# Output as Claude Code systemMessage
MSG=$(printf '%s\n' "${MSGS[@]}" | paste -sd '\\n' -)
printf '{"systemMessage": "🔍 Pre-commit check:\\n%s"}' "$MSG"
