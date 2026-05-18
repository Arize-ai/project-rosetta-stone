---
name: rosetta-test-cleanup
description: Tear down a Rosetta Stone test project — deletes the platform project on Arize AX or Phoenix, removes the .env.test-local overlay, and kills any leftover dev server / ChromaDB processes started by the run. Idempotent and safe to call multiple times. Use the --keep flag at the orchestrator level to skip this entirely. Part of the rosetta-test e2e flow; can also be invoked standalone to clean up after a crashed run.
---

# Rosetta Test — Cleanup Phase

Removes everything the e2e run created so the repo is back to its initial state.

## Inputs

- `PROJECT_NAME` — the test project to delete
- `PLATFORM` — `ax` or `phoenix`
- `PROJECT_DIR` — absolute path to `<platform>/<framework>/` (for the env overlay)
- For AX: `ARIZE_SPACE_ID`
- For Phoenix: `PHOENIX_API_KEY`, `PHOENIX_COLLECTOR_ENDPOINT`

## Guard rails

Before deleting anything, sanity-check that `$PROJECT_NAME` begins with `rosetta-e2e-`. If it doesn't, **abort** — never delete a project this skill didn't create:

```bash
case "$PROJECT_NAME" in
  rosetta-e2e-*) ;;
  *) echo "Refusing to delete non-rosetta-e2e project: $PROJECT_NAME"; exit 1 ;;
esac
```

## Steps

### 1. Delete the platform project

**AX:**

```bash
ax projects delete "$PROJECT_NAME" --space "$ARIZE_SPACE_ID" --force
```

`--force` skips the confirmation prompt.

**Phoenix:**

```bash
PHOENIX_BASE_URL="${PHOENIX_COLLECTOR_ENDPOINT%/v1/traces}"
curl -sS -X DELETE \
  -H "Authorization: Bearer $PHOENIX_API_KEY" \
  "$PHOENIX_BASE_URL/v1/projects/$PROJECT_NAME"
```

Phoenix's API accepts either project ID or name. Treat a 404 as success — the project may not have been created yet if traces never landed.

### 2. Remove the env overlay

```bash
rm -f "$PROJECT_DIR/.env.test-local"
```

Don't touch `.env.local` — it was never modified.

### 3. Best-effort process cleanup

The trace harness scripts install their own EXIT traps that kill background `npm run dev` and `chroma run` processes when they exit. If the harness was interrupted mid-run, those might survive. Probe and clean up:

```bash
# Next.js dev servers on port 3000
lsof -ti :3000 | xargs -r kill 2>/dev/null

# Python backend on port 8001
lsof -ti :8001 | xargs -r kill 2>/dev/null

# ChromaDB is shared across the whole repo — only kill it if started by this run.
# Safest: leave it. Subsequent runs reuse it via the heartbeat check in start.sh.
```

Skip the kills if `lsof` isn't installed; this is best-effort cleanup, not core to the contract.

### 4. Do NOT delete the shared evaluators

The space-level `rosetta-e2e-*` evaluators are intentionally kept — they're reused across every test run and creating them each time would waste cycles. The eval task tied to this run's project is auto-removed when the project is deleted.

## Idempotency

- Project already deleted → AX returns an error, Phoenix returns 404. Both are fine.
- Env overlay missing → `rm -f` is silent.
- No processes on the ports → `kill` no-ops.

Always exit 0 if the project is confirmed absent at the end, even if individual steps complained. Surface any unexpected errors but don't fail the whole cleanup over them.

## Output

```
Cleanup: <PROJECT_NAME>
  Project deleted:  yes | already gone | FAILED (<error>)
  Env overlay:      removed | absent
  Stray processes:  killed N | none
```
