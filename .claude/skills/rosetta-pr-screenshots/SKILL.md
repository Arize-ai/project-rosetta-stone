---
name: rosetta-pr-screenshots
description: Capture AX trace UI, Phoenix trace UI, and Wonder Toys app UI screenshots for a framework's PR, then upload as GitHub release assets and embed in the PR body. Called automatically by rosetta-add-framework-docs as part of new-framework PRs; can also be invoked standalone to retrofit existing PRs. macOS only.
---

# Rosetta PR Screenshots

Captures the full screenshot set for a framework's PR — AX session/traces, Phoenix session/traces, app UI — and attaches them via GitHub release assets referenced in the PR body.

## Why release assets and not in-repo or drag-drop

GitHub has three ways to attach images to a PR:

1. **Drag-drop into PR body** (user-attachments) — produces nice `github.com/user-attachments/assets/<uuid>` URLs but the upload mechanism uses session cookies, not API tokens. Not cleanly automatable from `gh` CLI.
2. **Commit to the PR's branch** — works, but adds ~5MB of PNG bloat to the repo permanently after merge.
3. **GitHub release assets** — this is what this skill uses. `gh release create` + `gh release upload` are 100% reliable from CLI. The asset URLs (`github.com/<org>/<repo>/releases/download/<tag>/<file>`) work in markdown image tags. Repo stays clean.

We use option 3.

## Inputs

- `FRAMEWORK` — slug (e.g. `agno`, `crewai`)
- `FRAMEWORK_DIR` — directory name (e.g. `agno-py`, `crewai-py`)
- `PR_NUMBER` — existing PR number to update
- `AX_PORT` (default 8011) — backend port for AX tier
- `PHOENIX_PORT` (default 8021) — backend port for Phoenix tier
- `NEXT_PORT` (default 3010) — Next.js port for Playwright UI capture
- `BRANCH` — the PR's branch (for the release tag and for the worktree we're operating in)

## Prerequisites

- macOS with Safari installed
- User signed into Arize AX in Safari
- Local Phoenix running on `:6006` (the skill starts it if missing)
- Safari → Settings → Advanced → "Show features for web developers" + Developer → "Allow JavaScript from Apple Events" enabled
- `rosetta-demo-capture` skill installed (we re-use its AX automation patterns)
- Playwright project under `.claude/skills/rosetta-add-framework-playwright/` installed (first-run: `npm install && npx playwright install chromium`)

## Steps

### 1. Set up output dir + state

```bash
WT=$(git rev-parse --show-toplevel)
OUT_DIR="$WT/.screenshots-staging/$FRAMEWORK"
mkdir -p "$OUT_DIR"

# Generate distinct session IDs for AX and Phoenix runs so they don't collide
AX_SESSION="demo-ax-$(date -u +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"
PHX_SESSION="demo-phx-$(date -u +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"

# Time window for AX URL — pad ±15 min around now
START_MS=$(($(date +%s) * 1000 - 900000))
END_MS=$(($(date +%s) * 1000 + 60000))
```

### 2. Capture AX traces (re-uses rosetta-demo-capture patterns)

Read `.claude/skills/rosetta-demo-capture/SKILL.md` and follow its flow with these adaptations:

- Source env from `$WT/ax/$FRAMEWORK_DIR/.env.local`
- Boot the backend on `$AX_PORT` (override the default 8001), Next.js on `$NEXT_PORT`
- Use `$AX_SESSION` as the `x-user-id` header for the canned 3-turn conversation (search dragons → buy plushie → ship)
- After the conversation, sleep 45s for AX ingestion
- Resolve `ARIZE_ORG_ID` via the SDK (one-liner — see rosetta-demo-capture step 1)
- Resolve `PROJECT_ID` from `ax projects list --space "$ARIZE_SPACE_ID" --limit 100 --output csv` (find by `ARIZE_PROJECT_NAME`)
- Build the session URL, open in Safari, expand session accordions via JS, screencap to `$OUT_DIR/ax-01-session.png`
- For each trace ID, open trace URL, screencap to `$OUT_DIR/ax-NN-trace.png`

End with the AX backend stopped and Safari left open.

### 3. Capture Phoenix traces

Same pattern as AX but pointed at the local Phoenix UI.

```bash
# Stop AX backend, boot Phoenix backend
lsof -ti :$AX_PORT | xargs -r kill 2>/dev/null

# Start local Phoenix if not already running (skill caller usually has done this)
curl -sf http://localhost:6006/healthz > /dev/null 2>&1 || phoenix serve > /tmp/phoenix-shared.log 2>&1 &

cd "$WT/phoenix/$FRAMEWORK_DIR"
(set -a && source .env.local && set +a && \
  python -m uvicorn backend.main:app --host 127.0.0.1 --port $PHOENIX_PORT) > /tmp/phx-cap.log 2>&1 &
until curl -sf http://127.0.0.1:$PHOENIX_PORT/products/featured > /dev/null 2>&1; do sleep 1; done
```

Send the 3-turn conversation with `x-user-id: $PHX_SESSION`. After ingestion, query Phoenix for the project ID:

```bash
PHX_PROJECT_NAME=$(grep '^PHOENIX_PROJECT_NAME=' "$WT/phoenix/$FRAMEWORK_DIR/.env.local" | cut -d= -f2)
PHX_PROJECT_ID=$(curl -s http://localhost:6006/v1/projects | jq -r --arg n "$PHX_PROJECT_NAME" '.data[] | select(.name == $n) | .id')
```

Phoenix UI URL pattern:

```
http://localhost:6006/projects/<PHX_PROJECT_ID>/sessions/<PHX_SESSION>
```

Open in Safari, use the same AppleScript trick (find Arize/Phoenix window by URL contains "localhost:6006", `set frontmost of process "Safari" to true`, screencap by bounds).

To expand the trace tree in the Phoenix session view, the DOM selector differs from AX. Probe once with:

```js
JSON.stringify({
  expandBtns: document.querySelectorAll('button[aria-label*="expand" i]').length,
  treeitems: document.querySelectorAll('[role="treeitem"]').length,
  // Phoenix uses different testid attributes — probe iteratively
})
```

Likely candidates: `[data-cy="expand-trace"]`, `button[aria-label*="expand" i]`, or `[role="button"][aria-expanded="false"]` within the trace tree container. Click only the trace-tree-scoped expand buttons; iterate until none remain.

Save screencaps as `$OUT_DIR/phoenix-01-session.png`, `phoenix-NN-trace.png`.

### 4. Capture Wonder Toys app UI via Playwright

The Next.js dev server should still be up from step 2 (don't kill it). If not, restart on `$NEXT_PORT`.

Create a new Playwright spec at `.claude/skills/rosetta-add-framework-playwright/tests/screenshot-capture.spec.ts`:

```ts
import { test } from "@playwright/test";

test("landing page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${process.env.OUT_DIR}/ui-01-landing.png`, fullPage: true });
});

test("product detail page", async ({ page }) => {
  await page.goto("/product/toy-001");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${process.env.OUT_DIR}/ui-02-product.png`, fullPage: true });
});
```

Run it:

```bash
cd "$WT/.claude/skills/rosetta-add-framework-playwright"
OUT_DIR="$OUT_DIR" BASE_URL="http://localhost:$NEXT_PORT" npx playwright test screenshot-capture --reporter=list
```

### 5. Upload as GitHub release assets

```bash
RELEASE_TAG="screenshots-pr-$PR_NUMBER"

# Create a draft release (so the tag doesn't pollute the repo's release list visibility)
gh release create "$RELEASE_TAG" \
  --title "Screenshots for PR #$PR_NUMBER ($FRAMEWORK)" \
  --notes "Auto-generated screenshots from rosetta-pr-screenshots for PR #$PR_NUMBER. Used by the PR body's markdown image links." \
  --target main \
  || true   # ignore "already exists" — `gh release create` is not idempotent

# Upload all PNGs
gh release upload "$RELEASE_TAG" "$OUT_DIR"/*.png --clobber

# The asset URL pattern is:
# https://github.com/<owner>/<repo>/releases/download/<tag>/<filename>
REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
ASSET_BASE="https://github.com/${REPO_FULL}/releases/download/${RELEASE_TAG}"
```

### 6. Update PR body

Fetch the current PR body, append (or replace) a `## Screenshots` section, push the update via `gh pr edit`.

```bash
CURRENT_BODY=$(gh pr view "$PR_NUMBER" --json body -q .body)

# Build the new screenshots section
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

# Strip any existing Screenshots section if present (idempotent for re-runs)
NEW_BODY=$(echo "$CURRENT_BODY" | awk '/^## Screenshots/{exit} {print}')
NEW_BODY="${NEW_BODY}${SCREENSHOTS_MD}"

gh pr edit "$PR_NUMBER" --body "$NEW_BODY"
```

### 7. Cleanup

```bash
# Kill backends but leave shared Phoenix (others may need it)
lsof -ti :$AX_PORT :$PHOENIX_PORT :$NEXT_PORT 2>/dev/null | xargs -r kill 2>/dev/null

# Clean staging dir
rm -rf "$OUT_DIR"

# Remove the screenshot-capture.spec.ts if you generated it locally and don't want it tracked
# (or commit it once and reuse for future framework runs)
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
| Safari window not frontmost during AX screencap | Another app stole focus mid-capture | Don't touch the keyboard/mouse during the run; AppleScript's `set frontmost of process "Safari" to true` should hold |
| AX session URL shows "no recent data" | `startA`/`endA` window doesn't cover the trace | Widen the time window when constructing the URL — the skill uses ±15 min by default |
| Phoenix session view empty | Framework doesn't tag spans with `session.id` | Fix the framework — `using_session(user_id)` wrap (see CrewAI's agent.py for the pattern). Same constraint as `rosetta-demo-capture`. |
| `gh release create` fails with "tag already exists" | Re-running the skill against the same PR | Safe to ignore — the `|| true` swallows it. Subsequent `gh release upload --clobber` overwrites the assets. |
| Playwright tests fail | Next.js dev server died, or the test spec couldn't find expected elements | Check `/tmp/phx-cap.log` for backend issues; verify the dev server URL responds; widen the spec's `waitForLoadState` timeout |

## Re-running

The skill is idempotent for a given PR:
- `gh release upload --clobber` overwrites existing assets
- `gh pr edit --body` replaces the existing Screenshots section (awk-based prefix strip)

Safe to re-run if any step failed mid-way.

## Integration with rosetta-add-framework-docs

When a new framework PR is created via `rosetta-add-framework-docs`, this skill is automatically invoked as the final step before the PR opens. See `rosetta-add-framework-docs/SKILL.md` for the integration point.
