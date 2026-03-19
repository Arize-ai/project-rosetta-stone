#!/usr/bin/env bash
set -e

EVALS_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install dependencies if needed
if [ ! -d "$EVALS_DIR/node_modules" ]; then
  echo "Installing eval dependencies..."
  npm install --prefix "$EVALS_DIR"
fi

# Load env from the calling project directory (passed as $1, defaulting to cwd)
PROJECT_DIR="${1:-$(pwd)}"

set -a
# shellcheck source=/dev/null
[ -f "$PROJECT_DIR/.env.local" ] && source "$PROJECT_DIR/.env.local"
[ -f "$PROJECT_DIR/.env" ] && source "$PROJECT_DIR/.env"
set +a

node --env-file-if-exists="$PROJECT_DIR/.env" \
     --env-file-if-exists="$PROJECT_DIR/.env.local" \
     "$EVALS_DIR/node_modules/.bin/tsx" --conditions=import "$EVALS_DIR/run-phoenix-evals.ts"
