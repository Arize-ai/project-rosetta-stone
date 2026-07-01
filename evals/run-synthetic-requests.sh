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

# Generate a random eval secret for this run and export it so both the
# Next.js server process and the eval script inherit the same value.
export EVAL_SECRET
EVAL_SECRET="$(openssl rand -hex 16)"

# ---------------------------------------------------------------------------
# Start Next.js if not already running
# ---------------------------------------------------------------------------

NEXT_PID=""

if curl -sf -o /dev/null "$BASE_URL/" 2>/dev/null; then
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
