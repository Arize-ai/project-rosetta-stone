---
name: rosetta-test-evals
description: Run the 6 Wonder Toys evals against a Rosetta Stone test project. Phoenix path runs the built-in `npm run evals` script. AX path ensures the stable space-level rosetta-e2e-* evaluators exist (creating only missing ones from the templates in evals/README.md), then creates and triggers a per-run eval task scoped to the project. Part of the rosetta-test e2e flow; can also be invoked standalone.
---

# Rosetta Test — Evals Phase

## Inputs

- `PROJECT_DIR` — absolute path to `<platform>/<framework>/`
- `PROJECT_NAME` — the test project name
- `PLATFORM` — `ax` or `phoenix`
- For AX: `ARIZE_SPACE_ID` already sourced from `.env.local`

## Phoenix path

Phoenix evals are already programmatic via the shared harness — just run them with the env overlay loaded:

```bash
(
  set -a
  source "$PROJECT_DIR/.env.local"
  source "$PROJECT_DIR/.env.test-local"
  set +a
  cd "$PROJECT_DIR" && npm run evals
)
```

The harness (`evals/run-phoenix-evals.ts`) fetches root spans from the project, runs all 6 evaluators, and writes results back as span annotations. It uses `PHOENIX_PROJECT_NAME` from the env, so the overlay routes it to the test project automatically.

Done — proceed to verify.

## AX path

AX has no programmatic eval runner of its own — the rosetta-test flow drives the `ax` CLI directly.

### 1. Define the stable evaluator set

These six evaluators live at **space level** and are reused across every rosetta-e2e run. Names use a `rosetta-e2e-` prefix so they're easy to find in the UI and never collide with the user's other evaluators.

| Stable name | Type | Source of truth for config |
|---|---|---|
| `rosetta-e2e-correctness` | LLM (classification) | `evals/README.md` § Eval 1 |
| `rosetta-e2e-tool-selection` | LLM (classification) | `evals/README.md` § Eval 2 |
| `rosetta-e2e-tool-response-handling` | LLM (classification) | `evals/README.md` § Eval 3 |
| `rosetta-e2e-format-compliance` | LLM (classification) | `evals/README.md` § Eval 4 |
| `rosetta-e2e-image-url-correctness` | Code | `evals/README.md` § Eval 5 |
| `rosetta-e2e-tool-call-count` | Code | `evals/README.md` § Eval 6 |

All scoped to **trace** granularity.

### 2. Discover what already exists

```bash
ax evaluators list --space "$ARIZE_SPACE_ID" --output json \
  | jq -r '.[] | select(.name | startswith("rosetta-e2e-")) | "\(.name)\t\(.id)"'
```

Build a map `{name → id}` of the ones that already exist. Anything missing from the table above gets created in step 3.

### 3. Create the missing LLM evaluators

For each missing **LLM** evaluator, use `ax evaluators create` with the prompt template, classification choices, and trace granularity from `evals/README.md`. Consult the `arize-evaluator` skill for the exact flag combinations and AI integration ID resolution.

Required flags include `--name`, `--space`, `--commit-message`, `--template-name`, `--template`, `--ai-integration-id`, `--model-name`, `--classification-choices`, `--data-granularity trace`, `--include-explanations`.

Use Claude Sonnet via an Anthropic AI integration if one exists in the space; otherwise default to GPT-4o via OpenAI. List integrations:

```bash
ax ai-integrations list --space "$ARIZE_SPACE_ID" --output json
```

### 4. Handle the code evaluators

The `ax evaluators create` CLI only supports LLM (template-based) evaluators. The two code evaluators (`rosetta-e2e-image-url-correctness`, `rosetta-e2e-tool-call-count`) must be created **once** manually via the AX console using the Python code in `evals/README.md` §§ Eval 5 and Eval 6 — they then persist across runs.

On a run where one or both code evaluators are missing from the space, print a clear warning:

```
WARNING: code evaluator "<name>" not found in space.
  Create it once via the AX console using the Python code in evals/README.md.
  This run will proceed with the remaining N evaluators only.
```

Continue with whatever evaluators *do* exist. The verify phase will receive the actual list and only check coverage for those.

### 5. Build the column mappings

Per `evals/README.md`, the LLM evaluators map prompt template variables to span attributes. The mappings are evaluator-specific:

- `correctness` — `input → attributes.input.value`, `output → attributes.output.value`, `tools_used → attributes.tool.name`
- `tool_selection` — `input → attributes.input.value`, `output → attributes.output.value`
- `tool_response_handling` — same as `tool_selection`
- `format_compliance` — same as `tool_selection`
- Code evaluators read `attributes.input.value` and/or `attributes.output.value`; mappings are configured at evaluator creation time, not at task time.

### 6. Create and trigger the per-run task

One task per project, referencing every evaluator that exists. Task name mirrors the project name so it's easy to find:

```bash
TASK_NAME="rosetta-e2e-${PROJECT_NAME#rosetta-e2e-}"

# Build the evaluators JSON dynamically from the map of existing evaluator IDs.
# Each entry: { "evaluator_id": "<base64-id>", "column_mappings": { ... } }

ax tasks create \
  --name "$TASK_NAME" \
  --project "$PROJECT_NAME" \
  --space "$ARIZE_SPACE_ID" \
  --evaluators "$EVALUATORS_JSON" \
  --no-continuous \
  --output json
```

Capture the returned task ID, then:

```bash
ax tasks trigger-run --wait "$TASK_ID" --poll-interval 5 --timeout 900
```

`--wait` blocks until the run reaches a terminal state. 900s = 15 minutes; the 25 traces × 4 evaluators should finish well inside that.

### 7. Emit the list of evaluators that ran

Print one evaluator name per line, prefixed `RAN_EVALUATOR=`, so the verify phase knows exactly which annotations to expect:

```
RAN_EVALUATOR=rosetta-e2e-correctness
RAN_EVALUATOR=rosetta-e2e-tool-selection
...
```

This makes the verify check correct even when code evaluators are missing.

## Failure modes

- Task run terminates as `failed` → surface the run's error_summary (`ax tasks get-run <id>`). Do not proceed to verify; the cleanup phase still runs.
- Task run `cancelled` or times out → same handling.
- Evaluator creation fails (e.g. invalid AI integration ID) → abort; user needs to fix space config.
