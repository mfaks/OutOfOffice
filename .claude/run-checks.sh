#!/usr/bin/env bash
# Run frontend and backend linters/checks after each Claude session

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
REPORT=""

run_check() {
  local label="$1"
  local dir="$2"
  shift 2
  if (cd "$dir" && "$@" >/dev/null 2>&1); then
    REPORT="$REPORT\n  PASS  $label"
    PASS=$((PASS + 1))
  else
    REPORT="$REPORT\n  FAIL  $label"
    FAIL=$((FAIL + 1))
  fi
}

run_check "frontend: npm run lint"          "$PROJECT/frontend"  npm run lint
run_check "frontend: npm run format:check"  "$PROJECT/frontend"  npm run format:check
run_check "frontend: npm run build"         "$PROJECT/frontend"  npm run build
run_check "backend:  black --check"         "$PROJECT/backend"   python -m black . --check
run_check "backend:  ruff check"            "$PROJECT/backend"   python -m ruff check .
run_check "backend:  compileall"            "$PROJECT/backend"   python -m compileall .

if [ "$FAIL" -eq 0 ]; then
  SUMMARY="Session checks: all $PASS passed"
else
  SUMMARY="Session checks: $FAIL failed, $PASS passed"
fi

printf '{"systemMessage": "%s\\n%b"}' "$SUMMARY" "$REPORT"
