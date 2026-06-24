#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENT_DIR="$APP_DIR/eve-agent"
CHROMA_URL="${CHROMA_URL:-http://localhost:8000}"
CHROMA_DATA="$REPO_ROOT/chroma-data"
VENV_DIR="$REPO_ROOT/.venv"
EVE_PORT="${EVE_PORT:-2000}"

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

# --- Product Indexing ---

NEEDS_INDEX=false
COLLECTION_CHECK=$(curl -sf "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/products" 2>/dev/null || echo "NOT_FOUND")

if echo "$COLLECTION_CHECK" | grep -q "NOT_FOUND"; then
  NEEDS_INDEX=true
  echo "Products collection not found, indexing needed"
else
  # Collection exists — extract UUID and check document count
  # (ChromaDB v2 count endpoint requires the collection UUID, not the name)
  COLLECTION_ID=$(echo "$COLLECTION_CHECK" | node -e "
    let d='';
    process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      try{process.stdout.write(JSON.parse(d).id);}catch{}
    });
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
  npx tsx scripts/index-products.ts
  echo "✓ Products indexed"
else
  echo "✓ Products already indexed (200 items)"
fi

# --- Load .env / .env.local so the Eve agent inherits credentials ---
# (AI_GATEWAY_API_KEY for the model, plus any observability vars.)
for envfile in "$APP_DIR/.env" "$APP_DIR/.env.local"; do
  if [ -f "$envfile" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$envfile"
    set +a
  fi
done

# --- Install Eve agent dependencies if needed ---

if [ ! -d "$AGENT_DIR/node_modules" ]; then
  echo "Installing Eve agent dependencies..."
  (cd "$AGENT_DIR" && npm install)
fi

# --- Start the Eve agent dev server ---
# The Eve dev server hosts the built-in HTTP channel the Next.js chat route
# proxies to. `--no-ui` is required in non-TTY contexts; pinning the port with
# `--port` avoids auto-increment surprises.

echo ""
echo "Starting Eve agent dev server on port $EVE_PORT..."
cd "$AGENT_DIR"
npx eve dev --port "$EVE_PORT" --no-ui &
EVE_PID=$!
PIDS_TO_KILL+=("$EVE_PID")

# Wait for the Eve server to listen (poll with lsof — /dev/tcp is bash-only).
echo "  Waiting for the Eve agent to listen on port $EVE_PORT..."
for i in $(seq 1 60); do
  if lsof -iTCP:"$EVE_PORT" -sTCP:LISTEN > /dev/null 2>&1; then
    echo "✓ Eve agent started (PID $EVE_PID, port $EVE_PORT)"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "✗ Eve agent failed to start after 60s"
    exit 1
  fi
  sleep 1
done

# --- Start Next.js ---

echo ""
echo "Starting Next.js dev server..."
cd "$APP_DIR"
npx next dev &
NEXT_PID=$!
PIDS_TO_KILL+=("$NEXT_PID")

echo ""
echo "✓ All services running:"
echo "  - ChromaDB:   $CHROMA_URL"
echo "  - Eve agent:  http://localhost:$EVE_PORT"
echo "  - Next.js:    http://localhost:3000"
echo ""

# Wait for any child to exit
wait
