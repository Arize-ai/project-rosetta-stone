#!/usr/bin/env bash
set -e

# Usage: run-synthetic-requests.sh <project-dir>
#   project-dir — path to the Next.js project (e.g. ../mastra or ../vercel-ai-sdk)

if [ -z "$1" ]; then
  echo "Usage: $0 <project-dir>"
  exit 1
fi

APP_DIR="$(cd "$1" && pwd)"
BASE_URL="${EVAL_BASE_URL:-http://localhost:3000}"

# Read EVAL_SECRET from a dotenv file without printing or sourcing it.
# Last matching assignment wins (same as typical dotenv overlay).
_eval_secret_from_file() {
  local file="$1"
  [ -f "$file" ] || return 0
  local line value
  line="$(grep -E '^[[:space:]]*EVAL_SECRET=' "$file" | tail -1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  EVAL_SECRET="$value"
}

# Reuse a secret the already-running Next.js process would have loaded from
# .env / .env.local. Minting a fresh one here is only safe when *this* script
# starts the server (the child inherits EVAL_SECRET). If Next.js is already
# up with a different/empty secret, the chat route ignores x-eval-user-id
# and tags every trace as userId=anonymous.
if [ -z "$EVAL_SECRET" ]; then
  _eval_secret_from_file "$APP_DIR/.env"
  _eval_secret_from_file "$APP_DIR/.env.local"
fi

# ---------------------------------------------------------------------------
# Start Next.js if not already running
# ---------------------------------------------------------------------------

NEXT_PID=""
SERVER_ALREADY_RUNNING=false

if curl -sf -o /dev/null "$BASE_URL/" 2>/dev/null; then
  SERVER_ALREADY_RUNNING=true
  echo "✓ Server already running at $BASE_URL"
else
  echo "Starting Next.js dev server..."
  cd "$APP_DIR"
  npm run dev > /tmp/nextjs-evals.log 2>&1 &
  NEXT_PID=$!

  # Kill Next.js when this script exits (success or failure)
  trap "echo 'Stopping Next.js (PID $NEXT_PID)...'; kill $NEXT_PID 2>/dev/null; wait $NEXT_PID 2>/dev/null" EXIT

  echo "  Waiting for server to be ready..."
  for i in $(seq 1 60); do
    if curl -sf -o /dev/null "$BASE_URL/" 2>/dev/null; then
      echo "✓ Server ready after ${i}s"
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "✗ Server failed to start after 60s"
      cat /tmp/nextjs-evals.log
      exit 1
    fi
    sleep 1
  done
fi

if [ -z "$EVAL_SECRET" ]; then
  if [ "$SERVER_ALREADY_RUNNING" = true ]; then
    echo "✗ EVAL_SECRET is not set, but the server at $BASE_URL is already running."
    echo "  The chat route will ignore x-eval-user-id and tag traces as userId=anonymous."
    echo "  Add EVAL_SECRET to $APP_DIR/.env.local, restart Next.js, and re-run."
    echo "  Or stop the server so this script can start it with a generated secret."
    exit 1
  fi
  EVAL_SECRET="$(openssl rand -hex 16)"
fi
export EVAL_SECRET

# ---------------------------------------------------------------------------
# Run the eval harness
# ---------------------------------------------------------------------------

EVALS_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
cd "$APP_DIR"
node --env-file-if-exists=.env --env-file-if-exists=.env.local ./node_modules/.bin/tsx "$EVALS_DIR/synthetic-requests.ts"

echo ""
echo "Waiting 20s for traces to sync..."
sleep 20
