---
name: rosetta-test-setup
description: Provision a fresh Rosetta Stone test project on Arize AX or Phoenix. Validates the target framework directory and credentials, mints a unique project name, writes a sibling .env.test-local overlay so the real .env.local is untouched, and pre-creates the AX project (Phoenix auto-creates on first trace). Part of the rosetta-test e2e flow; can also be invoked standalone.
---

# Rosetta Test — Setup Phase

## Inputs

- `<framework>` — directory name under the chosen platform
- `<platform>` — `ax` or `phoenix`

## Steps

### 1. Validate the target directory

```bash
PROJECT_DIR="$(pwd)/<platform>/<framework>"
test -d "$PROJECT_DIR" || { echo "No such directory: $PROJECT_DIR"; exit 1; }
test -f "$PROJECT_DIR/package.json" || { echo "Missing package.json"; exit 1; }
```

Check the required npm scripts. Use `jq` if available, otherwise `node -e`:

```bash
HAS_SYN=$(node -e "console.log(!!require('$PROJECT_DIR/package.json').scripts?.['synthetic-requests'])")
[ "$HAS_SYN" = "true" ] || { echo "package.json missing 'synthetic-requests' script"; exit 1; }
```

For `phoenix` platform only, also require `evals`:

```bash
if [ "<platform>" = "phoenix" ]; then
  HAS_EVALS=$(node -e "console.log(!!require('$PROJECT_DIR/package.json').scripts?.evals)")
  [ "$HAS_EVALS" = "true" ] || { echo "phoenix tier missing 'evals' script"; exit 1; }
fi
```

If validation fails, list what's actually available under that platform so the user can spot a typo:

```bash
ls "$(pwd)/<platform>/"
```

### 2. Validate credentials

Source `.env.local` from the target directory and confirm the platform-specific keys are non-empty:

```bash
set -a
[ -f "$PROJECT_DIR/.env.local" ] && source "$PROJECT_DIR/.env.local"
set +a
```

- AX: require `ARIZE_SPACE_ID` and `ARIZE_API_KEY`
- Phoenix: require `PHOENIX_API_KEY` and `PHOENIX_COLLECTOR_ENDPOINT`

Abort with a clear message if missing. Do **not** print the values themselves.

### 3. Generate a unique project name

```bash
TIMESTAMP=$(date -u +%Y%m%d%H%M)
RAND=$(openssl rand -hex 2)
PROJECT_NAME="rosetta-e2e-<framework>-${TIMESTAMP}-${RAND}"
```

Phoenix rejects project names containing `/`, `?`, or `#` — the above is safe.

### 4. Pre-create the AX project (AX only)

```bash
ax projects create --name "$PROJECT_NAME" --space "$ARIZE_SPACE_ID"
```

Skip this step for Phoenix — projects auto-create on first trace ingestion.

If creation fails (rare, e.g. transient network), abort. Do not retry — let the orchestrator decide.

### 5. Write the env overlay

The overlay loads on top of `.env.local` so the real file is never mutated. Each tier's `synthetic-requests` and `evals` scripts already do `--env-file-if-exists` on `.env` and `.env.local` only, so the traces and evals skills must source `.env.test-local` explicitly into their parent shell.

```bash
ENV_OVERLAY="$PROJECT_DIR/.env.test-local"

cat > "$ENV_OVERLAY" <<EOF
# Rosetta E2E test overlay — safe to delete
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

if [ "<platform>" = "ax" ]; then
  echo "ARIZE_PROJECT_NAME=$PROJECT_NAME" >> "$ENV_OVERLAY"
else
  echo "PHOENIX_PROJECT_NAME=$PROJECT_NAME" >> "$ENV_OVERLAY"
fi
```

### 6. Emit state for downstream phases

Print these on their own lines, prefixed clearly, so the orchestrator (or a human resuming manually) can capture them:

```
PROJECT_NAME=<value>
PROJECT_DIR=<value>
PLATFORM=<value>
ENV_OVERLAY=<value>
```

## Idempotency

If `.env.test-local` already exists, do **not** overwrite. Abort with a message: "Existing test overlay found at <path>. Run cleanup first, or pass --keep was used previously." This protects against accidental clobbering of an in-flight run.
