# Project Rosetta Stone

**The same AI agent, built with different frameworks, instrumented with different observability platforms.**

Project Rosetta Stone implements an identical AI shopping agent across multiple frameworks so you can compare developer experience. It also implements observability for the agent across both Arize Phoenix and Arize AX, so you can see how that's done whichever one you choose.

## What's in the box

```
rosetta/
├── no-observability/          No instrumentation (baseline)
│   ├── mastra/                  Mastra framework (TypeScript)
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   └── langchain-py/            LangChain / LangGraph (Python + Next.js)
├── phoenix/                   Arize Phoenix Cloud instrumentation
│   ├── mastra/                  Mastra framework (TypeScript)
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   └── langchain-py/            LangChain / LangGraph (Python + Next.js)
├── ax/                        Arize AX instrumentation
│   ├── mastra/                  Mastra framework (TypeScript)
│   └── langchain-js/            LangChain.js / LangGraph (TypeScript)
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
| **Mastra** | `@mastra/core` Agent | `@ai-sdk/anthropic` (Vercel AI SDK) | `stream.fullStream` | Next.js monolith |
| **LangChain.js** | `@langchain/langgraph` ReAct agent | `@langchain/anthropic` | `streamEvents` (v2) | Next.js monolith |
| **LangChain Python** | `langgraph` ReAct agent | `langchain-anthropic` | `astream_events` (v2) | Python FastAPI backend + Next.js frontend |

## Observability Tiers

| Tier | What it shows |
|------|---------------|
| **no-observability** | Baseline — how the agent works with zero instrumentation overhead |
| **phoenix** | [Arize Phoenix Cloud](https://phoenix.arize.com) — open-source observability via `@mastra/arize` (Mastra), `@arizeai/phoenix-otel` (LangChain.js), or `arize-phoenix-otel` (LangChain Python) |
| **ax** | [Arize AX](https://arize.com) — enterprise observability via `@mastra/arize` (Mastra) or raw OpenTelemetry (LangChain.js) |

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
- `backend/tracing.py` — Phoenix tracing initialization (new file, imported before LangChain)
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — `arize-phoenix-otel` and `openinference-instrumentation-langchain`
- `env.example` — observability environment variables

Everything else — tools, lib, UI, scripts — is identical across tiers.

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
2. Starts ChromaDB if not already running
3. Indexes all 200 products if the collection is missing
4. Starts the dev server (Next.js for JS frameworks; Python backend + Next.js for `langchain-py`)

For `langchain-py`, the start script also installs Python backend dependencies and starts a FastAPI server on port 8001. The Next.js frontend proxies API calls to it.

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
| `BACKEND_SECRET` | `langchain-py` only | Shared secret for Next.js ↔ Python auth (any string) |
| `BACKEND_URL` | `langchain-py` only | Python backend URL (default: `http://localhost:8001`) |

**Phoenix tier** — additionally requires:

| Variable | Description |
|----------|-------------|
| `PHOENIX_COLLECTOR_ENDPOINT` | Phoenix Cloud endpoint (e.g. `https://app.phoenix.arize.com/s/your-space`) |
| `PHOENIX_API_KEY` | Phoenix API key from [app.phoenix.arize.com](https://app.phoenix.arize.com) |
| `PHOENIX_PROJECT_NAME` | Project name in Phoenix |

Note: Mastra and LangChain.js require the full OTLP URL including `/v1/traces`. LangChain Python expects just the base URL without `/v1/traces`, as expected by the `arize-phoenix-otel` SDK.

**AX tier** — additionally requires:

| Variable | Description |
|----------|-------------|
| `ARIZE_SPACE_ID` | AX space ID from [app.arize.com](https://app.arize.com) |
| `ARIZE_API_KEY` | AX API key |
| `ARIZE_PROJECT_NAME` | Project name in AX |

See each directory's `env.example` for the full template.

## Evaluations

The `phoenix/mastra` and `ax/mastra` directories include eval harnesses for testing agent quality.

### Phoenix (programmatic)

```bash
cd phoenix/mastra

# Generate traces (25 synthetic requests)
set -a && source .env.local && set +a && npx tsx --conditions=import evals/synthetic-requests.ts

# Run 6 evaluators and log results as span annotations
set -a && source .env.local && set +a && npx tsx --conditions=import evals/run-evals.ts
```

Six evaluators run against Phoenix traces:
- **Correctness** — Does the response address the user's request? (LLM judge)
- **Tool Selection** — Were the right tools chosen? (LLM judge)
- **Tool Response Handling** — Did the agent use tool results properly? (LLM judge)
- **Format Compliance** — Does the response follow markdown formatting rules? (LLM judge)
- **Image URL Correctness** — Do all image URLs match `/product-images/toy-XXX.png`? (code)
- **Tool Call Count** — Appropriate number of tool calls? (code)

### AX (UI-driven)

```bash
cd ax/mastra

# Generate traces (25 synthetic requests)
set -a && source .env.local && set +a && npx tsx --conditions=import evals/synthetic-requests.ts
```

After generating traces, configure the same 6 evaluators in the [Arize AX console](https://app.arize.com) using LLM-as-a-Judge and Code Evaluator task types. See [ax/mastra/evals/README.md](ax/mastra/evals/README.md) for step-by-step setup instructions with prompt templates and code.

## What You Can Learn

- **Framework comparison**: How does defining tools, agents, and streaming differ between Mastra and LangChain.js?
- **Production patterns**: Streaming architecture, vector search with fallbacks, in-memory order management, and structured tool schemas with Zod.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web framework | Next.js 16 (App Router) |
| Python backend | FastAPI + uvicorn (`langchain-py` only) |
| Styling | Tailwind CSS |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0 |
| LLM | Anthropic Claude Sonnet |
| Vector search | ChromaDB + all-MiniLM-L6-v2 embeddings |
| Product images | AI-generated (gpt-image-1) |

## License

MIT
