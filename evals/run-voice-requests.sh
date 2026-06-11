#!/usr/bin/env bash
set -e

# Usage: run-voice-requests.sh <project-dir>
#   project-dir — path to one of the openai-voice tier directories
#                 (e.g. ../phoenix/openai-voice)

if [ -z "$1" ]; then
  echo "Usage: $0 <project-dir>"
  exit 1
fi

APP_DIR="$(cd "$1" && pwd)"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVALS_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$REPO_ROOT/.venv"
BASE_URL="${EVAL_BASE_URL:-http://localhost:3000}"
BACKEND_URL_FALLBACK="${BACKEND_URL:-http://localhost:8001}"

# ---------------------------------------------------------------------------
# Load env from .env.local — we need BACKEND_SECRET, OPENAI_API_KEY, plus
# observability creds. Mirror run-synthetic-requests.sh: source the file
# into the script's env without printing values.
# ---------------------------------------------------------------------------

if [ -f "$APP_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env.local"
  set +a
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "✗ OPENAI_API_KEY is not set (looked in $APP_DIR/.env.local)"
  exit 1
fi

# ---------------------------------------------------------------------------
# Make sure pydub + websockets are installed (they're not part of the
# backend itself — they're only needed by these eval scripts).
# ---------------------------------------------------------------------------

if [ ! -d "$VENV_DIR" ]; then
  echo "✗ Shared venv not found at $VENV_DIR — run `npm run dev` once first to create it"
  exit 1
fi
source "$VENV_DIR/bin/activate"
uv pip install -q -r "$EVALS_DIR/requirements.txt"

# ---------------------------------------------------------------------------
# Make sure the prompt MP3s exist
# ---------------------------------------------------------------------------

if [ ! -d "$EVALS_DIR/voice-prompts" ] || \
   [ "$(ls -1 "$EVALS_DIR/voice-prompts"/*.mp3 2>/dev/null | wc -l)" -eq 0 ]; then
  echo "Generating voice prompts via OpenAI TTS..."
  python "$EVALS_DIR/generate-voice-prompts.py"
fi

# ---------------------------------------------------------------------------
# Start the dev server (ChromaDB + Python backend + Next.js) if not running
# ---------------------------------------------------------------------------

NEXT_PID=""
cleanup() {
  if [ -n "$NEXT_PID" ]; then
    echo ""
    echo "Stopping dev server (PID $NEXT_PID)..."
    kill "$NEXT_PID" 2>/dev/null || true
    wait "$NEXT_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# We probe the backend (port 8001), not Next.js, because the WS endpoint
# lives there. If Next.js is up but the backend died, npm run dev brings
# it back; if the backend is already up we leave everything alone.
if curl -sf -o /dev/null "$BACKEND_URL_FALLBACK/products/featured" 2>/dev/null; then
  echo "✓ Backend already running at $BACKEND_URL_FALLBACK"
else
  echo "Starting dev server (ChromaDB + Python backend + Next.js)..."
  cd "$APP_DIR"
  npm run dev > /tmp/openai-voice-evals.log 2>&1 &
  NEXT_PID=$!

  echo "  Waiting for backend to be ready..."
  for i in $(seq 1 90); do
    if curl -sf -o /dev/null "$BACKEND_URL_FALLBACK/products/featured" 2>/dev/null; then
      echo "✓ Backend ready after ${i}s"
      break
    fi
    if [ "$i" -eq 90 ]; then
      echo "✗ Backend failed to start after 90s"
      tail -40 /tmp/openai-voice-evals.log
      exit 1
    fi
    sleep 1
  done
fi

# ---------------------------------------------------------------------------
# Run the voice harness
# ---------------------------------------------------------------------------

echo ""
BACKEND_URL="$BACKEND_URL_FALLBACK" \
  PYTHONUNBUFFERED=1 \
  python -u "$EVALS_DIR/run-voice-requests.py"

echo ""
echo "Waiting 20s for traces to sync to Phoenix / Arize AX..."
sleep 20
echo "✓ Done"
