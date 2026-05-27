---
name: rosetta-pr-screenshots
description: Capture AX trace UI, Phoenix trace UI, and Wonder Toys app UI screenshots for a framework's PR, then upload as GitHub release assets and embed in the PR body. Called automatically by rosetta-add-framework-docs as part of new-framework PRs; can also be invoked standalone to retrofit existing PRs. Cross-platform — uses Playwright end-to-end.
---

# Rosetta PR Screenshots

Captures the full screenshot set for a framework's PR — AX session/traces, Phoenix session/traces, app UI — and attaches them via GitHub release assets referenced in the PR body.

Everything runs through Playwright. No AppleScript, no `screencapture`, no Safari focus games — just `page.screenshot()` against the actual SPA DOM.

## Why release assets and not in-repo or drag-drop

GitHub has three ways to attach images to a PR:

1. **Drag-drop into PR body** (user-attachments) — produces nice `github.com/user-attachments/assets/<uuid>` URLs but the upload mechanism uses session cookies, not API tokens. Not cleanly automatable from `gh` CLI.
2. **Commit to the PR's branch** — works, but adds ~5MB of PNG bloat to the repo permanently after merge.
3. **GitHub release assets** — this is what this skill uses. `gh release create` + `gh release upload` are 100% reliable from CLI. The asset URLs (`github.com/<org>/<repo>/releases/download/<tag>/<file>`) work in markdown image tags. Repo stays clean.

We use option 3.

## Prerequisites

- Playwright project at `.claude/skills/rosetta-add-framework-playwright/` installed:
  ```bash
  cd .claude/skills/rosetta-add-framework-playwright
  npm install && npx playwright install chromium
  ```
- AX auth captured once via the bootstrap below (saved to `$HOME/.rosetta-stone/ax-auth.json`)
- Local Phoenix running on `:6006` (the skill starts it if missing) — no auth needed
- Framework's `agent.py` tags spans with `session.id` (e.g. via OpenInference's `using_session(user_id)` wrap). Without this the session URLs render empty. This is a per-framework responsibility — fix the framework, not this skill.

## One-time setup: AX auth bootstrap

The AX UI requires session cookies. Capture them once:

```bash
cd .claude/skills/rosetta-add-framework-playwright
node auth-bootstrap.mjs
```

This opens Chromium, navigates to `https://app.arize.com`, watches the URL for the post-login pattern, **waits for the authenticated sidebar to render** (otherwise the SPA hasn't yet written localStorage tokens and the saved state is incomplete), then saves:

- `$HOME/.rosetta-stone/ax-auth.json` — Playwright storage state (cookies + localStorage)
- `$HOME/.rosetta-stone/ax-auth-meta.json` — `{ ax_org_id, ax_space_id }` parsed from the post-login URL, so the orchestrator doesn't need to round-trip the Arize SDK

Re-run only when the session expires (observed: ~5–7 days). Override paths via `AX_STORAGE_STATE=/some/path node auth-bootstrap.mjs`.

## Inputs

- `FRAMEWORK` — slug (e.g. `agno`, `crewai`)
- `FRAMEWORK_DIR` — directory name (e.g. `agno-py`, `crewai-py`)
- `PR_NUMBER` — existing PR number to update
- `AX_PORT` (default 8011) — backend port for AX tier
- `PHOENIX_PORT` (default 8021) — backend port for Phoenix tier
- `NEXT_PORT` (default 3010) — Next.js port for UI capture (and dev-server target)
- `BRANCH` — the PR's branch (for the release tag)

## Steps

### 1. Set up output dir + state

```bash
WT=$(git rev-parse --show-toplevel)
OUT_DIR="$WT/.screenshots-staging/$FRAMEWORK"
mkdir -p "$OUT_DIR"

# Distinct session IDs for AX and Phoenix so projects don't collide
AX_SESSION="demo-ax-$(date -u +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"
PHX_SESSION="demo-phx-$(date -u +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"

# Time window for AX URL — pad ±15 min around now
START_MS=$(($(date +%s) * 1000 - 900000))
END_MS=$(($(date +%s) * 1000 + 60000))

PW_DIR="$WT/.claude/skills/rosetta-add-framework-playwright"
```

### 2. Boot AX tier and run the canned 3-turn conversation

```bash
cd "$WT/ax/$FRAMEWORK_DIR"
(set -a && source .env.local && set +a && \
  python -m uvicorn backend.main:app --host 127.0.0.1 --port $AX_PORT) > /tmp/ax-cap.log 2>&1 &
until curl -sf http://127.0.0.1:$AX_PORT/products/featured > /dev/null 2>&1; do sleep 1; done
```

Send the 3-turn conversation (search dragons → buy plushie → ship) with `x-user-id: $AX_SESSION`. Use the helper pattern from `rosetta-demo-capture` step 4 (`send_turn` shell function over SSE). Reuse that verbatim — it's well-tested.

After the conversation:

```bash
echo "waiting 45s for AX ingestion…"
sleep 45
```

### 3. Resolve AX project + trace IDs and build URLs

Pull `ax_org_id` from the meta file the bootstrap wrote:

```bash
ARIZE_ORG_ID=$(python3 -c "import json; print(json.load(open('$HOME/.rosetta-stone/ax-auth-meta.json'))['ax_org_id'])")
```

Then:

```bash
set -a; source "$WT/ax/$FRAMEWORK_DIR/.env.local"; set +a

ARIZE_PROJECT_ID=$(ax projects list --space "$ARIZE_SPACE_ID" --limit 100 --output csv 2>/dev/null \
  | awk -F',' -v name="$ARIZE_PROJECT_NAME" '$2 == name {print $1; exit}')

# Trace IDs in this session (filtered via ax CLI by time window, then by session.id)
mkdir -p .arize-tmp-traces
ax traces list "$ARIZE_PROJECT_ID" \
  --space "$ARIZE_SPACE_ID" \
  --start-time "$(python3 -c "import datetime; print(datetime.datetime.fromtimestamp($START_MS/1000, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))")" \
  --end-time   "$(python3 -c "import datetime; print(datetime.datetime.fromtimestamp($END_MS/1000, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))")" \
  --limit 50 --output .arize-tmp-traces/ax-session.json > /dev/null 2>&1

AX_TRACE_IDS=$(python3 -c "
import json
spans = json.load(open('.arize-tmp-traces/ax-session.json'))
spans = spans.get('spans', spans) if isinstance(spans, dict) else spans
seen=[]
for s in spans:
    if s.get('attributes',{}).get('session.id') != '$AX_SESSION': continue
    tid = s.get('context',{}).get('trace_id')
    if tid and tid not in seen: seen.append(tid)
print(' '.join(seen))
")
```

Build the session URL and trace URLs using the templates from `arize-link` / `rosetta-demo-capture` step 7. Collect trace URLs into a JSON array for the spec env:

```bash
AX_SESSION_URL="https://app.arize.com/organizations/$ARIZE_ORG_ID/spaces/$ARIZE_SPACE_ID/projects/$ARIZE_PROJECT_ID?selectedSessionId=$AX_SESSION&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA=$START_MS&endA=$END_MS&envA=tracing&modelType=generative_llm"

AX_TRACE_URLS_JSON=$(python3 -c "
import json, os
ids = '''$AX_TRACE_IDS'''.split()
base = f\"https://app.arize.com/organizations/{os.environ['ARIZE_ORG_ID']}/spaces/{os.environ['ARIZE_SPACE_ID']}/projects/{os.environ['ARIZE_PROJECT_ID']}\"
urls = [f\"{base}?selectedTraceId={tid}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA=$START_MS&endA=$END_MS&envA=tracing&modelType=generative_llm\" for tid in ids]
print(json.dumps(urls))
" ARIZE_ORG_ID="$ARIZE_ORG_ID" ARIZE_SPACE_ID="$ARIZE_SPACE_ID" ARIZE_PROJECT_ID="$ARIZE_PROJECT_ID")
```

### 4. Run AX Playwright spec

```bash
cd "$PW_DIR"
OUT_DIR="$OUT_DIR" \
  AX_SESSION_URL="$AX_SESSION_URL" \
  AX_TRACE_URLS="$AX_TRACE_URLS_JSON" \
  npx playwright test ax-screenshots.spec.ts --reporter=list
```

Outputs `ax-01-session.png`, `ax-02-trace-<tid>.png`, …

Then stop the AX backend:

```bash
lsof -ti :$AX_PORT | xargs -r kill 2>/dev/null
```

### 5. Boot Phoenix tier and run conversation

Same pattern as AX. Boot the Phoenix tier on `$PHOENIX_PORT`, ensure local Phoenix is on `:6006`, send the 3-turn conversation with `x-user-id: $PHX_SESSION`, wait for ingestion (Phoenix is local so ~5s suffices, but use 15s to be safe).

```bash
# Start local Phoenix if not running
curl -sf http://localhost:6006/healthz > /dev/null 2>&1 \
  || phoenix serve > /tmp/phoenix-shared.log 2>&1 &

cd "$WT/phoenix/$FRAMEWORK_DIR"
(set -a && source .env.local && set +a && \
  python -m uvicorn backend.main:app --host 127.0.0.1 --port $PHOENIX_PORT) > /tmp/phx-cap.log 2>&1 &
until curl -sf http://127.0.0.1:$PHOENIX_PORT/products/featured > /dev/null 2>&1; do sleep 1; done

# Re-use send_turn from step 2 with BACKEND="http://127.0.0.1:$PHOENIX_PORT"
# and x-user-id: $PHX_SESSION
```

### 6. Resolve Phoenix project + trace IDs and build URLs

Phoenix exposes a REST API at `:6006`. **Important**: the UI's session URL uses Phoenix's **internal** session ID (a base64 token like `UHJvamVjdFNlc3Npb246MzE=`), not the user-supplied `session.id` attribute. Look it up via the `sessions` endpoint:

```bash
PHX_PROJECT_NAME=$(grep '^PHOENIX_PROJECT_NAME=' "$WT/phoenix/$FRAMEWORK_DIR/.env.local" | cut -d= -f2)
PHX_PROJECT_ID=$(curl -s http://localhost:6006/v1/projects \
  | jq -r --arg n "$PHX_PROJECT_NAME" '.data[] | select(.name == $n) | .id')

# Phoenix trace IDs: query the spans API for ones tagged with the session.id.
# Match by prefix — some frameworks (google-adk) append a per-turn suffix
# (`:0`, `:1`, `:2`) to the session.id so each turn lands in its own session.
PHX_TRACE_IDS=$(curl -s "http://localhost:6006/v1/projects/$PHX_PROJECT_ID/spans?limit=200" \
  | jq -r --arg s "$PHX_SESSION" \
      '.data | map(select(.attributes."session.id" | startswith($s))) | map(.context.trace_id) | unique | .[]')

# Resolve the internal session ID for the UI URL (use the ":0" variant — the
# first turn's session — for frameworks that suffix per turn).
PHX_INTERNAL_SESSION_ID=$(curl -s "http://localhost:6006/v1/projects/$PHX_PROJECT_ID/sessions?limit=100" \
  | jq -r --arg s "${PHX_SESSION}:0" \
      '.data[] | select(.session_id == $s) | .id' \
  | head -1)
# Fallback if the framework doesn't suffix: try the bare session.id
if [ -z "$PHX_INTERNAL_SESSION_ID" ]; then
  PHX_INTERNAL_SESSION_ID=$(curl -s "http://localhost:6006/v1/projects/$PHX_PROJECT_ID/sessions?limit=100" \
    | jq -r --arg s "$PHX_SESSION" '.data[] | select(.session_id == $s) | .id' | head -1)
fi

PHX_SESSION_URL="http://localhost:6006/projects/$PHX_PROJECT_ID/sessions/$PHX_INTERNAL_SESSION_ID"
PHX_TRACE_URLS_JSON=$(python3 -c "
import json
ids = '''$PHX_TRACE_IDS'''.split()
print(json.dumps([f'http://localhost:6006/projects/$PHX_PROJECT_ID/traces/{t}' for t in ids]))
")
```

### 7. Run Phoenix Playwright spec

```bash
cd "$PW_DIR"
OUT_DIR="$OUT_DIR" \
  PHX_SESSION_URL="$PHX_SESSION_URL" \
  PHX_TRACE_URLS="$PHX_TRACE_URLS_JSON" \
  npx playwright test phoenix-screenshots.spec.ts --reporter=list
```

Outputs `phoenix-01-session.png`, `phoenix-02-trace-<tid>.png`, …

### 8. Capture Wonder Toys app UI

Boot a Next.js dev server. Any tier's frontend works (same code). **Set `BACKEND_URL` so the SSR product fetch hits the running backend**, not the default `:8001`:

```bash
cd "$WT/phoenix/$FRAMEWORK_DIR"
BACKEND_URL="http://127.0.0.1:$PHOENIX_PORT" \
  npx next dev -p $NEXT_PORT > /tmp/next-cap.log 2>&1 &
until curl -sf "http://localhost:$NEXT_PORT" > /dev/null 2>&1; do sleep 1; done

cd "$PW_DIR"
OUT_DIR="$OUT_DIR" \
  UI_BASE_URL="http://localhost:$NEXT_PORT" \
  npx playwright test ui-screenshots.spec.ts --reporter=list
```

Outputs `ui-01-landing.png`, `ui-02-product.png`. Without `BACKEND_URL`, the product detail page hits a 500 (ECONNREFUSED) because Next.js's SSR tries the default backend port.

### 9. Upload as GitHub release assets

```bash
RELEASE_TAG="screenshots-pr-$PR_NUMBER"

gh release create "$RELEASE_TAG" \
  --title "Screenshots for PR #$PR_NUMBER ($FRAMEWORK)" \
  --notes "Auto-generated screenshots from rosetta-pr-screenshots for PR #$PR_NUMBER." \
  --target main \
  || true   # ignore "already exists" — `gh release create` is not idempotent

gh release upload "$RELEASE_TAG" "$OUT_DIR"/*.png --clobber

REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
ASSET_BASE="https://github.com/${REPO_FULL}/releases/download/${RELEASE_TAG}"
```

### 10. Update PR body

```bash
CURRENT_BODY=$(gh pr view "$PR_NUMBER" --json body -q .body)

SCREENSHOTS_MD=$(cat <<EOF

## Screenshots

### Wonder Toys app UI

![Landing page]($ASSET_BASE/ui-01-landing.png)
![Product detail]($ASSET_BASE/ui-02-product.png)

### Arize AX

Session view:

![AX session]($ASSET_BASE/ax-01-session.png)

Traces:

$(for f in "$OUT_DIR"/ax-*-trace-*.png; do
  name=$(basename "$f")
  echo "![$name]($ASSET_BASE/$name)"
done)

### Phoenix

Session view:

![Phoenix session]($ASSET_BASE/phoenix-01-session.png)

Traces:

$(for f in "$OUT_DIR"/phoenix-*-trace-*.png; do
  name=$(basename "$f")
  echo "![$name]($ASSET_BASE/$name)"
done)
EOF
)

# Strip any prior Screenshots section (idempotent re-runs)
NEW_BODY=$(echo "$CURRENT_BODY" | awk '/^## Screenshots/{exit} {print}')
NEW_BODY="${NEW_BODY}${SCREENSHOTS_MD}"

gh pr edit "$PR_NUMBER" --body "$NEW_BODY"
```

### 11. Cleanup

```bash
lsof -ti :$AX_PORT :$PHOENIX_PORT :$NEXT_PORT 2>/dev/null | xargs -r kill 2>/dev/null
rm -rf "$OUT_DIR"
```

## Output

```
Screenshots attached to PR #<N>
  Release: <RELEASE_TAG>
  Files: <count> AX, <count> Phoenix, <count> UI
  URLs: https://github.com/<repo>/releases/tag/<tag>
  PR body updated.
```

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Playwright errors with "storage state not found" | Auth bootstrap hasn't run | `cd .claude/skills/rosetta-add-framework-playwright && node auth-bootstrap.mjs` |
| AX session screenshot shows login page | Saved session expired | Re-run `auth-bootstrap.mjs` |
| AX session URL shows "no recent data" | `startA`/`endA` window misses the trace | Widen `START_MS`/`END_MS` (default ±15 min should cover any sane ingestion lag) |
| Phoenix session view empty | Framework doesn't tag spans with `session.id` | Fix the framework — `using_session(user_id)` wrap (see CrewAI's agent.py). Skill won't paper over this. |
| Trace tree not expanded in screenshot | DOM selector drifted in AX/Phoenix UI | Update the `EXPAND_JS` selectors in `tests/{ax,phoenix}-screenshots.spec.ts`. Probe via `npx playwright test --debug` |
| Phoenix session view shows "Something went wrong" | Using user-supplied `session.id` in URL instead of Phoenix's internal session ID | The orchestrator must resolve the internal id via `GET /v1/projects/<id>/sessions` and use `.data[].id` in the URL (see step 6) |
| UI product detail page 500s with `ECONNREFUSED` | Next.js SSR is hitting default backend port `:8001`, not the one this skill booted | Pass `BACKEND_URL=http://127.0.0.1:$PHOENIX_PORT` when starting `next dev` (see step 8) |
| `gh release create` fails with "tag already exists" | Re-running against the same PR | Safe to ignore — the `|| true` swallows it. Subsequent `--clobber` overwrites assets. |

## Re-running

Idempotent for a given PR:
- `gh release upload --clobber` overwrites existing assets
- `gh pr edit --body` replaces the existing Screenshots section (awk-based prefix strip)

Safe to re-run if any step failed mid-way.

## Integration with rosetta-add-framework-docs

When a new framework PR is created via `rosetta-add-framework-docs`, this skill is automatically invoked as the final step before the PR opens. See `rosetta-add-framework-docs/SKILL.md` for the integration point.
