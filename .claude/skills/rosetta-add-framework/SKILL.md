---
name: rosetta-add-framework
description: Add a new agent framework to the Rosetta Stone repo — researches the framework, builds all three observability tiers (no-observability, phoenix, ax), tests each, runs a Playwright smoke against the UI, updates README + TODO, and raises a PR. Trigger when the user asks to "add the <framework> framework", "implement <framework>", "wire up <framework>", or similar. The framework must be one of the Arize-supported agent frameworks (see TODO below).
---

# Rosetta — Add Framework Orchestrator

End-to-end workflow for bringing a new agent framework into the repo. Mirrors the existing structure: every new framework gets a `no-observability/<framework>-py/` (or `-ts/`) directory, a `phoenix/<framework>-py/` directory, and an `ax/<framework>-py/` directory, each running an identical Wonder Toys shopping agent.

## Inputs

- `<framework>` — framework name in the form used by directory naming, e.g. `agno`, `google-adk`, `smolagents`, `crewai`. Use the slug from Arize's docs (`https://arize.com/docs/ax/integrations/python-agent-frameworks/<slug>/<slug>-tracing`).
- `<language>` — `py` for Python, `js`/`ts` for TypeScript. Affects which existing tier is used as the clone source.
- `--start-from <phase>` (optional) — resume from `discover` | `research` | `build-noobs` | `build-phoenix` | `build-ax` | `playwright` | `docs`. Useful when a phase fails mid-flow.

## TODO — frameworks not yet implemented

Snapshot (last refreshed 2026-05-18 from `https://arize.com/docs/llms.txt`). Each phase-1 `discover` run re-fetches and shows the diff.

### Python (Tier A — clear agent frameworks)
- [ ] Agno
- [ ] AutoGen
- [ ] AWS Strands
- [x] CrewAI
- [ ] DSPy
- [x] Google ADK
- [ ] Haystack
- [ ] LlamaIndex Workflows
- [ ] Pipecat
- [x] Pydantic AI
- [ ] Semantic Kernel
- [ ] Smolagents (Hugging Face)
- [ ] BeeAI

### TypeScript (Tier A)
- [ ] BeeAI

### Borderline — decide before building
- [ ] Guardrails AI (output validation)
- [ ] Instructor (structured output)
- [ ] MCP / Model Context Protocol (wire protocol)
- [ ] Portkey (LLM gateway)
- [ ] Together AI (LLM provider)

## Phases

Execute in order. Each phase has a dedicated skill — read it and follow.

| # | Phase | Skill |
|---|---|---|
| 1 | Discover + refresh TODO | `.claude/skills/rosetta-add-framework-discover/SKILL.md` |
| 2 | Research framework API + tracing | (inline — see "Research checklist" below) |
| 3 | Build no-observability tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=no-observability` |
| 4 | Test no-observability tier | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=no-observability` |
| 5 | Build phoenix tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=phoenix` |
| 6 | Test phoenix tier (incl. evals) | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=phoenix` |
| 7 | Build ax tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=ax` |
| 8 | Test ax tier (synthetic only, evals UI-configured) | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=ax` |
| 9 | Session.id verification + fix | (inline — see "Session.id audit" below) |
| 10 | Playwright UI smoke | `.claude/skills/rosetta-add-framework-playwright/SKILL.md` |
| 11 | Docs + commit + PR | `.claude/skills/rosetta-add-framework-docs/SKILL.md` |

## Research checklist (phase 2)

Before building, gather these answers. Save anything non-obvious to project memory so the next framework's research is faster.

### Framework API
1. **Agent construction** — class name, constructor signature, how to pass system prompt and Anthropic Claude
2. **Tool registration** — decorator or constructor list? Does it accept `Annotated[..., Field(description=...)]` for params?
3. **Streaming API** — what method/event stream emits text deltas? How is a tool-call event distinguished from a text-delta event?
4. **Conversation memory** — does it have a session/thread primitive, or does the caller manage history? How is history passed across turns?
5. **Anthropic Claude** — model string format. Does the framework require a specific Sonnet version (some require strict-tools support, only available on 4.5+)?
6. **Installed version** — pin to a tested version in `requirements.txt`

### Arize tracing
7. **Phoenix pattern** — fetch `https://arize.com/docs/phoenix/integrations/python/<framework>/<framework>-tracing` or equivalent. What instrumentor + span processor? Does `register()` route to the right project, or is the manual `TracerProvider(resource=Resource.create({PROJECT_NAME: ...}))` pattern required?
8. **AX pattern** — fetch `https://arize.com/docs/ax/integrations/python-agent-frameworks/<framework>/<framework>-tracing`. Same questions.
9. **Session propagation** — does the framework's OpenInference instrumentation auto-emit `session.id`, or is `using_session(user_id)` wrap required? Grep the installed `openinference-instrumentation-<framework>` package for `session.id` references.

### Check memory first
Before web-fetching, check project memory for `framework_<name>_*` keys — earlier work on similar frameworks may have already documented these answers.

## Session.id audit (phase 9)

After all 3 tiers are built and tested:

1. Run the AX tier, fire a single chat with `x-user-id: session-audit-$(date +%s)`
2. Wait 30s for ingestion
3. Query: `ax traces list <project> -s $SPACE -o json --limit 10` and check whether the most recent trace has `attributes.session.id` set
4. If **set** — done. Session works automatically via the framework's primitives or its OpenInference instrumentation.
5. If **not set** — add `using_session(user_id)` wrap to `agent.py` following the CrewAI pattern:
   ```python
   from contextlib import nullcontext
   try:
       from openinference.instrumentation import using_session
   except ImportError:
       def using_session(session_id: str):
           return nullcontext()
   ...
   with using_session(user_id):
       # the agent call that emits spans
       ...
   ```
   Apply identically to all 3 tiers (the try/except keeps no-observability working). Re-test.

## Failure handling

- **Discover fails** (Arize docs unreachable, framework not in supported list) → abort, surface the diff
- **Research surfaces a blocker** (e.g. framework doesn't support Anthropic, no streaming API) → abort and report; don't attempt a partial build
- **Build/test phase fails** → fix the agent.py / requirements.txt, re-run just that phase via `--start-from`
- **Session.id audit fails after fix** → document inline in `agent.py` comments and in commit message; mark the framework as having a session-tagging caveat in the PR description

## State to thread through phases

The orchestrator should maintain these throughout:

- `FRAMEWORK` — the slug (`google-adk`)
- `FRAMEWORK_DIR` — derived (`google-adk-py` for Python, `google-adk` for TS — match existing naming)
- `LANGUAGE` — `py` or `ts`
- `CLONE_SOURCE` — closest existing tier to copy from. For Python: prefer `pydantic-ai-py` (simplest agent.py); for TS: prefer `vercel-ai-sdk`. The build skill takes this as input.
- `MODEL_OVERRIDE` — optional. If the framework can't use the project default `claude-sonnet-4-20250514` (e.g. CrewAI needed Sonnet 4.5), set this here and propagate.

Print these at the start of the run so a human can resume.

## End-of-run output

```
Framework added: <FRAMEWORK>
  Tiers: no-observability, phoenix, ax — all green
  Traces verified: phoenix ✓, ax ✓
  Sessions tagged: ✓ (auto | via using_session wrap)
  Playwright smoke: ✓
  Docs updated: README.md, TODO snapshot in this skill
  PR: <URL>
```
