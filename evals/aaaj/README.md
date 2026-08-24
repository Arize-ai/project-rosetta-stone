# Agent-as-a-Judge (AaaJ) examples

These scoring instructions are for **Arize AX Agent-as-a-Judge** tasks on the Wonder Toys shopping agent. They complement the six LLM-as-a-Judge / code evaluators in [`evals/README.md`](../README.md).

**Preferred path:** invoke the `rosetta-aaaj` skill (`.claude/skills/rosetta-aaaj/SKILL.md`). It reads the files in this directory and creates evaluators + tasks via GraphQL (`POST /graphql` + API key). `ax` / REST cannot create harness evals. UI steps below are the fallback if GraphQL is blocked (non-enterprise, missing `enableManagedAgents`, or no Anthropic integration).

LLM-as-a-Judge maps `{input}` / `{output}` and scores one row per call. Agent-as-a-Judge runs a Claude Code sandbox that **exports the trace and inspects TOOL / LLM / CHAIN spans before scoring**, so it can catch trajectory failures that never show up in the final message.

Use them on `ax/langchain-py` first: that tier already has OpenInference LangChain instrumentation, so synthetic requests produce the CHAIN → LLM → TOOL tree the judge needs.

AaaJ is AX-only (requires the Agent-as-a-Judge / managed-agents feature). Phoenix keeps the programmatic six-eval harness.

## When to use these vs the six template evals

| Failure mode | Template LLM judge | Agent-as-a-Judge |
|---|---|---|
| Final answer ignores the user | Correctness | Trajectory task completion |
| Wrong tool chosen (visible in mapped `tools_used`) | Tool Selection | Trajectory task completion |
| Answer contradicts a tool result you mapped in | Tool Response Handling | Tool-result grounding |
| Plausible answer built on an empty/error tool call | Often missed | Trajectory + grounding |
| Stuck loop / identical retries | Tool Call Count (count only) | Trajectory task completion |
| Purchase without address / cancel delivered order | Missed if output looks polite | Purchase & cancel protocol |
| Hallucinated product id not in any TOOL output | Often missed | Tool-result grounding |

## Prerequisites

1. Anthropic AI integration in the AX space (AaaJ sandboxes are Anthropic / Claude Code only).
2. Traces in an AX project. For LangChain Python:

   ```bash
   cd ax/langchain-py
   cp env.example .env.local   # ARIZE_SPACE_ID, ARIZE_API_KEY, ARIZE_PROJECT_NAME, ANTHROPIC_API_KEY, EVAL_SECRET
   npm install
   npm run synthetic-requests  # 25 Wonder Toys traces into the AX project
   ```

   Default project name: `wonder-toys-langchain-py` (see `backend/tracing.py`).

   If Next.js is already running, it must already have the same `EVAL_SECRET` as `.env.local`. Otherwise stop it and let `npm run synthetic-requests` start the app so traces are tagged `eval-user-001` instead of `anonymous`.

3. In AX, confirm traces show OpenInference span kinds (`CHAIN` / `AGENT`, `LLM`, `TOOL`) with tool name, input, and output on TOOL spans. Root `attributes.input.value` should start with the unique user query (the user-id note is appended to that same human message).

## Create an evaluator in AX (UI fallback)

Repeat for each file in this directory (`trajectory-task-completion.md`, `tool-result-grounding.md`, `purchase-cancel-protocol.md`).

1. **Evaluators** → **New Evaluator** (or **New Eval Task** → **Agent-as-a-Judge** → **Create From Blank**)
2. Name / column name: see the table below
3. Harness: **Claude Code**
4. Model: an Anthropic integration (or Auto)
5. Paste the file contents into **Scoring Instructions**
6. Turn **Let agent decide labels** off and set the classification choices listed below
7. Optimization direction: **maximize**
8. Save the evaluator

The scoring text says "this trace" / "end-to-end" so the sandbox judges at **trace** granularity (one verdict on the root span).

No column mapping is required. The judge exports spans at run time and reads TOOL outputs itself. Optional `{input}` / `{output}` placeholders are unused in these examples on purpose.

## Attach to a project task

1. **Eval Tasks** → **New Eval Task** → **Agent-as-a-Judge**
2. Pick the `wonder-toys-langchain-py` project (or whatever `ARIZE_PROJECT_NAME` you used)
3. Attach **one** AaaJ evaluator (AX Agent-as-a-Judge tasks support a single evaluator)
4. Clear any span-kind query filter so the sandbox sees the full tree (do not restrict to `LLM` only)
5. Enable a one-time backfill over the synthetic-request window, create the task, and run it

Create a separate task per example evaluator if you want all three scores on the same traces.

## Example evaluators

| File | Evaluator / column name | Labels (score) | What it catches |
|---|---|---|---|
| [`trajectory-task-completion.md`](./trajectory-task-completion.md) | `aaaj_trajectory_completion` | `pass` (1), `fail` (0) | Missing tools, bad args, loops, unrecovered tool errors |
| [`tool-result-grounding.md`](./tool-result-grounding.md) | `aaaj_tool_grounding` | `grounded` (1), `ungrounded` (0), `not_applicable` (0.5) | Facts in the reply that never appeared in TOOL outputs |
| [`purchase-cancel-protocol.md`](./purchase-cancel-protocol.md) | `aaaj_purchase_cancel` | `safe` (1), `unsafe` (0), `not_applicable` (0.5) | Checkout/cancel without confirmation or with bad tool args |

Results land as `trace_eval.<column>.label` / `.score` / `.explanation` on the root span.

## LangChain Python span hints

On `ax/langchain-py`, OpenInference LangChain instrumentation typically emits:

- A root agent/chain span whose `attributes.input.value` is the LangGraph `{ messages: [...] }` payload (first human message is the user query) and `attributes.output.value` is the final reply. The 25 distinct prompts also appear on child `LLM` `llm.input_messages` and on `TOOL` span inputs.
- Nested `LLM` spans for Claude turns
- Nested `TOOL` spans named `search-products`, `get-product`, `purchase-product`, `check-order-status`, `cancel-order`

If a backfill scores 0 traces, the query filter is usually too tight (for example `span_kind = 'LLM'`). AaaJ needs the whole trace.
