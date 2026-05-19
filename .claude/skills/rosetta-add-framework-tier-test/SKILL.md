---
name: rosetta-add-framework-tier-test
description: Test a freshly-built tier for a new framework — boots the backend, smoke-tests the chat endpoint, runs synthetic requests, and (for phoenix) runs the eval harness. Verifies traces land in the right project. Part of the rosetta-add-framework flow; can be invoked standalone after a build to validate.
---

# Tier Test

Validate a single tier (no-observability, phoenix, or ax) after build.

## Inputs

- `FRAMEWORK_DIR` — e.g. `google-adk-py`
- `TIER` — `no-observability` | `phoenix` | `ax`

## Steps

### 1. Stop anything already on backend ports

```bash
lsof -ti :8001 2>/dev/null | xargs -r kill 2>/dev/null
sleep 1
```

### 2. Start the backend

The canonical way is `npm run dev` which boots ChromaDB + Python backend + Next.js. For a focused tier test, that's fine — just hit the Python backend directly on :8001 for chat tests.

```bash
cd "$TIER/$FRAMEWORK_DIR"
npm run dev > /tmp/rosetta-tier-test.log 2>&1 &
DEV_PID=$!
until curl -sf http://127.0.0.1:8001/products/featured > /dev/null 2>&1; do
  if ! kill -0 $DEV_PID 2>/dev/null; then
    echo "dev script died — see /tmp/rosetta-tier-test.log"
    tail -30 /tmp/rosetta-tier-test.log
    exit 1
  fi
  sleep 2
done
```

### 3. Smoke tests (all tiers)

Three chat requests against `:8001/chat`:

```bash
# Test A: conversational (no tools expected)
curl -sN -X POST http://127.0.0.1:8001/chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-a" \
  -d '{"messages":[{"role":"user","content":"Just say hi back in one sentence, no tools."}]}' \
  --max-time 60 | head -10

# Test B: tool call (should trigger search_products)
curl -sN -X POST http://127.0.0.1:8001/chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-b" \
  -d '{"messages":[{"role":"user","content":"Show me one dinosaur toy"}]}' \
  --max-time 90 | head -25

# Test C: multi-turn (history persistence)
# First turn primes the per-user history
curl -sN -X POST http://127.0.0.1:8001/chat \
  -H "x-user-id: test-c" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"My favorite color is teal. Acknowledge in one sentence."}]}' \
  --max-time 30 > /dev/null
# Second turn should remember
curl -sN -X POST http://127.0.0.1:8001/chat \
  -H "x-user-id: test-c" -H "Content-Type: application/json" \
  -d '{"messages":[
    {"role":"user","content":"My favorite color is teal. Acknowledge in one sentence."},
    {"role":"assistant","content":"Got it!"},
    {"role":"user","content":"What is my favorite color? One word, no tools."}
  ]}' \
  --max-time 30 | tail -3
```

Pass criteria: all 3 return SSE chunks ending in `data: [DONE]`, no `ERROR:` lines in `/tmp/rosetta-tier-test.log` (excluding `ExperimentalWarning` / `DeprecationWarning`). Test C's response should contain "teal".

### 4. Tier-specific verification

#### `no-observability` — stop here

No traces to verify. Kill the backend and report.

#### `phoenix` tier

Trace verification + full eval harness.

```bash
# Wait for ingestion
sleep 10

# Verify a trace landed in the configured project
PHOENIX_PROJECT=$(grep '^PHOENIX_PROJECT_NAME=' .env.local | cut -d= -f2)
/Users/jimbobbennett/github/project-rosetta-stone/.venv/bin/python <<EOF
from phoenix.client import Client
c = Client(base_url="http://localhost:6006")
df = c.spans.get_spans_dataframe(project_identifier="$PHOENIX_PROJECT", limit=20)
print(f"spans: {len(df)}")
assert len(df) > 0, "no spans landed — check tracing.py"
EOF

# Stop backend (synthetic-requests will boot a fresh one)
lsof -ti :8001 :3000 | xargs -r kill 2>/dev/null
sleep 1

# Run the full eval harness (~10 min)
npm run synthetic-requests 2>&1 | grep -E "^User:|ERROR|Response \(|Done!" | tail -30
sleep 30  # ingestion
npm run evals 2>&1 | tail -10
```

Pass criteria: 25 synthetic requests all return non-error responses; `evals` logs annotations to Phoenix without crashing.

#### `ax` tier

Trace verification only (evals are UI-configured in AX).

```bash
sleep 30  # AX ingestion is slower than Phoenix
ARIZE_PROJECT=$(grep '^ARIZE_PROJECT_NAME=' .env.local | cut -d= -f2)
set -a; source .env.local; set +a
ax traces list "$ARIZE_PROJECT" \
  --space "$ARIZE_SPACE_ID" \
  --start-time "$(date -u -v-15M +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u -v+1M +%Y-%m-%dT%H:%M:%SZ)" \
  --limit 10 --output /tmp/rosetta-ax-traces.json > /dev/null 2>&1

python3 <<EOF
import json
data = json.load(open('/tmp/rosetta-ax-traces.json'))
spans = data.get('spans', data) if isinstance(data, dict) else data
print(f"traces found: {len(spans)}")
assert len(spans) >= 3, "expected at least 3 traces (smoke A+B+C)"
EOF

# Then synthetic-requests
lsof -ti :8001 :3000 | xargs -r kill 2>/dev/null
sleep 1
npm run synthetic-requests 2>&1 | grep -E "^User:|ERROR|Response \(|Done!" | tail -30
```

Pass criteria: at least 3 traces visible in AX from the smoke test; 25 synthetic requests all return non-error responses.

### 5. Cleanup

```bash
lsof -ti :3000 :8001 2>/dev/null | xargs -r kill 2>/dev/null
# Don't touch :8000 (ChromaDB) or :6006 (Phoenix) — orchestrator manages those
```

## Output

```
TIER_TESTED: <TIER>/<FRAMEWORK_DIR>
  smoke A (greeting): PASS
  smoke B (tool call): PASS
  smoke C (multi-turn): PASS  (recalled history: yes|no)
  traces verified: <count>
  synthetic-requests: 25/25 OK | <N>/25 OK (see log)
  evals: PASS | n/a | FAIL <error>
```
