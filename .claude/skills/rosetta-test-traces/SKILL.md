---
name: rosetta-test-traces
description: Run the 25 synthetic Wonder Toys requests against a Rosetta Stone framework to generate traces in an isolated Arize AX or Phoenix project. Loads the .env.test-local overlay so the project name override takes effect without touching .env.local. Part of the rosetta-test e2e flow; can also be invoked standalone if setup already ran.
---

# Rosetta Test — Traces Phase

Sends 25 synthetic requests to a freshly provisioned project so the platform has trace data to evaluate.

## Inputs

- `PROJECT_DIR` — absolute path to `<platform>/<framework>/`
- `PROJECT_NAME` — the unique name emitted by setup
- `PLATFORM` — `ax` or `phoenix`

## Steps

### 1. Install npm deps if missing

```bash
test -d "$PROJECT_DIR/node_modules" || (cd "$PROJECT_DIR" && npm install)
```

The eval harness shell scripts (`evals/run-synthetic-requests.sh`) handle the dev server and Chroma startup themselves — don't pre-start those here.

### 2. Run synthetic requests with the env overlay

The harness scripts only auto-load `.env` and `.env.local`. To get `.env.test-local` into the npm child process, export it into the parent shell first:

```bash
(
  set -a
  [ -f "$PROJECT_DIR/.env.local" ]      && source "$PROJECT_DIR/.env.local"
  [ -f "$PROJECT_DIR/.env.test-local" ] && source "$PROJECT_DIR/.env.test-local"
  set +a
  cd "$PROJECT_DIR" && npm run synthetic-requests
)
```

Order matters: `.env.test-local` sourced **last** so the project-name override wins.

This call:
- Starts the dev server in the background if not already running (with its own trap to kill on exit).
- For Python framework tiers, also starts the FastAPI backend on port 8001.
- Sends all 25 requests sequentially to `/api/chat`.
- Sleeps 20s afterward for trace ingestion.

Expect ~5–15 minutes of wall time depending on framework and LLM latency. Do not background or timeout-truncate this — let it complete.

### 3. Confirm trace ingestion

For AX, give the ingestion pipeline an extra buffer beyond the harness's built-in sleep before the evals phase runs. The harness already sleeps 20s; add 30s more here:

```bash
[ "$PLATFORM" = "ax" ] && sleep 30
```

Phoenix ingestion is typically faster — no extra wait needed.

### 4. Quick sanity check

Before handing off, confirm at least one trace landed:

- AX: `ax traces list "$PROJECT_NAME" --space "$ARIZE_SPACE_ID" --limit 1 --output json`
- Phoenix: hit `${PHOENIX_BASE_URL}/v1/projects` with the API key and look for the project name, where `PHOENIX_BASE_URL = ${PHOENIX_COLLECTOR_ENDPOINT%/v1/traces}`.

If the sanity check shows zero traces, abort — re-running the harness from this point is safer than continuing to evals against an empty project.

## Failure modes

- Dev server fails to start within 60s → harness aborts and dumps `/tmp/nextjs-evals.log`. Surface that log to the user.
- ChromaDB indexing fails → no traces will land. The harness still exits 0 in some cases. Sanity check (step 4) catches this.
- HTTP non-200 from `/api/chat` → likely missing `EVAL_SECRET` (the harness generates one but the route must validate it). Check the project's `src/app/api/chat/route.ts` for the bypass logic.
