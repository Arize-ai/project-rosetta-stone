#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROMA_URL="${CHROMA_URL:-http://localhost:8000}"
CHROMA_DATA="$REPO_ROOT/chroma-data"
VENV_DIR="$REPO_ROOT/.venv"
BACKEND_PORT="${BACKEND_PORT:-8001}"
NEXT_PORT="${NEXT_PORT:-3000}"

# PIDs to clean up on exit
PIDS_TO_KILL=()

cleanup() {
  echo ""
  echo "Shutting down..."
  for pid in "${PIDS_TO_KILL[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait "${PIDS_TO_KILL[@]}" 2>/dev/null || true
}
trap cleanup EXIT

# --- ChromaDB Setup ---

if curl -sf "$CHROMA_URL/api/v2/heartbeat" > /dev/null 2>&1; then
  echo "✓ ChromaDB already running at $CHROMA_URL"
else
  echo "Starting ChromaDB..."

  # Create venv if needed
  if [ ! -d "$VENV_DIR" ]; then
    echo "  Creating Python venv..."
    uv venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    uv pip install chromadb
  else
    source "$VENV_DIR/bin/activate"
  fi

  # Start ChromaDB in the background
  chroma run --path "$CHROMA_DATA" &
  CHROMA_PID=$!
  PIDS_TO_KILL+=("$CHROMA_PID")

  # Wait for it to be ready
  echo "  Waiting for ChromaDB to start..."
  for i in $(seq 1 30); do
    if curl -sf "$CHROMA_URL/api/v2/heartbeat" > /dev/null 2>&1; then
      echo "✓ ChromaDB started (PID $CHROMA_PID)"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "✗ ChromaDB failed to start after 30s"
      exit 1
    fi
    sleep 1
  done
fi

# --- Activate venv and install Python backend deps ---

if [ ! -d "$VENV_DIR" ]; then
  echo "  Creating Python venv..."
  uv venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

echo "Installing Python backend dependencies..."
uv pip install -q --pre -r "$APP_DIR/backend/requirements.txt"

# --- Product Indexing ---

NEEDS_INDEX=false
COLLECTION_CHECK=$(curl -sf "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/products" 2>/dev/null || echo "NOT_FOUND")

if echo "$COLLECTION_CHECK" | grep -q "NOT_FOUND"; then
  NEEDS_INDEX=true
  echo "Products collection not found, indexing needed"
else
  # Collection exists — extract UUID and check document count
  COLLECTION_ID=$(echo "$COLLECTION_CHECK" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['id'], end='')
except:
    pass
")

  if [ -n "$COLLECTION_ID" ]; then
    COUNT_RESP=$(curl -sf "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/$COLLECTION_ID/count" 2>/dev/null || echo "0")
    if [ "$COUNT_RESP" -lt 200 ] 2>/dev/null; then
      NEEDS_INDEX=true
      echo "Products collection has $COUNT_RESP items (expected 200), re-indexing"
    fi
  else
    NEEDS_INDEX=true
    echo "Could not read collection info, re-indexing"
  fi
fi

if [ "$NEEDS_INDEX" = true ]; then
  echo "Indexing products into ChromaDB..."
  cd "$APP_DIR"
  python backend/index_products.py
  echo "✓ Products indexed"
else
  echo "✓ Products already indexed (200 items)"
fi

# --- Load .env.local for the Python backend ---

if [ -f "$APP_DIR/.env.local" ]; then
  set -a
  source "$APP_DIR/.env.local"
  set +a
fi

# --- Start Python Backend ---

echo ""
echo "Starting Python backend on port $BACKEND_PORT..."
cd "$APP_DIR"
uvicorn backend.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!
PIDS_TO_KILL+=("$BACKEND_PID")

# Wait for backend to be ready
for i in $(seq 1 15); do
  if curl -sf "http://localhost:$BACKEND_PORT/products/featured" > /dev/null 2>&1; then
    echo "✓ Python backend started (PID $BACKEND_PID)"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "✗ Python backend failed to start"
    exit 1
  fi
  sleep 1
done

# --- Start Next.js ---

echo ""
echo "Starting Next.js dev server on port $NEXT_PORT..."
cd "$APP_DIR"
npx next dev -p "$NEXT_PORT" &
NEXT_PID=$!
PIDS_TO_KILL+=("$NEXT_PID")

echo ""
echo "✓ All services running:"
echo "  - ChromaDB:       $CHROMA_URL"
echo "  - Python backend: http://localhost:$BACKEND_PORT"
echo "  - Next.js:        http://localhost:$NEXT_PORT"
echo ""

# Wait for any child to exit
wait
