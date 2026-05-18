---
name: rosetta-test-verify
description: Verify a Rosetta Stone test project has 25 traces and every trace has every expected eval annotation. Presence-only check — eval scores are not inspected. Reports a per-trace coverage matrix and pass/fail. Part of the rosetta-test e2e flow; can also be invoked standalone after evals have completed.
---

# Rosetta Test — Verify Phase

Confirms the eval run actually annotated every trace. Score values are irrelevant — only the *presence* of each expected annotation matters.

## Inputs

- `PROJECT_NAME` — the test project
- `PLATFORM` — `ax` or `phoenix`
- `EXPECTED_EVALS` — list of evaluator names that should be present on every trace. Source:
  - **Phoenix**: the harness always writes these 6 annotation names: `correctness`, `tool_selection`, `tool_response_handling`, `format_compliance`, `image_url_correctness`, `tool_call_count`.
  - **AX**: the `RAN_EVALUATOR=` lines emitted by the evals phase (may be 4 or 6 depending on whether the two code evaluators have been manually provisioned in the space).
- For AX: `ARIZE_SPACE_ID`
- For Phoenix: `PHOENIX_API_KEY`, `PHOENIX_COLLECTOR_ENDPOINT`

## Success criteria

1. Exactly 25 root traces in the project.
2. Every root trace has every name in `EXPECTED_EVALS` attached as an annotation.

Conditional annotations are **still expected**: per `evals/README.md`, `tool_response_handling` is `not_applicable` when no tools were called, and `format_compliance` is `not_applicable` for non-product responses. These are values, not absences — the annotation row must still exist. (Phoenix's `tool_response_handling` is the only legitimate exception: the harness skips logging when `toolCallCount === 0`. Treat that one as expected-on-trace-with-tools-only, not as required on every trace.)

## AX path

### 1. List root traces

```bash
ax traces list "$PROJECT_NAME" \
  --space "$ARIZE_SPACE_ID" \
  --output json \
  --limit 100 \
  > /tmp/rosetta-traces.json
```

Count: `jq 'length' /tmp/rosetta-traces.json` — must be ≥ 25. If > 25, the project picked up stray traffic; record but don't fail (the test traces are still there).

### 2. Export annotations per trace

The fastest path is `ax spans export` with a filter that pulls all root spans for the project, then inspecting each span's annotation attributes. Consult the `arize-trace` skill for the current export schema — span annotation field paths have shifted in the past.

For each root trace ID, build the set of annotation names present and diff against `EXPECTED_EVALS`.

### 3. Build the coverage report

```
Trace ID                                    Missing evals
abc123...                                   (none)
def456...                                   rosetta-e2e-format-compliance
...
Total: 25 traces, 23 fully evaluated, 2 with gaps
```

## Phoenix path

### 1. Resolve the base URL

`PHOENIX_BASE_URL=${PHOENIX_COLLECTOR_ENDPOINT%/v1/traces}` (or just `$PHOENIX_COLLECTOR_ENDPOINT` if it already lacks the suffix — handle both for Python tiers).

### 2. Pull spans + annotations

The Phoenix client TypeScript SDK is installed in every phoenix tier's `node_modules`. Easiest approach is a small inline `tsx` snippet:

```ts
import { createClient } from "@arizeai/phoenix-client";
import { getSpans, getSpanAnnotations } from "@arizeai/phoenix-client/spans";

const client = createClient({
  options: {
    baseUrl: process.env.PHOENIX_BASE_URL!,
    headers: { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` },
  },
});

const { spans } = await getSpans({
  client,
  project: { projectName: process.env.PHOENIX_PROJECT_NAME! },
  limit: 500,
});
const roots = spans.filter((s: any) => !s.parent_id);

// getSpanAnnotations returns annotations per span ID; batch as needed.
```

Run from any `phoenix/<framework>/` directory so the deps resolve, or from `evals/` (where the harness's own `node_modules` lives).

### 3. Build the coverage report

Same shape as AX. Conditional exception: `tool_response_handling` is only expected on traces where ≥1 tool span exists in that trace. Determine this from the spans you already pulled (a span with `openinference.span.kind === "TOOL"` or any other detection used in `evals/run-phoenix-evals.ts`).

## Output

```
Verify: <PROJECT_NAME> on <PLATFORM>
  Root traces:        <count> / 25
  Expected evals:     <names>
  Fully evaluated:    <count>
  With gaps:          <count>
  <if any gaps>
  Gaps:
    <trace-id>: missing <eval-names>
    ...
  Result: PASS | FAIL
```

PASS requires 25 traces AND 0 gaps (modulo the `tool_response_handling` conditional). Otherwise FAIL.

The orchestrator uses this result to set the overall run status but always proceeds to cleanup regardless (unless `--keep`).
