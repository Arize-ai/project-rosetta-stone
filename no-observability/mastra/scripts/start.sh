#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CHROMA_URL="${CHROMA_URL:-http://localhost:8000}"
CHROMA_DATA="$REPO_ROOT/chroma-data"
VENV_DIR="$REPO_ROOT/.venv"

# --- ChromaDB Setup ---

# Check if ChromaDB is already running
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

  # Stop ChromaDB when this script exits
  trap "echo 'Stopping ChromaDB...'; kill $CHROMA_PID 2>/dev/null; wait $CHROMA_PID 2>/dev/null" EXIT
fi

# --- Product Indexing ---

# Check if products are already indexed
NEEDS_INDEX=false
COLLECTION_CHECK=$(curl -sf "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/products" 2>/dev/null || echo "NOT_FOUND")

if echo "$COLLECTION_CHECK" | grep -q "NOT_FOUND"; then
  NEEDS_INDEX=true
  echo "Products collection not found, indexing needed"
else
  # Collection exists — check if it has the right number of documents
  COUNT=$(echo "$COLLECTION_CHECK" | node -e "
    let d='';
    process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{
      try{
        const j=JSON.parse(d);
        // Count endpoint
        process.stdout.write(String(j.dimension ? 'CHECK_COUNT' : 0));
      }catch{process.stdout.write('0');}
    });
  ")

  if [ "$COUNT" = "CHECK_COUNT" ]; then
    # Collection exists with embeddings, check count via API
    COUNT_RESP=$(curl -sf "$CHROMA_URL/api/v2/tenants/default_tenant/databases/default_database/collections/products/count" 2>/dev/null || echo "0")
    if [ "$COUNT_RESP" -lt 200 ] 2>/dev/null; then
      NEEDS_INDEX=true
      echo "Products collection has $COUNT_RESP items (expected 200), re-indexing"
    fi
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

# --- Start Next.js ---

echo ""
echo "Starting Next.js dev server..."
cd "$APP_DIR"
exec npx next dev
