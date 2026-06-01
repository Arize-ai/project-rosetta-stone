#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROMA_URL="${CHROMA_URL:-http://localhost:8000}"
CHROMA_DATA="$REPO_ROOT/chroma-data"
VENV_DIR="$REPO_ROOT/.venv"
# Sibling Python tier holds the canonical product index script. We reuse it so we don't have to
# re-implement vector indexing in Java just for dev bootstrap.
INDEX_TIER="$REPO_ROOT/no-observability/langchain-py"

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

# --- Activate venv and install indexer deps ---

if [ ! -d "$VENV_DIR" ]; then
  echo "  Creating Python venv..."
  uv venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

echo "Installing ChromaDB indexer dependencies..."
uv pip install -q -r "$INDEX_TIER/backend/requirements.txt"

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
  echo "Indexing products into ChromaDB (using sibling Python tier's indexer)..."
  cd "$INDEX_TIER"
  python backend/index_products.py
  echo "✓ Products indexed"
else
  echo "✓ Products already indexed (200 items)"
fi

# --- Load .env.local for the Java backend ---

if [ -f "$APP_DIR/.env.local" ]; then
  set -a
  source "$APP_DIR/.env.local"
  set +a
fi

# --- Build the Java backend (once, then run the jar) ---

echo ""
echo "Building Java backend..."
cd "$APP_DIR/backend"
./gradlew --quiet bootJar
BOOT_JAR=$(ls -1 build/libs/*.jar 2>/dev/null | head -1)
if [ -z "$BOOT_JAR" ]; then
  echo "✗ bootJar not produced"
  exit 1
fi

# --- Start Java Backend ---

echo "Starting Java backend on port 18004..."
java -jar "$BOOT_JAR" &
BACKEND_PID=$!
PIDS_TO_KILL+=("$BACKEND_PID")

# Wait for backend to be ready
for i in $(seq 1 30); do
  if curl -sf "http://localhost:18004/products/featured" > /dev/null 2>&1; then
    echo "✓ Java backend started (PID $BACKEND_PID)"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ Java backend failed to start"
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
echo "  - ChromaDB:     $CHROMA_URL"
echo "  - Java backend: http://localhost:18004"
echo "  - Next.js:      http://localhost:3000"
echo ""

# Wait for any child to exit
wait
