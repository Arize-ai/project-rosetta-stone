---
name: rosetta-add-framework
description: Add a new agent framework to the Rosetta Stone repo — researches the framework, builds all three observability tiers (no-observability, phoenix, ax), tests each, runs a Playwright smoke against the UI, updates README + TODO, and raises a PR. Trigger when the user asks to "add the <framework> framework", "implement <framework>", "wire up <framework>", or similar. The framework must be one of the Arize-supported agent frameworks (see TODO below).
---

# Rosetta — Add Framework Orchestrator

End-to-end workflow for bringing a new agent framework into the repo. Mirrors the existing structure: every new framework gets a `no-observability/<framework>-py/` (or `-ts/`) directory, a `phoenix/<framework>-py/` directory, and an `ax/<framework>-py/` directory, each running an identical Wonder Toys shopping agent.

## Inputs

- `<framework>` — framework name in the form used by directory naming, e.g. `agno`, `google-adk`, `smolagents`, `crewai`. Use the slug from Arize's docs (`https://arize.com/docs/ax/integrations/python-agent-frameworks/<slug>/<slug>-tracing`).
- `<language>` — `py` for Python, `js`/`ts` for TypeScript, `java` for Java. Affects which existing tier is used as the clone source. **Note:** Java tiers don't fit the current Node/Python repo shape — see the Java section under TODO before attempting.
- `--start-from <phase>` (optional) — resume from `discover` | `research` | `build-noobs` | `build-phoenix` | `build-ax` | `playwright` | `docs`. Useful when a phase fails mid-flow.

## TODO — frameworks not yet implemented

Snapshot (last refreshed 2026-06-12 from `https://arize.com/docs/llms.txt`). Each phase-1 `discover` run re-fetches and shows the diff.

### Python (Tier A — clear agent frameworks)
- [x] Agno
- [x] AutoGen
- [x] AWS Strands
- [ ] Bedrock AgentCore — new Arize page under aws-strands docs path; investigate whether it's a distinct framework from AWS Strands or a Bedrock-specific variant
- [x] CrewAI
- [x] DSPy
- [x] Google ADK
- [x] Haystack
- [x] LlamaIndex Workflows
- [x] OpenAI Agents SDK
- [~] Pipecat — skipped: not-chat-shaped (real-time voice/multimodal framework; audio I/O pipeline only, no text-only chat mode)
- [x] Pydantic AI
- [x] Semantic Kernel
- [x] Smolagents (Hugging Face)
- [x] BeeAI

### TypeScript (Tier A)
- [x] BeeAI
- [x] OpenAI Agents SDK

### Java (Tier A)

⚠️ Adding a Java tier is a **significantly larger lift** than adding another Python or TypeScript framework. The repo's current shape assumes a Node/Python stack — every existing tier is either a Next.js monolith or a FastAPI Python backend + Next.js frontend. A Java tier needs:
- A JVM build setup (Maven or Gradle) added to the repo
- A new backend serving the same `/chat` SSE protocol from Java (e.g. Spring Boot)
- Either a separate Java→Next.js frontend bridge, or a Java-rendered UI
- Java-specific tracing setup matching the Arize Java docs
- Adjustments to `scripts/start.sh` patterns since the existing one is `uv`/`npm`-only

Decide whether the project wants this dimension before starting. If yes, the per-framework work is then:
- [x] LangChain4j
- [x] Spring AI
- [x] Arconia

### Borderline — decide before building
- [ ] Guardrails AI (output validation)
- [ ] Instructor (structured output)
- [ ] MCP / Model Context Protocol (wire protocol)
- [ ] Portkey (LLM gateway)
- [ ] Together AI (LLM provider)
- [x] OpenInference Annotation Tracing (Java) — `@Chain`/`@LLM`/`@Tool`/`@Agent` decorators applied via ByteBuddy for hand-built agents; not a framework

## Phases

Execute in order. Each phase has a dedicated skill — read it and follow.

| # | Phase | Skill |
|---|---|---|
| 1 | Discover + refresh TODO | `.claude/skills/rosetta-add-framework-discover/SKILL.md` |
| 2 | **Pre-flight viability gate** | (inline — see "Viability gate" below). Aborts cleanly if the framework can't be built as designed. |
| 3 | Research framework API + tracing | (inline — see "Research checklist" below) |
| 4 | Build no-observability tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=no-observability` |
| 5 | Test no-observability tier | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=no-observability` |
| 6 | Build phoenix tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=phoenix` |
| 7 | Test phoenix tier (incl. evals) | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=phoenix` |
| 8 | Build ax tier | `.claude/skills/rosetta-add-framework-tier-build/SKILL.md` with `tier=ax` |
| 9 | Test ax tier (synthetic only, evals UI-configured) | `.claude/skills/rosetta-add-framework-tier-test/SKILL.md` with `tier=ax` |
| 10 | Session.id verification + fix | (inline — see "Session.id audit" below) |
| 11 | Playwright UI smoke | `.claude/skills/rosetta-add-framework-playwright/SKILL.md` |
| 12 | Docs + commit + PR | `.claude/skills/rosetta-add-framework-docs/SKILL.md` |
| 13 | Screenshots attached to PR | `.claude/skills/rosetta-pr-screenshots/SKILL.md` (auto-invoked by step 12) |

## Viability gate (phase 2)

Before any code is written, verify three things. If **any** check fails, abort with a structured skip-with-reason report (see "Skip-with-reason vocabulary" below) and **do not** create any tier directories.

### Check 1 — Anthropic Claude support

The repo standardises on Anthropic Claude. The framework must support it (directly via an Anthropic provider, via LiteLLM, via Bedrock, or similar).

- Web-fetch the framework's "models" / "providers" docs page
- Look for: an Anthropic provider class, a model string like `anthropic/...`, a `LiteLlm` / `LiteLLM` wrapper, or a Bedrock Anthropic integration
- If **none** found → skip with reason `no-anthropic-support`

### Check 2 — Streaming text API

The Wonder Toys agent streams SSE deltas to the UI. The framework must expose a token-level streaming API for text responses (not just final aggregates).

- Look for: an `async for chunk in agent.run_stream(...)` shape, an event-bus with text-delta events, a `RunConfig(streaming_mode=SSE)`-style flag, or callbacks on partial tokens
- If the framework only returns final aggregated responses → skip with reason `no-streaming-api`
- If it streams only **audio/video** (e.g. Pipecat) → skip with reason `not-chat-shaped`

### Check 3 — OpenInference instrumentation

The framework must have a published `openinference-instrumentation-<framework>` (or equivalent) package, or be auto-instrumented by a more general OpenInference instrumentor.

```bash
# Quick existence check via PyPI
curl -sf "https://pypi.org/pypi/openinference-instrumentation-${FRAMEWORK}/json" > /dev/null \
  && echo "instrumentation: yes" || echo "instrumentation: NO"
```

- If the package doesn't exist AND no general instrumentor covers it → skip with reason `no-instrumentation`

### Check 4 — Framework shape fits "chat-to-purchase"

Some frameworks aren't conversational by design — they assume batch task execution (CrewAI was on the edge of this; we adapted), declarative pipelines (DSPy), voice/video streams (Pipecat), or batch inference. Apply judgment:

- If the framework has **no conversational primitive** (session/thread/message history) **and** no easy way to fake one by threading history into a task description → skip with reason `not-chat-shaped`
- Borderline cases: build it but document the awkwardness inline (CrewAI's per-turn fresh Crew is an acceptable adaptation)

## Skip-with-reason vocabulary

When a framework can't be built, write a structured marker so the TODO list and PR history stay honest. Apply each in the orchestrator's TODO and in `MEMORY.md`:

| Reason | Meaning | Recovery |
|---|---|---|
| `no-anthropic-support` | Framework doesn't reach Claude at all | Revisit if framework adds Anthropic |
| `no-streaming-api` | No token-level text streaming | Revisit if framework adds streaming |
| `no-instrumentation` | No OpenInference package | Revisit if Arize adds it |
| `not-chat-shaped` | Voice/video, declarative, batch, etc. | Likely never — document why |
| `dep-conflict` | Installing the framework breaks an existing tier's deps in the shared venv (see "Regression check" below) | Use per-framework venv or pin transitive deps before retrying |

Record skips in `.claude/skills/rosetta-add-framework/SKILL.md` (this file) under the TODO section by changing `[ ]` to `[~]` and appending the reason — e.g. `- [~] Pipecat — skipped: not-chat-shaped (voice/video only)`. The discover phase preserves these markers across runs.

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
- **Viability gate fails** → record the skip-with-reason in this file's TODO (change `[ ]` to `[~]` with reason), commit only that change, **don't** create any tier directories
- **Research surfaces a blocker not caught by the gate** → same handling as viability-gate failure; tighten the gate's checks so the next framework catches it earlier
- **Build/test phase fails** → fix the agent.py / requirements.txt, re-run just that phase via `--start-from`
- **Session.id audit fails after fix** → document inline in `agent.py` comments and in commit message; mark the framework as having a session-tagging caveat in the PR description

### Failure isolation (rollback) — for long autonomous runs

A long-running orchestrator pass should leave the repo in a clean, committable state regardless of whether any single framework succeeded. If a framework fails mid-build or mid-test:

1. **Kill backend processes** on ports 8001 (FastAPI), 3000 (Next.js), 6006 (Phoenix). Leave ChromaDB on 8000 alone — it's shared and slow to re-init.
2. **Drop any half-built tier directories** for this framework. The cleanest check: a tier counts as "complete" only after its corresponding test phase passes. Anything else is removable. Specifically: `rm -rf <tier>/<FRAMEWORK_DIR>` for any tier whose `tier-test` skill didn't return a PASS for this run.
3. **Remove the framework's `.env.local`** files from any directories that survived the cleanup.
4. **Reset shared venv** if the failure was a `dep-conflict` (see Regression check below). Reinstall the previous framework's requirements.txt to restore.
5. **Branch hygiene** — if the orchestrator created `feat/add-<framework>` and committed anything, hard-reset the branch back to `origin/main` or delete the branch outright. **Do not push** a partial branch.
6. **Record the failure** under the framework's TODO entry with `[!]` and a short reason (e.g. `- [!] Smolagents — failed: streaming events never carry text deltas`). Different marker from `[~]` so a human can see "tried but broke" vs "skipped on principle".

After rollback, the orchestrator may proceed to the next framework in the TODO (autonomous-run mode) or stop and surface the failure (default).

## Regression check (after each Build phase)

After installing a new framework's `requirements.txt` into the shared `.venv`, verify that no previously-implemented Python tier's `agent.py` has broken imports. Dependency conflicts have surfaced before (e.g. installing CrewAI pinned `opentelemetry-semconv==0.55b1` which then broke Pydantic AI's instrumentation which needs `>=0.62b1`).

```bash
for tier in no-observability phoenix ax; do
  for fwk_dir in $tier/*-py/; do
    [ "$fwk_dir" = "$TIER/$FRAMEWORK_DIR/" ] && continue   # skip the tier we just built
    fwk_name=$(basename "$fwk_dir")
    /Users/jimbobbennett/github/project-rosetta-stone/.venv/bin/python -c "
import sys; sys.path.insert(0, '$fwk_dir')
try:
    import backend.agent
    print('  OK: $fwk_name')
except Exception as e:
    print(f'  BROKEN: $fwk_name — {type(e).__name__}: {e}')
    sys.exit(1)
" || exit 1
  done
done
```

If any existing tier breaks, the new framework's install introduced a dep conflict. Mark the new framework as `[!]` with reason `dep-conflict`, run the rollback procedure above, and surface the conflict.

(Per-framework venv isolation would prevent this entirely — that's a future refactor. For now, the regression check is the cheap defence.)

## State to thread through phases

The orchestrator should maintain these throughout:

- `FRAMEWORK` — the slug (`google-adk`)
- `FRAMEWORK_DIR` — derived (`google-adk-py` for Python, `google-adk` for TS — match existing naming)
- `LANGUAGE` — `py` or `ts`
- `CLONE_SOURCE` — closest existing tier to copy from. For Python: prefer `pydantic-ai-py` (simplest agent.py); for TS: prefer `vercel-ai-sdk`. The build skill takes this as input.
- `MODEL_OVERRIDE` — optional. If the framework can't use the project default `claude-sonnet-4-6` (e.g. CrewAI needed Sonnet 4.5), set this here and propagate.

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
