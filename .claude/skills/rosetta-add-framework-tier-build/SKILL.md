---
name: rosetta-add-framework-tier-build
description: Build a single tier (no-observability, phoenix, or ax) for a new framework. Clones the closest existing tier, swaps in framework-specific agent.py / tools.py / requirements.txt, and (for observability tiers) adds tracing.py + main.py wiring + eval-harness scripts. Part of the rosetta-add-framework flow; can be invoked standalone to rebuild a single tier from scratch.
---

# Tier Build

Materialise one observability tier for a new framework, copied from a known-good source tier so non-framework code stays byte-identical.

## Inputs

- `FRAMEWORK` — slug (e.g. `google-adk`)
- `FRAMEWORK_DIR` — directory name (e.g. `google-adk-py`)
- `LANGUAGE` — `py` or `ts`
- `TIER` — `no-observability` | `phoenix` | `ax`
- `CLONE_SOURCE` — source directory to copy. Convention:
  - `no-observability` tier: copy from `no-observability/pydantic-ai-py` (simplest agent.py)
  - `phoenix` tier: copy from the framework's just-built `no-observability/<FRAMEWORK_DIR>`
  - `ax` tier: copy from the framework's just-built `no-observability/<FRAMEWORK_DIR>`
- `MODEL_OVERRIDE` (optional) — if the framework requires a Claude model other than `claude-sonnet-4-20250514`

## Steps

### 1. Clone

```bash
SRC="$CLONE_SOURCE"
DST="$TIER/$FRAMEWORK_DIR"
cp -R "$SRC" "$DST"
# Strip build artifacts that shouldn't be copied
rm -rf "$DST"/{node_modules,.next,.venv,.mypy_cache,.ruff_cache,.env.local}
find "$DST" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
```

### 2. Rename project in package.json files

```bash
python3 - <<EOF
import json
old_name = "$(basename $SRC)"
new_name = "$FRAMEWORK_DIR"
for p in ["$DST/package.json", "$DST/package-lock.json"]:
    d = json.load(open(p))
    if d.get('name') == old_name:
        d['name'] = new_name
        if 'packages' in d and '' in d['packages']:
            if d['packages'][''].get('name') == old_name:
                d['packages']['']['name'] = new_name
        json.dump(d, open(p,'w'), indent=2)
EOF
```

### 2b. Patch `next.config.ts` with the Turbopack root

**Required** for every new tier on Next.js 16+. Without this, `next dev` starts but fails on the first request with `We couldn't find the Next.js package (next/package.json) from the project directory: …/src/app`.

Reason: the repo has no top-level `package.json`, so Turbopack's workspace-root inference walks past the tier directory and gives up. Setting `turbopack.root` explicitly pins it to the tier's own directory.

If the source clone's `next.config.ts` looks like `const nextConfig: NextConfig = {};` (no turbopack config), replace with:

```ts
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
```

If the source has other config (e.g. `serverExternalPackages`), merge — don't overwrite. Saved to memory at `framework_nextjs_turbopack_root.md` for future reference.

### 3. Rewrite framework-specific files

Three files differ between frameworks. The rest stay byte-identical.

#### `backend/agent.py` (Python) or `src/<framework>/agent.ts` (TS)

Rewrite to use the new framework's Agent class, tools list, and streaming API. Key requirements:

- **System prompt** — keep the existing `SYSTEM_PROMPT` constant string verbatim from the source. The agent behavior is tested via evals; changing the prompt invalidates the comparison.
- **Tools** — import the 5 tool functions (`search_products`, `get_product_detail`, `purchase_product`, `check_order_status`, `cancel_order_tool`) from `backend.tools` and pass them to the agent however that framework expects.
- **Streaming** — preserve the SSE wire format. Each text delta becomes `data: {"text":"<chunk>"}\n\n`; sentinel is `data: [DONE]\n\n`. Inject `\n\n` between pre-tool and post-tool text (the paragraph-break trick — search existing tiers for the pattern).
- **History** — per-user dict at module scope; reset when message-history length shrinks (browser refresh). Same pattern across tiers.
- **User-id propagation** — set the `current_user_id` contextvar from the `user_id` parameter so tools can read it. Same pattern as existing tiers.
- **Anthropic model** — use `claude-sonnet-4-20250514` unless `MODEL_OVERRIDE` is set (e.g. CrewAI needed Sonnet 4.5). If overriding, add an inline comment explaining why.

#### `backend/tools.py` (Python)

Most frameworks let tools.py stay almost identical to other Python tiers' tools.py — same `@tool`-style decorator or plain functions. Differences are typically:

- The decorator import (`from <framework>.tools import tool` vs `from agent_framework import tool` etc.)
- Whether a decorator is needed at all (Pydantic AI takes plain functions)

`Annotated[Optional[T], Field(description="...")]` parameter signatures work across all major frameworks — don't rewrite them.

#### `backend/requirements.txt`

Replace the framework dep lines with the new framework's package(s). Pin the version that you tested with — beta packages have moved versions before.

For observability tiers (`phoenix`, `ax`), keep the observability deps from the source:
- Phoenix: `arize-phoenix-otel`, `openinference-instrumentation-<framework>`
- AX: `arize-otel`, `openinference-instrumentation-<framework>`

### 4. Tier-specific work

#### `no-observability` tier — nothing more to do

Skip steps 4a–4c.

#### `phoenix` tier and `ax` tier

##### 4a. Add `backend/tracing.py`

The pattern depends on the framework's OpenInference instrumentation. Two flavors seen so far:

**Simple `register()` pattern** — works for langchain, llamaindex, crewai, pydantic-ai:
```python
import os
from phoenix.otel import register  # or `from arize.otel import register` for AX
from openinference.instrumentation.<framework> import <Framework>Instrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),  # phoenix only
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-<framework>"),
    # AX variant: space_id=..., api_key=..., project_name=...
)
<Framework>Instrumentor().instrument(tracer_provider=_tracer_provider)
```

**Manual `TracerProvider` + `Resource.create({PROJECT_NAME})` pattern** — required when `register()`'s `project_name` doesn't route correctly (Microsoft Agent Framework hit this; spans landed in an auto-generated project instead). See `phoenix/microsoft-agent-py/backend/tracing.py` for the working shape.

**Pydantic AI quirk** — needs an explicit `Agent.instrument_all(InstrumentationSettings(tracer_provider=...))` call after registering. Pydantic AI doesn't emit OTel spans without it.

Test the simple pattern first. If traces land in an unexpected project (auto-generated names like `<framework>-tracing-example-NNNN`), switch to the manual pattern.

##### 4b. Update `backend/main.py`

Add one line at the top, before any other framework imports:
```python
import backend.tracing  # noqa: F401 — must be imported before <framework>
```
Also update the `FastAPI(title="...")` to mention the framework.

##### 4c. Eval-harness wiring

Observability tiers run the synthetic-requests + (Phoenix) evals harness. Three things to wire:

- Copy `package.json` `synthetic-requests` and (Phoenix only) `evals` npm scripts from the source observability tier
- Add `tsx` to `devDependencies` in `package.json`
- Replace `src/app/api/chat/route.ts` with the version from another Python observability tier — that version has the `EVAL_SECRET` bypass that lets `synthetic-requests` skip NextAuth

### 5. Lint

```bash
cd "$DST" && /Users/jimbobbennett/github/project-rosetta-stone/.venv/bin/ruff check backend/
```

Fail-fast if ruff complains — usually unused imports or missing-import errors. Fix and re-lint.

### 6. Install Python + npm deps + smoke-import

The clone stripped `node_modules` and `.venv` from the source. Both need restoring before any boot will succeed — npm in particular because `scripts/start.sh` runs `npx next dev` which fails to resolve `next/package.json` if `node_modules/` isn't populated.

```bash
# Python deps into the shared venv
VIRTUAL_ENV=/Users/jimbobbennett/github/project-rosetta-stone/.venv uv pip install -r "$DST/backend/requirements.txt" 2>&1 | tail -5

# npm deps for the Next.js frontend (required even for backend-only smoke tests
# since start.sh boots Next.js)
(cd "$DST" && npm install --silent 2>&1 | tail -3)
test -f "$DST/node_modules/next/package.json" || { echo "npm install didn't produce node_modules/next — abort"; exit 1; }

# Confirm the new framework imports cleanly
/Users/jimbobbennett/github/project-rosetta-stone/.venv/bin/python -c "
import sys; sys.path.insert(0, '$DST')
import backend.agent
print('agent module imports OK')
"
```

### 6a. Regression check — confirm no shared-venv conflict broke existing tiers

The shared `.venv` is used by every Python tier. Installing a new framework's deps can downgrade transitive packages and break tiers built earlier (this has happened — e.g. `opentelemetry-semconv` getting downgraded by one install and then breaking another's instrumentor).

Run a fast import check across every existing Python tier's `backend.agent` and fail loud if any has broken:

```bash
for tier in no-observability phoenix ax; do
  for fwk_dir in /Users/jimbobbennett/github/project-rosetta-stone/$tier/*-py/; do
    [ -d "$fwk_dir" ] || continue
    [ "$fwk_dir" = "$DST/" ] && continue
    fwk_name=$(basename "$fwk_dir")
    /Users/jimbobbennett/github/project-rosetta-stone/.venv/bin/python -c "
import sys; sys.path.insert(0, '$fwk_dir')
try:
    import backend.agent
except Exception as e:
    print(f'  BROKEN $tier/$fwk_name — {type(e).__name__}: {e}')
    sys.exit(1)
" || { echo "DEP CONFLICT — abort and trigger rollback (see orchestrator's Failure isolation section)"; exit 1; }
  done
done
echo "regression check: all existing Python tiers still import cleanly"
```

If this fails, the orchestrator should mark the new framework as `[!]` with reason `dep-conflict` and run the rollback procedure documented in `rosetta-add-framework/SKILL.md` under "Failure isolation".

### 7. Copy `.env.local`

If a sibling `.env.local` exists in the same tier (e.g. `ax/pydantic-ai-py/.env.local`), copy it as a starting point and update only the project name:

```bash
SIBLING=$(ls $TIER/*-py/.env.local 2>/dev/null | head -1)
[ -n "$SIBLING" ] && cp "$SIBLING" "$DST/.env.local"
# For AX: sed s/^ARIZE_PROJECT_NAME=.*/ARIZE_PROJECT_NAME=wonder-toys-<framework>/
# For Phoenix: sed s/^PHOENIX_PROJECT_NAME=.*/PHOENIX_PROJECT_NAME=wonder-toys-<framework>/
# Then remove any stale EVAL_SECRET so the synthetic-requests harness can mint a fresh one
sed -i.bak '/^EVAL_SECRET=/d' "$DST/.env.local" && rm -f "$DST/.env.local.bak"
```

## Output

```
TIER_BUILT: <TIER>/<FRAMEWORK_DIR>
  source: <CLONE_SOURCE>
  files rewritten: backend/agent.py, backend/tools.py, backend/requirements.txt
  tracing: <yes|no>  pattern: <register | manual-tracer-provider | n/a>
  model: <model-name>
  lint: pass
```
