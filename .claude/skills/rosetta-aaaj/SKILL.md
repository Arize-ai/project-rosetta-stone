---
name: rosetta-aaaj
description: Attach Agent-as-a-Judge (AaaJ / harness) evaluators to any Arize AX Wonder Toys project and trigger a one-time backfill. Reads scoring instructions from evals/aaaj/*.md and creates evaluators + tasks via GraphQL (REST and the ax CLI cannot create harness evals). Use when the user asks to add AaaJ, agent-as-a-judge, harness evals, or to score AX traces without the UI. AX-only; not part of rosetta-test e2e. Default PROJECT_DIR is ax/langchain-py; any ax/<framework> with .env.local works.
---

# Rosetta — Agent-as-a-Judge

Create (or reuse) three space-level harness evaluators, attach one project task per evaluator on **this** AX project's `modelId`, and trigger a backfill. Do **not** use `ax evaluators create` or `ax tasks create` — those only support TEMPLATE / CODE. Do **not** POST to `/api/graphql/v1` (cookie / session UI schema).

There is no committed runner script. Follow this file exactly.

## Inputs

- `PROJECT_DIR` — default: repo `ax/langchain-py`. **Any** `ax/<framework>` with `.env.local` works (`ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`). Phoenix and `no-observability` are out of scope.
- From `$PROJECT_DIR/.env.local` (never print values): `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME` (required — each tier's `env.example` has its own default, e.g. `wonder-toys-langchain-py` for langchain-py). Do not hardcode a project name.
- Optional: `ARIZE_GRAPHQL_URL` (default `https://app.arize.com/graphql`)

Phoenix is out of scope. If the user is on `phoenix/<framework>` (or `no-observability/`), stop and say AaaJ is AX-only.

Traces must already exist in that project's `ARIZE_PROJECT_NAME`. Typically `npm run synthetic-requests` in `$PROJECT_DIR` (most AX apps already have this script). If they do not, run synthetic requests first (and keep `EVAL_SECRET` in `.env.local` so Next.js tags `eval-user-001`).

## Stable names

Source of truth for scoring text is the markdown files — `cat` them into `harnessEvaluator.template`. Do not rewrite the rubrics.

Evaluators are **space-level** (one set of three, reused across frameworks). Tasks are **per AX project** (`modelId`).

| Evaluator display name | Column (`harnessEvaluator.name`) | Rubric file | Labels (score) |
|---|---|---|---|
| `rosetta-aaaj-trajectory-completion` | `aaaj_trajectory_completion` | `evals/aaaj/trajectory-task-completion.md` | `pass` 1, `fail` 0 |
| `rosetta-aaaj-tool-grounding` | `aaaj_tool_grounding` | `evals/aaaj/tool-result-grounding.md` | `grounded` 1, `ungrounded` 0, `not_applicable` 0.5 |
| `rosetta-aaaj-purchase-cancel` | `aaaj_purchase_cancel` | `evals/aaaj/purchase-cancel-protocol.md` | `safe` 1, `unsafe` 0, `not_applicable` 0.5 |

Matching **task** names (one evaluator per task):

- `rosetta-aaaj-trajectory-completion`
- `rosetta-aaaj-tool-grounding`
- `rosetta-aaaj-purchase-cancel`

Idempotency: reuse an evaluator if the space already has that **display name** or the older ad-hoc names `aaaj_trajectory_completion` / `aaaj_tool_grounding` / `aaaj_purchase_cancel`. Reuse a task if one with the stable name already exists **on this project/model**. Same display names across projects are OK — tasks are per `modelId`. Still trigger `runOnlineTask` unless the user asked create-only.

If looping **multiple** `ax/<framework>` dirs: reuse the three evaluators; create or reuse the three tasks on each project's `modelId`; trigger `runOnlineTask` per task.

`strictChoices: true`, `direction: maximize` on every evaluator.

## Endpoint

```http
POST https://app.arize.com/graphql
Content-Type: application/json
x-api-key: $ARIZE_API_KEY
Origin: https://app.arize.com
```

Never print `ARIZE_API_KEY`. Use curl + env vars. `$ARIZE_SPACE_ID` is already a Space Relay GID (`U3BhY2U6…`).

Helper:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT_DIR="${PROJECT_DIR:-$REPO_ROOT/ax/langchain-py}"
set -a
# shellcheck disable=SC1091
source "$PROJECT_DIR/.env.local"
set +a
: "${ARIZE_SPACE_ID:?}" "${ARIZE_API_KEY:?}" "${ARIZE_PROJECT_NAME:?set ARIZE_PROJECT_NAME in $PROJECT_DIR/.env.local}"
GQL="${ARIZE_GRAPHQL_URL:-https://app.arize.com/graphql}"

gql() {
  curl -sS "$GQL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ARIZE_API_KEY" \
    -H "Origin: https://app.arize.com" \
    --data-binary @-
}
```

If a mutation returns `GraphQL Mutation access is only available for enterprise accounts`, or a permissions error, stop. Point the user at the UI fallback in `evals/aaaj/README.md`.

## Step 1 — Resolve integration + project

```graphql
query ($spaceId: ID!, $projectName: String!) {
  node(id: $spaceId) {
    ... on Space {
      llmIntegrations { id name provider hasApiKey }
      models(first: 20, search: $projectName, useExactSearchMatch: true) {
        edges { node { id name } }
      }
    }
  }
}
```

Variables: `{ "spaceId": "<ARIZE_SPACE_ID>", "projectName": "<ARIZE_PROJECT_NAME>" }`.

Pick the first Anthropic integration with `hasApiKey` (`provider` case-insensitive `anthropic`). Abort if none.

Take the model whose `name` equals `ARIZE_PROJECT_NAME`. Abort if missing — traces may not have created the project yet.

`enableManagedAgents` is **not** required to create evaluators. It **is** required to create harness tasks; if `createEvalTask` fails with a managed-agents / feature-flag error, stop and use the UI fallback.

## Step 2 — List existing evaluators

Use whatever list query works on this schema (for example Space evaluators connection, or `ax evaluators list --space "$ARIZE_SPACE_ID" -o json` for names/ids only). Build `{displayName → evaluatorId}`.

Treat these as already created for the three slots:

- `rosetta-aaaj-trajectory-completion` or `aaaj_trajectory_completion`
- `rosetta-aaaj-tool-grounding` or `aaaj_tool_grounding`
- `rosetta-aaaj-purchase-cancel` or `aaaj_purchase_cancel`

## Step 3 — Create missing evaluators

```graphql
mutation CreateAaaJ($input: CreateEvaluatorMutationInput!) {
  createEvaluator(input: $input) {
    evaluator { id name taskType }
  }
}
```

```json
{
  "input": {
    "spaceId": "<ARIZE_SPACE_ID>",
    "name": "rosetta-aaaj-trajectory-completion",
    "description": "Wonder Toys AaaJ trajectory task completion",
    "commitMessage": "Initial version",
    "harnessEvaluator": {
      "llmIntegrationId": "<Anthropic LlmIntegration GID>",
      "name": "aaaj_trajectory_completion",
      "template": "<full contents of evals/aaaj/trajectory-task-completion.md>",
      "classificationChoices": { "pass": 1, "fail": 0 },
      "strictChoices": true,
      "direction": "maximize"
    }
  }
}
```

Repeat for grounding and purchase-cancel with the table above. JSON-escape the template (newlines as `\n`). Top-level `name` is the hub display name; `harnessEvaluator.name` is the eval column (`trace_eval.<column>.*`).

## Step 4 — Create missing tasks

One evaluator per task. `queryFilter` must be JSON `null` (not `span_kind = 'LLM'`).

```graphql
mutation CreateAaaJTask($input: CreateEvalTaskMutationInput!) {
  createEvalTask(input: $input) {
    evalTask { id name }
  }
}
```

```json
{
  "input": {
    "name": "rosetta-aaaj-trajectory-completion",
    "modelId": "<Model Relay GID>",
    "samplingRate": 1,
    "runContinuously": false,
    "queryFilter": null,
    "evaluators": [
      { "evaluatorId": "<Evaluator Relay GID>", "position": 0 }
    ]
  }
}
```

If a task with that name already exists on this project, reuse its id.

## Step 5 — Trigger runs

Window: UTC midnight yesterday through now, span ≤ 30 days. Example: `dataStartTime` `2026-08-19T00:00:00.000Z`, `dataEndTime` now with `Z`. `maxSpans`: 200. `overrideEvaluations`: false.

```graphql
mutation RunAaaJ($input: RunOnlineTaskMutationInput!) {
  runOnlineTask(input: $input) {
    result { __typename }
  }
}
```

```json
{
  "input": {
    "onlineTaskId": "<OnlineTask Relay GID>",
    "dataStartTime": "<ISO8601 Z>",
    "dataEndTime": "<ISO8601 Z>",
    "maxSpans": 200,
    "overrideEvaluations": false
  }
}
```

Call once per task. Do **not** wait for sandbox completion unless the user asks. Print display names + Relay ids for evaluators, tasks, and runs.

Tell the user scores appear as `trace_eval.aaaj_trajectory_completion.label` (and the other two columns) on **root** spans when the harness runs finish.

## Output

```
AaaJ: <ARIZE_PROJECT_NAME>
  Evaluators: created|reused × 3
  Tasks:      created|reused × 3
  Runs:       triggered × 3
  Scores:     trace_eval.aaaj_*.{label,score,explanation} on root spans
```

## UI fallback

If GraphQL is blocked, the user pastes the same three `.md` files in AX:

1. Evaluators → Agent-as-a-Judge → Create From Blank
2. Scoring instructions = file contents; lock the labels from the table; maximize
3. New Eval Task → Agent-as-a-Judge → this project, one evaluator, empty query filter, one-time backfill

Full click-path: `evals/aaaj/README.md`.

## What not to do

- Do not call this from `rosetta-test` / `rosetta-test-evals` (sandbox time + `enableManagedAgents`)
- Do not mix TEMPLATE evaluators onto a harness task
- Do not print API keys, integration secrets, or `.env.local`
- Do not clone evaluators per framework — they stay space-level
