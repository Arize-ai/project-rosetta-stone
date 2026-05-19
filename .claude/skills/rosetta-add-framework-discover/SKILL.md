---
name: rosetta-add-framework-discover
description: Refresh the list of agent frameworks supported by Arize tracing and diff against what's already in the repo. Pulls live data from https://arize.com/docs/llms.txt and produces a clean to-do list. Part of the rosetta-add-framework flow; can also be invoked standalone to answer "what frameworks are left to add?"
---

# Discover — refresh + diff

Fetches the live list of agent-framework integrations from Arize's docs index, diffs against the repo, and prints what's left.

## Steps

### 1. Fetch live list

```bash
# Use WebFetch on https://arize.com/docs/llms.txt with this prompt:
#   "From this index, list every page whose path includes
#    'python-agent-frameworks' or 'ts-js-agent-frameworks'. Group by
#    language. Output one slug per line."
```

The slug is the directory segment in the URL (e.g. `crewai`, `langchain`, `pydantic`, `google-adk`).

### 2. Diff against repo

```bash
cd /Users/jimbobbennett/github/project-rosetta-stone
# Existing framework directories under ax/ (canonical — all 3 tiers stay in sync)
ls -d ax/*-py/ ax/*-js/ ax/*-ts/ ax/mastra/ ax/vercel-ai-sdk/ 2>/dev/null \
  | xargs -n1 basename \
  | sed -E 's/-py$|-js$|-ts$//' \
  > /tmp/rosetta-existing
# Compare against the slug list from step 1
```

### 3. Categorise

Map each Arize slug to one of:
- **Implemented** (`[x]`) — in `/tmp/rosetta-existing`
- **Skipped on principle** (`[~]`) — viability gate decided not to build (e.g. voice-only, no Anthropic). The reason is appended after the framework name in the orchestrator's TODO. Preserve these markers — don't reset them to `[ ]`.
- **Failed previously** (`[!]`) — last build attempt broke. The orchestrator may retry on a future run; preserve the marker until the failure is resolved.
- **Tier A — clear agent frameworks** (`[ ]`) — recommended for the repo (CrewAI, Pydantic AI, LangChain, LlamaIndex, etc.)
- **Borderline** — utility libraries / wire protocols / LLM providers that don't fit the "build an agent" comparison goal (Guardrails AI, Instructor, MCP, Portkey, Together AI). The borderline set is hardcoded — these need a per-framework decision and shouldn't auto-be added.

When refreshing the TODO snapshot (step 5 below), **preserve** existing `[x]`, `[~]`, and `[!]` markers verbatim — including the reason text after them. Only flip newly-implemented frameworks from `[ ]` to `[x]`.

### 4. Output

Print a checklist:

```
Frameworks left to add:

Python (Tier A):
  [ ] agno              https://arize.com/docs/ax/integrations/python-agent-frameworks/agno/agno-tracing
  [ ] autogen           https://arize.com/docs/ax/integrations/python-agent-frameworks/autogen/autogen-tracing
  [x] crewai            (in repo as crewai-py)
  ...

TypeScript (Tier A):
  [ ] beeai             https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/beeai/beeai-tracing-js
  ...

Borderline (decide before building):
  [ ] guardrails-ai     (output validation)
  ...
```

### 5. Update the embedded TODO

If the orchestrator's TODO snapshot is more than a week stale OR if the diff surfaces new frameworks Arize added, edit `.claude/skills/rosetta-add-framework/SKILL.md` and refresh the "## TODO" section + the "last refreshed" date.

## Output for downstream phases

If called from the orchestrator with a target framework, also emit:

```
TARGET: <framework>
TARGET_STATUS: not-implemented | already-implemented | not-supported-by-arize | borderline
TARGET_DOCS: <full URL to the Arize tracing doc>
```

If status is anything other than `not-implemented`, the orchestrator should abort.
