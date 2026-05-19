# Project Rosetta Stone

**The same AI agent, built with different frameworks, instrumented with different observability platforms.**

Project Rosetta Stone implements an identical AI shopping agent across multiple frameworks so you can compare developer experience. It also implements observability for the agent across both Arize Phoenix and Arize AX, so you can see how that's done whichever one you choose.

## What's in the box

```tree
rosetta/
├── no-observability/          No instrumentation (baseline)
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/            LangChain / LangGraph (Python + Next.js)
│   ├── llamaindex-py/           LlamaIndex (Python + Next.js)
│   ├── mastra/                  Mastra framework (TypeScript)
│   └── vercel-ai-sdk/           Vercel AI SDK (TypeScript)
├── phoenix/                   Arize Phoenix Cloud instrumentation
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/            LangChain / LangGraph (Python + Next.js)
│   ├── llamaindex-py/           LlamaIndex (Python + Next.js)
│   ├── mastra/                  Mastra framework (TypeScript)
│   └── vercel-ai-sdk/           Vercel AI SDK (TypeScript)
├── ax/                        Arize AX instrumentation
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/            LangChain / LangGraph (Python + Next.js)
│   ├── llamaindex-py/           LlamaIndex (Python + Next.js)
│   ├── mastra/                  Mastra framework (TypeScript)
│   └── vercel-ai-sdk/           Vercel AI SDK (TypeScript)
├── product-images/            200 AI-generated product images (shared)
└── chroma-data/               ChromaDB vector store (gitignored, auto-created)
```

Every directory contains a fully functional, self-contained Next.js app running the same "Wonder Toys" shopping agent. The only differences between observability tiers are the instrumentation setup — agent logic, tools, UI, and data are identical.

## The Agent

"Wonder Toys" is a chat-to-purchase toy store assistant powered by Claude (Anthropic). It can:

- **Search** a 200-product inventory via semantic vector search (ChromaDB) with keyword fallback
- **Browse** products with rich markdown cards — images, prices, ratings, age ranges, and descriptions
- **Purchase** products with shipping details (credit card assumed on file)
- **Track** order status by order ID or natural language product search
- **Cancel** orders that haven't been delivered yet

The UI includes a home page with featured products and category chips, product detail pages, a shopping cart, and a streaming chat interface that renders product cards inline.

## Frameworks

| Framework | Agent library | LLM client | Streaming API | Architecture |
|-----------|---------------|------------|---------------|--------------|
| **LangChain.js** | `@langchain/langgraph` ReAct agent | `@langchain/anthropic` | `streamEvents` (v2) | Next.js monolith |
| **LangChain Python** | `langgraph` ReAct agent | `langchain-anthropic` | `astream_events` (v2) | Python FastAPI backend + Next.js frontend |
| **LlamaIndex Python** | `llama_index` FunctionAgent | `llama-index-llms-anthropic` | `stream_events` | Python FastAPI backend + Next.js frontend |
| **Mastra** | `@mastra/core` Agent | `@ai-sdk/anthropic` (Vercel AI SDK) | `stream.fullStream` | Next.js monolith |
| **Vercel AI SDK** | Vercel AI SDK `streamText` | `@ai-sdk/anthropic` | `result.fullStream` | Next.js monolith |

## Observability Tiers

| Tier | What it shows |
|------|---------------|
| **no-observability** | Baseline — how the agent works with zero instrumentation overhead |
| **phoenix** | [Arize Phoenix Cloud](https://phoenix.arize.com) — open-source observability |
| **ax** | [Arize AX](https://arize.com) — enterprise observability |

### What changes between tiers?

For **Mastra**, only these files differ:

- `src/mastra/index.ts` — observability config in the Mastra constructor
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

For **LangChain.js**, only these files differ:

- `src/langchain/agent.ts` — observability setup at the top of the file (before LangChain imports)
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

For **LangChain Python**, only these files differ:

- `backend/tracing.py` — tracing initialization (new file, imported before LangChain)
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — observability packages (`arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-langchain`)
- `env.example` — observability environment variables

For **LlamaIndex Python**, these files differ:

- `backend/tracing.py` — tracing initialization (new file, imported before LlamaIndex)
- `backend/agent.py` — manual root span + OTel context management for proper trace boundaries
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — observability packages (`arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-llama-index`)
- `env.example` — observability environment variables

For **Vercel AI SDK**, only these files differ:

- `src/instrumentation.ts` — `registerOTel` with OTLP exporter (new file)
- `src/root-aware-processor.ts` — custom span processor that promotes the first AI SDK span to trace root and drops HTTP spans (new file)
- `src/app/api/chat/route.ts` — session ID injected into OTel context via `context.with(setSession(...))`
- `src/components/Chat.tsx` — session ID generated/rotated and sent as `x-session-id` request header
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

Everything else — tools, UI, scripts — is identical across tiers.

## Quick Start

### Prerequisites

- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (for ChromaDB's Python venv)
- An [Anthropic API key](https://console.anthropic.com/)
- [X/Twitter OAuth credentials](https://developer.x.com/) (for authentication)
- Observability credentials (for phoenix or ax tiers)

### Running any agent

```bash
cd <tier>/<framework>       # e.g. phoenix/mastra
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + indexes products + runs the app
```

`npm run dev` handles everything automatically:

1. Creates a Python venv and installs ChromaDB (via `uv`)
1. Starts ChromaDB if not already running
1. Indexes all 200 products if the collection is missing
1. Starts the dev server (Next.js for JS frameworks; Python backend + Next.js for Python frameworks)

For Python frameworks (`langchain-py`, `llamaindex-py`), the start script also installs Python backend dependencies and starts a FastAPI server on port 8001. The Next.js frontend proxies API calls to it.

All tiers share the same ChromaDB instance and data at the repo root.

To skip ChromaDB: `npm run dev:next` (search falls back to keyword matching).

### Environment Variables

Every agent needs these in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | All tiers | [Anthropic API key](https://console.anthropic.com/) for Claude |
| `NEXTAUTH_SECRET` | All tiers | Session encryption key (`openssl rand -base64 32`) |
| `TWITTER_CLIENT_ID` | All tiers | [X/Twitter OAuth](https://developer.x.com/) app client ID |
| `TWITTER_CLIENT_SECRET` | All tiers | X/Twitter OAuth app client secret |
| `BACKEND_SECRET` | Python frameworks only | Shared secret for Next.js ↔ Python auth (any string) |
| `BACKEND_URL` | Python frameworks only | Python backend URL (default: `http://localhost:8001`) |

**Phoenix tier** — additionally requires:

| Variable | Description |
|----------|-------------|
| `PHOENIX_COLLECTOR_ENDPOINT` | Phoenix Cloud endpoint (e.g. `https://app.phoenix.arize.com/s/your-space`) |
| `PHOENIX_API_KEY` | Phoenix API key from [app.phoenix.arize.com](https://app.phoenix.arize.com) |
| `PHOENIX_PROJECT_NAME` | Project name in Phoenix |

Note: Mastra and LangChain.js require the full OTLP URL including `/v1/traces`. Python frameworks (`langchain-py`, `llamaindex-py`) expect just the base URL without `/v1/traces`, as expected by the `arize-phoenix-otel` SDK.

**AX tier** — additionally requires:

| Variable | Description |
|----------|-------------|
| `ARIZE_SPACE_ID` | AX space ID from [app.arize.com](https://app.arize.com) |
| `ARIZE_API_KEY` | AX API key |
| `ARIZE_PROJECT_NAME` | Project name in AX |

See each directory's `env.example` for the full template.

## Evaluations

Each observability tier includes eval harnesses for testing agent quality. All frameworks use the same 25 synthetic requests and the same 6 evaluators.

### Phoenix (programmatic)

Phoenix evals run programmatically via CLI:

```bash
cd phoenix/<framework>

# Install npm packages
npm i

# Generate traces (25 synthetic requests)
npm run synthetic-requests

# Run 6 evaluators and log results as span annotations
npm run evals
```

### AX (UI-driven)

AX evals are configured manually in the AX web console.

First generate traces for the evals:

```bash
cd ax/<framework>

# Install npm packages
npm i

# Generate traces (25 synthetic requests)
npm run synthetic-requests
```

After generating traces, configure the same 6 evaluators in the [Arize AX console](https://app.arize.com) using LLM-as-a-Judge and Code Evaluator task types. See the [`evals/README.md`](./evals/README.md) for step-by-step setup instructions with prompt templates and code. These evaluators apply to all the projects.

### The 6 Evaluators

- **Correctness** — Does the response address the user's request? (LLM judge)
- **Tool Selection** — Were the right tools chosen? (LLM judge)
- **Tool Response Handling** — Did the agent use tool results properly? (LLM judge)
- **Format Compliance** — Does the response follow markdown formatting rules? (LLM judge)
- **Image URL Correctness** — Do all image URLs match `/product-images/toy-XXX.png`? (code)
- **Tool Call Count** — Appropriate number of tool calls? (code)

## What You Can Learn

- **Framework comparison**: How does defining tools, agents, and streaming differ between Mastra, LangChain.js, LangChain Python, and LlamaIndex?
- **Observability comparison**: How does adding Phoenix vs AX differ across frameworks? What's auto-instrumented vs manual?
- **Production patterns**: Streaming architecture, vector search with fallbacks, in-memory order management, and structured tool schemas

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web framework | Next.js 16 (App Router) |
| Python backend | FastAPI + uvicorn (`langchain-py`, `llamaindex-py` only) |
| Styling | Tailwind CSS |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0 |
| LLM | Anthropic Claude Sonnet |
| Vector search | ChromaDB + all-MiniLM-L6-v2 embeddings |
| Product images | AI-generated (gpt-image-1) |

## Claude Code Skills

The repo ships with a small set of project-specific skills under `.claude/skills/` that automate common workflows. They're discovered automatically when you open the repo in Claude Code — invoke them by name or describe the task and Claude will pick the right one.

### `rosetta-test` (and its 5 phase skills)

End-to-end test a framework × platform combination on Arize AX or Phoenix. Trigger phrases: *"test the `<framework>` `<platform>` project"*, *"run e2e on `<framework>` `<platform>`"*.

In one invocation, the orchestrator:

1. **setup** — provisions a fresh isolated project on AX/Phoenix with a unique name; writes an `.env.test-local` overlay so the real `.env.local` is never mutated
2. **traces** — runs the 25 synthetic Wonder Toys requests against the framework's backend
3. **evals** — Phoenix: runs `npm run evals`. AX: ensures the stable space-level `rosetta-e2e-*` evaluators exist (creates missing ones), then creates and triggers a per-run eval task
4. **verify** — confirms 25 root traces exist and every expected eval annotation is present
5. **cleanup** — deletes the platform project, removes the env overlay, kills leftover processes. Always runs unless you pass `--keep`

Each phase has its own skill (`rosetta-test-setup`, `-traces`, `-evals`, `-verify`, `-cleanup`) so you can re-run a single phase against an existing project. Frameworks and platforms are discovered from the directory layout — no hardcoded list, so this works for any new framework dropped under `ax/` or `phoenix/`.

### `rosetta-demo-capture`

Record a full Wonder Toys demo. Trigger phrases: *"capture a demo for `<framework>`"*, *"record screenshots of the Arize session"*.

Runs a canned 3-turn purchase conversation (search dragons → buy the plushie → ship), then drives Safari via AppleScript to:

1. Open the resulting Arize session URL
2. Expand all trace accordions in the session conversation popover via injected JavaScript
3. Screenshot the session view
4. Walk through each trace, expand its spans, screenshot

Output lands in `./demo-screenshots/<framework>-<timestamp>/`. macOS only.

**One-time setup:** in Safari → Settings → Advanced → enable *"Show features for web developers"*, then Settings → Developer → enable *"Allow JavaScript from Apple Events"*. The skill needs this to expand the trace tree before capture.

### External Arize skills

Skills under `.claude/skills/arize-*` (e.g. `arize-trace`, `arize-evaluator`, `arize-dataset`) are installed from [Arize-ai/arize-skills](https://github.com/Arize-ai/arize-skills) and are pinned in `skills-lock.json`. They wrap the `ax` CLI for common Arize platform operations. They're git-ignored locally — re-sync them on a fresh clone via Claude Code's skill installer.

## License

[MIT](./LICENSE)
