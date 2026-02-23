# Rosetta Stone: AI Agent Framework Comparison

This project implements the same AI shopping agent ("Wonder Toys") across multiple frameworks to compare developer experience, observability integration complexity, and framework ergonomics.

## Project Structure

```
rosetta/
├── product-images/      — Generated product images (shared across all tiers via symlinks)
├── no-observability/    — Baseline agents with no observability instrumentation
│   ├── mastra/            — Mastra framework (TypeScript)
│   ├── langchain-js/      — LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/      — LangChain / LangGraph (Python + Next.js)
│   └── llamaindex-py/     — LlamaIndex (Python + Next.js)
├── phoenix/             — Agents instrumented with Arize Phoenix Cloud
│   ├── mastra/            — Mastra framework (TypeScript)
│   ├── langchain-js/      — LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/      — LangChain / LangGraph (Python + Next.js)
│   └── llamaindex-py/     — LlamaIndex (Python + Next.js)
└── ax/                  — Agents instrumented with Arize AX
    ├── mastra/            — Mastra framework (TypeScript)
    ├── langchain-js/      — LangChain.js / LangGraph (TypeScript)
    ├── langchain-py/      — LangChain / LangGraph (Python + Next.js)
    └── llamaindex-py/     — LlamaIndex (Python + Next.js)
```

Each top-level directory represents an observability tier. Within each, subdirectories hold the same agent implemented in different frameworks.

## The Agent

"Wonder Toys" is a chat-to-purchase toy store assistant. It can:
- Search a 200-product fake inventory via semantic vector search (ChromaDB + default embeddings) with fallback to keyword matching; supports filtering by age range and category (returns top 10 results)
- Show rich product details with images, ratings, dimensions, manufacturer info, and marketing copy
- Process purchases (credit card assumed on file; asks for shipping address including country — no geographic restrictions)
- Track order status by order ID or natural language product search
- Cancel orders that are still processing or shipping (delivered orders cannot be cancelled; cancellation restores inventory)

Product images and the store logo are AI-generated (gpt-image-1) and stored in `product-images/` at the repo root, symlinked into each tier's `public/product-images/` directory. The agent uses markdown image syntax with local paths (e.g. `![name](/product-images/toy-001.png)`) to display them in the chat UI. Product images in chat link to standalone product detail pages (`/product/[id]`).

The home page shows the top 5 products by best seller rank and category browse chips. Chat state is persisted in sessionStorage so it survives navigation to product pages. The UI includes a shopping cart (persisted in sessionStorage) — users can add items from chat product cards or product detail pages, then checkout from the cart page which sends the purchase request to the chat agent.

The chat UI renders product results as custom `ProductCard` components (image + "Add to Cart" button on the left, product details on the right) by pre-parsing the agent's markdown into typed segments before rendering.

The agent uses Claude (Anthropic) as the LLM and X (Twitter) OAuth for authentication.

## Editing Rules

**The `no-observability` version is the canonical baseline.** When making changes to the agent logic, tools, inventory, UI, or any shared functionality:

1. Make the change in `no-observability/` first
2. Copy the same change to `phoenix/` and `ax/`
3. The **only** differences between tiers should be observability-related

### What differs between tiers (by framework)

**Mastra** (TypeScript monolith):
- `src/mastra/index.ts` — observability config in the Mastra constructor
- `next.config.ts` — `serverExternalPackages` entries for observability packages
- `package.json` — observability package dependencies
- `env.example` — observability-related environment variables

**LangChain.js** (TypeScript monolith):
- `src/langchain/agent.ts` — observability setup at the top of the file
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

**LangChain Python** and **LlamaIndex Python** (Python backend + Next.js frontend):
- `backend/tracing.py` — **New file** in observability tiers (Phoenix or AX initialization)
- `backend/agent.py` — LlamaIndex only: manual root span + OTel context management
- `backend/main.py` — `import backend.tracing` added before framework imports
- `backend/requirements.txt` — observability packages added
- `env.example` — observability environment variables
- `evals/` — **New directory** in observability tiers (synthetic requests + eval harness)

Do not let non-observability code drift between the tiers.

## Tech Stacks

### Mastra (TypeScript)
- **Framework**: Mastra (`@mastra/core`) with Vercel AI SDK
- **LLM**: Anthropic Claude via `@ai-sdk/anthropic`
- **Web**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Vector Search**: ChromaDB (local server) with `@chroma-core/default-embed` (all-MiniLM-L6-v2)
- **Observability** (phoenix): `@mastra/observability` + `@mastra/arize` → Phoenix Cloud
- **Observability** (ax): `@mastra/observability` + `@mastra/arize` → Arize AX

### LangChain.js (TypeScript)
- **Framework**: LangChain.js + LangGraph (`@langchain/langgraph` ReAct agent)
- **LLM**: `@langchain/anthropic`
- **Web**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Vector Search**: ChromaDB (local server) with `@chroma-core/default-embed`
- **Observability** (phoenix): `@arizeai/phoenix-otel` + `@arizeai/openinference-langchain`
- **Observability** (ax): raw OpenTelemetry

### LangChain Python
- **Framework**: LangChain + LangGraph (`langgraph` ReAct agent)
- **LLM**: `langchain-anthropic`
- **Backend**: FastAPI + uvicorn (port 8001)
- **Frontend**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Vector Search**: ChromaDB (local server, default embeddings)
- **Observability** (phoenix): `arize-phoenix-otel` + `openinference-instrumentation-langchain`
- **Observability** (ax): `arize-otel` + `openinference-instrumentation-langchain`

### LlamaIndex Python
- **Framework**: LlamaIndex (`llama_index.core.agent.workflow.FunctionAgent`)
- **LLM**: `llama_index.llms.anthropic.Anthropic`
- **Backend**: FastAPI + uvicorn (port 8001)
- **Frontend**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Vector Search**: ChromaDB (local server, default embeddings)
- **Observability** (phoenix): `arize-phoenix-otel` + `openinference-instrumentation-llama-index`
- **Observability** (ax): `arize-otel` + `openinference-instrumentation-llama-index`

## Running

`npm run dev` handles everything automatically via `scripts/start.sh`:
1. Creates a Python venv and installs ChromaDB if needed (requires `uv`)
2. Starts ChromaDB server if not already running
3. Indexes all 200 products if the collection is missing or incomplete
4. Starts the dev server (Next.js for JS frameworks; Python backend + Next.js for Python frameworks)

For Python frameworks (`langchain-py`, `llamaindex-py`), the start script also installs Python backend dependencies and starts a FastAPI server on port 8001. The Next.js frontend proxies API calls to it.

The ChromaDB data (`chroma-data/`) and Python venv (`.venv/`) live at the repo root and are gitignored. All tiers share the same ChromaDB instance.

To run Next.js without ChromaDB: `npm run dev:next` (search falls back to keyword matching).

## Environment Variables

See `env.example` in each directory. Key variables:
- `ANTHROPIC_API_KEY` — Claude API key
- `NEXTAUTH_SECRET` — session encryption (`openssl rand -base64 32`)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — X OAuth app credentials
- `CHROMA_URL` — ChromaDB server URL (default: `http://localhost:8000`)
- `BACKEND_SECRET` / `BACKEND_URL` — Python backend auth (langchain-py and llamaindex-py only)
- `PHOENIX_COLLECTOR_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME` — Phoenix Cloud (phoenix tier only); Mastra and LangChain.js need the full OTLP URL including `/v1/traces`, Python frameworks expect just the base URL
- `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME` — Arize AX (ax tier only)

## Streaming Architecture

### TypeScript frameworks (Mastra, LangChain.js)

The chat API route (`src/app/api/chat/route.ts`) uses framework-specific streaming to iterate over events and yield SSE chunks. The route injects `\n\n` paragraph breaks when text resumes after a tool call so pre-tool and post-tool text don't run together.

### Python frameworks (LangChain Python, LlamaIndex Python)

The Python backend (`backend/agent.py`) streams SSE events via FastAPI's `StreamingResponse`. The Next.js frontend proxies to `POST /chat` on port 8001. The same `\n\n` paragraph break injection applies.

**React Strict Mode caveat**: In dev mode, React calls state updater functions and effects twice. Avoid calling `fetch` or other side effects inside `setMessages` updaters — do it outside. Use refs to guard effects that should only fire once (e.g., the `?ask=` query parameter handler).

## LlamaIndex + OpenInference Tracing Quirks

The LlamaIndex `FunctionAgent` requires three manual workarounds for proper OpenInference tracing (see `phoenix/llamaindex-py/README.md` for full details):
1. **Clean OTel context per request** — `otel_context.attach(otel_context.Context())`
2. **Manual root span** — `_tracer.start_as_current_span("agent")` with `input.value`/`output.value`
3. **`await handler` after `stream_events()`** — forces workflow dispatcher spans to close

All three are required. Remove any one and traces break.

## Adding a New Framework

To add a new framework:
1. Create `no-observability/<framework>/` with the same agent behavior
2. Create `phoenix/<framework>/` with Phoenix instrumentation added
3. Create `ax/<framework>/` with Arize AX instrumentation added
4. Keep the same inventory data, tool behavior, and UI flow so comparisons are fair
