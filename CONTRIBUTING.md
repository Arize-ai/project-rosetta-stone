# Contributing to Project Rosetta Stone

This guide covers everything you need to maintain or extend the repo: adding a new framework, running the end-to-end test harness, capturing screenshots for PRs and demos, and the conventions every tier follows.

If you just want to learn how to instrument your own app, the [README](./README.md) is the right starting point — come back here when you want to add a framework or contribute changes.

The repo ships with a small set of Claude Code skills under `.claude/skills/` that automate every workflow described below. You can invoke any of them in Claude Code by typing the skill name (e.g. `rosetta-test`, `rosetta-add-framework`) or describing the task — Claude will pick the right one. Manual fallback steps are provided everywhere a skill is referenced.

## Repo layout

See the [README's Repo layout section](./README.md#repo-layout) for the full directory tree. In addition to the per-framework tier directories, contributors will work with:

- `CLAUDE.md` — agent-facing project instructions (Claude Code reads this)
- `TODO.md` — frameworks left to add (gitignored, local to your checkout)
- `evals/` — shared synthetic-requests harness (text + voice), eval scripts, and the 6 evaluator templates
- `skills-lock.json` — version pin for the externally-synced `arize-*` skills

## Editing rules

**`no-observability/` is the canonical baseline.** When you change anything that's not observability-related, change it there first, then mirror the change to `phoenix/` and `ax/`.

What may differ between tiers:

- **TypeScript monoliths** (Mastra, LangChain.js, BeeAI-ts, Vercel AI SDK): `next.config.ts`, `package.json`, `env.example`, and one or two instrumentation-init files (e.g. `src/mastra/index.ts`, `src/instrumentation.ts`).
- **Python + Next.js tiers**: a new `backend/tracing.py`, an `import backend.tracing` line at the top of `backend/main.py`, `backend/requirements.txt` additions, `env.example` additions. Some frameworks also modify `backend/agent.py` (`using_session` wrapper, manual root span) — see the README's per-framework section for which.
- **Java tiers**: a new `backend/.../Tracing.java`, build-file additions, `application.yml` properties, `env.example` additions.

What must NOT differ between tiers:

- Tool implementations (`tools.py` / `tools.ts`)
- Inventory, orders, ChromaDB client
- UI components, pages, styles
- Auth setup
- Start scripts

`CLAUDE.md` (read by the agent) is the canonical source for these rules; this section is the human-readable mirror. Each tier directory also has its own `CLAUDE.md` describing what differs in that specific tier.

If you change the no-observability baseline, run `diff -r no-observability/<framework> phoenix/<framework>` and `diff -r no-observability/<framework> ax/<framework>` afterwards — the diff should match the documented per-framework footprint and nothing else.

## Adding a new framework

The end-to-end flow (research → build all three tiers → smoke-test each → docs → PR) takes one orchestrator skill, or you can drive it phase by phase, or do it by hand.

### One-shot: `rosetta-add-framework`

```text
"add the foobar framework"
"implement foobar"
"wire up foobar"
```

The orchestrator:

1. Researches the framework using web docs + the existing Arize OpenInference instrumentation catalog (via `rosetta-add-framework-discover` for the up-to-date list)
2. Builds all three tiers (`rosetta-add-framework-tier-build` × 3), each cloned from the closest existing tier and modified for the new framework's agent/tool/streaming conventions
3. Smoke-tests each tier (`rosetta-add-framework-tier-test`) — boots the backend, hits the chat endpoint with a synthetic request, verifies traces land in the right project
4. Runs the public-flow Playwright smoke (`rosetta-add-framework-playwright`) — home page rendering + product browsing (no X/Twitter OAuth required)
5. Finalises the docs (`rosetta-add-framework-docs`) — updates the README's supported-frameworks table and "What changes between tiers" section, marks the framework off in `TODO.md`, commits per tier, and raises a PR
6. Captures PR screenshots (`rosetta-pr-screenshots`) and embeds them in the PR body

The framework must already be supported by an Arize OpenInference instrumentor (or have a path to manual spans, e.g. the openai-voice tier). The current list is in `TODO.md` — Claude updates it from `https://arize.com/docs/llms.txt` as part of the flow.

### Phase by phase

Re-run a single step if something went wrong without re-doing the whole flow:

| Phase | Skill | What it does |
|------|-------|--------------|
| Discover | `rosetta-add-framework-discover` | Pulls the live list of Arize-supported frameworks and diffs against `TODO.md` |
| Build a tier | `rosetta-add-framework-tier-build` | Builds one tier (no-obs / phoenix / ax) by cloning the closest existing tier |
| Smoke a tier | `rosetta-add-framework-tier-test` | Boots the backend, hits the chat endpoint, runs synthetic requests, (Phoenix) runs evals |
| UI smoke | `rosetta-add-framework-playwright` | Playwright public-flow tests — home page rendering and product browsing |
| Docs + PR | `rosetta-add-framework-docs` | README + TODO updates, per-tier commits, PR creation |
| PR screenshots | `rosetta-pr-screenshots` | AX trace UI, Phoenix trace UI, Wonder Toys home page; uploaded as GitHub release assets and embedded in the PR body |

### Manual fallback

If you don't want to use the skills:

1. Pick the closest existing tier as a template. TypeScript monoliths clone from `mastra` or `langchain-js`; Python + Next.js tiers clone from `langchain-py` or `llamaindex-py`; Java tiers clone from `spring-ai-java`.
2. Create `no-observability/<framework>/` first. Swap in the new framework's agent, tools, and streaming code. Keep `inventory`, `orders`, ChromaDB client, UI, and auth identical.
3. Create `phoenix/<framework>/` by copying the no-obs tier and adding the framework's OpenInference instrumentation (typically a new `backend/tracing.py` + import line + dependency additions).
4. Create `ax/<framework>/` the same way, swapping `arize-phoenix-otel` for `arize-otel`.
5. Add the framework to the README's supported-frameworks table, Frameworks reference table, and "What changes between tiers" section.
6. Mark it off in `TODO.md`.
7. Commit per tier (see PR conventions below) and raise a PR.

## End-to-end testing a framework × tier

The `rosetta-test` orchestrator provisions an isolated project on the target platform, generates traces, runs evals, verifies, then tears the project down.

### `rosetta-test`

```text
"test the foobar phoenix project"
"run e2e on foobar ax"
"verify foobar works on phoenix"
```

Pipeline:

1. **setup** (`rosetta-test-setup`) — mints a unique project name, writes a sibling `.env.test-local` overlay so the real `.env.local` is **never** mutated, and pre-creates the AX project (Phoenix auto-creates on first trace)
2. **traces** (`rosetta-test-traces`) — runs the 25 synthetic Wonder Toys requests against the framework's backend
3. **evals** (`rosetta-test-evals`) — Phoenix: runs `npm run evals` (the built-in eval script). AX: ensures the stable space-level `rosetta-e2e-*` evaluators exist (creates only missing ones), then creates and triggers a per-run eval task scoped to the project
4. **verify** (`rosetta-test-verify`) — confirms 25 root traces exist and every expected eval annotation is present. Presence-only check — eval scores are not inspected
5. **cleanup** (`rosetta-test-cleanup`) — deletes the platform project, removes the env overlay, kills leftover processes. Always runs unless you pass `--keep` at the orchestrator level

Frameworks and platforms are discovered from the directory layout — no hardcoded list, so this works for any framework dropped under `ax/` or `phoenix/`.

Each phase is also a standalone skill if you want to re-run one piece without redoing the rest (e.g. you fixed a tool implementation and want to re-run `traces` + `evals` against an existing test project, then `verify`).

### The `.env.test-local` overlay

Every test run gets its own project name so concurrent runs and humans-running-the-app-in-the-other-window don't collide. The overlay file sits next to `.env.local`, is loaded *after* `.env.local`, and overrides `PHOENIX_PROJECT_NAME` / `ARIZE_PROJECT_NAME`. Setup writes it; cleanup deletes it. You never edit it by hand.

## PR screenshots — `rosetta-pr-screenshots`

Capture three screenshots for a framework's PR body:

1. Arize AX trace UI for the framework
2. Phoenix trace UI for the framework
3. Wonder Toys app home page

It's Playwright end-to-end, runs cross-platform, and uploads the screenshots as GitHub release assets so the PR body can `<img>`-reference them without bloating the repo.

The skill is called automatically as the final step of `rosetta-add-framework-docs` when adding a new framework. You can also call it standalone to retrofit an existing PR.

## Demo capture — `rosetta-demo-capture`

Record a full Wonder Toys demo as screenshots — useful for blog posts, conference talks, and onboarding videos.

```text
"capture a demo for foobar"
"record screenshots of an Arize session"
```

The skill runs a canned 3-turn conversation (search dragons → buy plushie → ship), opens the resulting Arize AX session URL in Safari, then drives Safari via AppleScript to:

1. Expand all trace accordions in the session conversation popover via injected JavaScript
2. Screenshot the session view
3. Walk through each trace, expand its spans, screenshot each

Output lands in `./demo-screenshots/<framework>-<timestamp>/`. **macOS only** — uses AppleScript and `screencapture`.

### One-time Safari setup

The skill needs to inject JavaScript into the Arize UI to expand the trace tree before capture. In Safari:

1. **Settings → Advanced** → enable *"Show features for web developers"*
2. **Settings → Developer** → enable *"Allow JavaScript from Apple Events"*

Without these, the AppleScript can't expand the trace accordions and the screenshots show collapsed spans.

## Synthetic requests + eval harness

The 25 synthetic requests live in `evals/` at the repo root and are the single source of truth used by both the test harness and contributors running evals manually.

### The 6 evaluators

- **Correctness** — Does the response address the user's request? (LLM judge)
- **Tool Selection** — Were the right tools chosen? (LLM judge)
- **Tool Response Handling** — Did the agent use tool results properly? (LLM judge)
- **Format Compliance** — Does the response follow markdown formatting rules? (LLM judge)
- **Image URL Correctness** — Do all image URLs match `/product-images/toy-XXX.png`? (code)
- **Tool Call Count** — Appropriate number of tool calls? (code)

Prompt templates and code evaluators live in [`evals/README.md`](./evals/README.md).

### Phoenix path (programmatic)

```bash
cd phoenix/<framework>
npm install
npm run synthetic-requests
npm run evals
```

The `evals` script logs results back as span annotations via the Phoenix client. New evaluators added to `evals/` are picked up automatically.

### AX path (UI configuration)

```bash
cd ax/<framework>
npm install
npm run synthetic-requests
```

Then either run the AX evaluators manually in the [Arize AX console](https://app.arize.com) using LLM-as-a-Judge + Code Evaluator task types (templates in `evals/README.md`), or let `rosetta-test-evals` ensure the stable space-level `rosetta-e2e-*` evaluators exist and trigger them via the `ax` CLI.

The stable space-level evaluators (one per evaluator name, shared across all framework projects) avoid the duplication of re-creating evaluators per-project, and they're idempotent — `rosetta-test-evals` only creates ones that don't already exist.

### Voice harness (openai-voice tier only)

The `openai-voice` tier ships a synthetic voice runner that replays MP3 prompts through the WebSocket voice endpoint — the same path a real browser microphone uses. Each prompt produces a full `session.lifecycle` trace with `input.audio` / `llm.tool` / `output.audio` children.

```bash
cd phoenix/openai-voice    # or ax/openai-voice / no-observability/openai-voice
npm install
npm run voice-requests     # 8 voice prompts → 8 voice sessions
```

Shape:

- `evals/voice-prompts/*.mp3` — 8 pre-generated TTS clips committed to the repo. Regenerate by running `python evals/generate-voice-prompts.py` (requires `OPENAI_API_KEY`).
- `evals/generate-voice-prompts.py` — TTS generator using `tts-1` + voice=alloy. Mirrors the categories from `synthetic-requests.ts` (search, filtered, purchase, status, edge cases). Multi-turn prompts are skipped — each MP3 is a single user utterance.
- `evals/run-voice-requests.py` — async WebSocket replay. Decodes each MP3 to PCM16 24 kHz mono, streams it to `ws://localhost:8001/voice` paced at real time and appends ~800 ms of trailing silence so the server-side VAD reliably commits. Collects the transcript + tool calls + response audio. Has a single retry on transient errors (OpenAI service restarts, brief WS drops).
- `evals/run-voice-requests.sh` — bash wrapper that loads `.env.local`, installs `evals/requirements.txt` (pydub + websockets) into the shared venv, boots the dev server if needed, then runs the Python script.

Adding new prompts: edit the `PROMPTS` list in `generate-voice-prompts.py`, re-run it, commit the new MP3s.

## Skills catalog

All skills installed under `.claude/skills/`. Repo-specific skills are committed; the `arize-*` skills are installed from [Arize-ai/arize-skills](https://github.com/Arize-ai/arize-skills) and pinned in `skills-lock.json` (see [External Arize skills](#external-arize-skills) below).

### Adding a framework

| Skill | Purpose |
|-------|---------|
| `rosetta-add-framework` | One-shot orchestrator — discover → build all three tiers → smoke-test each → docs → PR |
| `rosetta-add-framework-discover` | Refresh the list of Arize-supported frameworks from `https://arize.com/docs/llms.txt` and diff against `TODO.md` |
| `rosetta-add-framework-tier-build` | Build a single tier by cloning the closest existing one |
| `rosetta-add-framework-tier-test` | Smoke-test a freshly-built tier (backend boot + chat endpoint + synthetic requests; Phoenix also runs evals) |
| `rosetta-add-framework-playwright` | Playwright public-flow smoke (home page + product browsing) |
| `rosetta-add-framework-docs` | README + TODO updates, per-tier commits, PR creation |
| `rosetta-pr-screenshots` | AX UI, Phoenix UI, Wonder Toys app screenshots → upload as GitHub release assets → embed in PR body |

### Testing a framework × tier

| Skill | Purpose |
|-------|---------|
| `rosetta-test` | One-shot orchestrator — setup → traces → evals → verify → cleanup |
| `rosetta-test-setup` | Provision a fresh isolated project; write `.env.test-local` |
| `rosetta-test-traces` | Run the 25 synthetic Wonder Toys requests |
| `rosetta-test-evals` | Phoenix: `npm run evals`. AX: ensure `rosetta-e2e-*` evaluators exist, trigger per-run task |
| `rosetta-test-verify` | Confirm 25 traces + every expected eval annotation; per-trace coverage matrix + pass/fail |
| `rosetta-test-cleanup` | Delete project, remove env overlay, kill leftover processes |

### Demo capture

| Skill | Purpose |
|-------|---------|
| `rosetta-demo-capture` | Record a 3-turn demo conversation + screenshot the AX session view + every trace in it (macOS only) |

### External Arize skills

Generic Arize platform skills (not Rosetta-specific) installed from `Arize-ai/arize-skills`. Useful when extending evaluator logic, building experiments, or debugging traces from outside the repo's harness.

| Skill | Purpose |
|-------|---------|
| `arize-trace` | Download / export traces and spans by ID or session via the `ax` CLI |
| `arize-evaluator` | LLM-as-judge evaluator CRUD, trigger runs, column mapping, continuous monitoring |
| `arize-dataset` | Dataset CRUD, append examples, export data, file-based dataset creation |
| `arize-experiment` | Experiment CRUD, export runs, compare results |
| `arize-annotation` | Categorical / continuous / freeform annotation configs; bulk apply human annotations |
| `arize-link` | Generate deep links to specific traces, spans, sessions, datasets, etc. in the AX UI |
| `arize-ai-provider-integration` | Create / read / update / delete LLM provider integrations (OpenAI, Anthropic, Bedrock, etc.) |
| `arize-instrumentation` | Two-phase agent-assisted tracing setup for a brand-new app (analyze → confirm → instrument) |
| `arize-prompt-optimization` | Data-driven prompt optimization loop using production trace data + evals + annotations |

## External Arize skills sync

The `arize-*` skills are installed from `https://github.com/Arize-ai/arize-skills` and pinned in `skills-lock.json` at the repo root. They are **gitignored** locally (see `.gitignore`), so a fresh clone needs to re-install them via Claude Code's skill installer. The pin file ensures everyone uses the same version.

When the upstream `arize-skills` repo updates, refresh by bumping `skills-lock.json` (Claude Code's `/install-skill` flow handles this) and committing only the lock file. The skill source itself stays gitignored.

## Repo-level files

| File / dir | Purpose |
|------------|---------|
| `CLAUDE.md` | Project-wide agent instructions. Canonical source for the editing rules. Each tier directory may also have its own `CLAUDE.md` describing tier-specific quirks |
| `TODO.md` | Frameworks left to add. Updated by `rosetta-add-framework-discover` from the live Arize-supported list |
| `evals/` | The 25 synthetic requests + the 6 evaluator prompt templates + code evaluator scripts. Shared by every Phoenix/AX framework |
| `product-images/` | 200 AI-generated product images (gpt-image-1) plus the Wonder Toys logo. Symlinked into each tier's `public/product-images/` so the repo only stores them once |
| `chroma-data/` | ChromaDB vector store — gitignored, auto-created on first `npm run dev`. Shared across all tiers (one ChromaDB instance per machine) |
| `skills-lock.json` | Version pin for the externally-synced `arize-*` skills |
| `voice-audio/` (under `*/openai-voice/public/`) | Runtime WAV captures for voice-tier traces. Gitignored |

## PR conventions

Branch names: `feat/add-<framework>` for new frameworks, `feat/<feature>` for cross-cutting changes, `chore/<task>` for housekeeping. Look at the recent `git log` for examples.

Commits when adding a framework — one per tier plus a docs commit:

```text
Add <framework> tier (no-observability)
Add <framework> tier (Phoenix)
Add <framework> tier (Arize AX)
Document <framework> in README + mark off in TODO
```

This is what `rosetta-add-framework-docs` produces. The orchestrator skill creates the PR with embedded screenshots from `rosetta-pr-screenshots`.

For other changes — match recent commit style. No enforced format; aim for an action verb + scope (e.g. `Fix SK tracing: drop OpenLIT, use openinference-instrumentation-anthropic directly`).
