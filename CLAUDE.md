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
│   ├── llamaindex-py/     — LlamaIndex (Python + Next.js)
│   ├── microsoft-agent-py/ — Microsoft Agent Framework (Python + Next.js)
│   ├── openai-agents-ts/  — OpenAI Agents SDK (TypeScript)
│   └── openai-voice/      — OpenAI Realtime API + Chat Completions (Python + Next.js)
├── phoenix/             — Agents instrumented with Arize Phoenix Cloud
│   ├── mastra/            — Mastra framework (TypeScript)
│   ├── langchain-js/      — LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/      — LangChain / LangGraph (Python + Next.js)
│   ├── llamaindex-py/     — LlamaIndex (Python + Next.js)
│   ├── microsoft-agent-py/ — Microsoft Agent Framework (Python + Next.js)
│   ├── openai-agents-ts/  — OpenAI Agents SDK (TypeScript)
│   └── openai-voice/      — OpenAI Realtime API + Chat Completions (Python + Next.js)
└── ax/                  — Agents instrumented with Arize AX
    ├── mastra/            — Mastra framework (TypeScript)
    ├── langchain-js/      — LangChain.js / LangGraph (TypeScript)
    ├── langchain-py/      — LangChain / LangGraph (Python + Next.js)
    ├── llamaindex-py/     — LlamaIndex (Python + Next.js)
    ├── openai-agents-ts/  — OpenAI Agents SDK (TypeScript)
    └── openai-voice/      — OpenAI Realtime API + Chat Completions (Python + Next.js)
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

The agent uses Claude (Anthropic) as the LLM for most tiers and X (Twitter) OAuth for authentication. The `openai-voice` tier is the exception — it uses OpenAI's `gpt-realtime` (voice mode) and `gpt-4o` (text-mode fallback) since the OpenAI Realtime API is what makes the voice flow possible.

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

**OpenAI Agents TypeScript** (Next.js monolith; all three tiers):
- `src/ai/tracing.ts` — **New file** in observability tiers. Phoenix calls `register({ projectName, url, apiKey, spanProcessors: [...] })` from `@arizeai/phoenix-otel`, passing a custom `OpenInferenceBatchSpanProcessor` with `spanFilter: isOpenInferenceSpan` (from `@arizeai/openinference-vercel`) — without it Next.js's auto-OTel pumps HTTP / fetch / page-render spans into the Phoenix project bucket alongside the agent spans. AX builds a `NodeTracerProvider` by hand, wraps the OTLP exporter in `OpenInferenceSimpleSpanProcessor`, and **does not call `provider.register()`** — making the provider global would have the same effect on AX. Both tiers then run `new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)`. The instrumentor is *not* a monkey-patch — it implements the agents SDK's first-class `TracingProcessor` interface and registers via `setTraceProcessors`.
- `instrumentation.ts` — **New file** at the project root. Next.js auto-detects it and calls `register()` once per server process at startup, before user-land modules load. Delegates to `initTracing()`.
- `src/app/api/chat/route.ts` — AX tier calls `getTracerProvider()?.forceFlush()` after `stream.completed` so spans drain out of the OTel batch buffer before the route handler exits.
- `next.config.ts` — adds the OI instrumentor + (for Phoenix) `@arizeai/phoenix-otel` to `serverExternalPackages` alongside `@openai/agents` so Turbopack doesn't try to bundle them.
- `package.json` — adds `@arizeai/openinference-instrumentation-openai-agents` + `@arizeai/openinference-semantic-conventions`, plus `@arizeai/phoenix-otel` (Phoenix) or `@arizeai/openinference-vercel` + OTel SDK packages (AX).
- `env.example` — adds `PHOENIX_*` (phoenix) or `ARIZE_*` (ax).

Both observability tiers use OpenAI's native Responses API (`model="gpt-5.4-mini"`), matching the Python `openai-agents-py` tier. The JS SDK could route through `@ai-sdk/anthropic` via `@openai/agents-extensions`, but the native path keeps the OpenInference tracing surface clean. The chat route threads conversation history through `AgentInputItem[]` rebuilt per request (`user(...)` / `assistant(...)` helpers) — no per-user `SQLiteSession` like the Python tier, since Next.js HTTP routes are stateless.

**OpenAI Voice** (Python FastAPI backend + Next.js frontend; all three tiers):
- `backend/tracing.py` — **New file** in observability tiers. AX uses `arize.otel.register(...)`, Phoenix uses `phoenix.otel.register(...)`, then both call `OpenAIAgentsInstrumentor().instrument(...)`. That instrumentor auto-traces both `agents.realtime.RealtimeSession` (voice) and `Agent` + `Runner` (text), producing the canonical OpenInference `AUDIO conversation.turn → USER user + LLM assistant → TOOL <tool_name>` span tree with no per-event glue code.
- `backend/main.py` — `import backend.tracing` added at the top so the instrumentor patches `agents.realtime` before the runtime imports it
- `backend/voice_agent.py` and `backend/chat_agent.py` — call `flush_traces()` in their `finally` blocks (the Agents SDK trace processors don't auto-flush in long-running servers)
- `backend/requirements.txt` — adds `arize-otel` (ax) or `arize-phoenix-otel` (phoenix), plus `openinference-instrumentation-openai-agents`
- `env.example` — adds `ARIZE_*` (ax) or `PHOENIX_*` (phoenix)
- `src/app/api/chat/route.ts` — eval-bypass header check (ax only)

Phoenix's `register(...)` call needs `protocol="http/protobuf"` — the gRPC default would rewrite the port from 6006 to 4317 and traces would never land. The AX call doesn't.

The shared `backend/tools.py` defines five `@function_tool` wrappers used by both the `RealtimeAgent` and the text `Agent`. Voice-mode result rendering happens via the `current_voice_callback` contextvar: tools that produce visual results (`search_products`, `get_product`) push markdown to the browser through that callback so product cards render in the chat panel alongside the spoken response. Text mode leaves the callback as `None` and the model emits markdown directly in its streamed response.

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

### Microsoft Agent Framework Python
- **Framework**: Microsoft Agent Framework (`agent-framework-anthropic`, pre-release)
- **LLM**: Claude (`claude-sonnet-4-20250514`) via `agent_framework.anthropic.AnthropicClient`
- **Backend**: FastAPI + uvicorn (port 8001)
- **Frontend**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Vector Search**: ChromaDB (local server, default embeddings)
- **Sessions**: Per-user `AgentSession` stored in memory; `**kwargs` injects `user_id` at runtime via `additional_function_arguments`
- **Observability** (phoenix): `arize-phoenix-otel` + `openinference-instrumentation-agent-framework` + `agent_framework.observability.enable_instrumentation`

### OpenAI Agents SDK (TypeScript)
- **Framework**: OpenAI Agents JS SDK (`@openai/agents` ≥ 0.11.6) — `Agent` + `run(agent, history, { stream: true })`, with `tool(...)` definitions driven by Zod v4 schemas
- **LLM**: Native OpenAI Responses API (`model="gpt-5.4-mini"`) — not Anthropic. The SDK can be routed through `@ai-sdk/anthropic` via `@openai/agents-extensions`, but the native path keeps the OpenInference tracing surface clean (matches the Python `openai-agents-py` tier convention)
- **Web**: Next.js (App Router, Tailwind CSS) — monolith, no separate Python backend
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0. The chat route honors an `x-eval-secret` / `x-eval-user-id` bypass header for headless smoke tests
- **Sessions**: Stateless per-request — conversation history is rebuilt as `AgentInputItem[]` from the messages the client sends (`user(...)` / `assistant(...)` helpers), then passed to `run()`. No `SQLiteSession` like the Python tier
- **Vector Search**: ChromaDB (local server, default embeddings) — shared with the Python tiers
- **Streaming**: `await run(agent, history, { stream: true })` → iterate `stream.toStream()` and pick up `raw_model_stream_event` → `output_text_delta` for token deltas, `run_item_stream_event` → `tool_call_item` for tool boundaries. Same `data: {...}\n\n` SSE shape every other tier emits
- **Observability** (phoenix): `@arizeai/phoenix-otel` + `@arizeai/openinference-instrumentation-openai-agents` (the instrumentor implements the SDK's native `TracingProcessor` interface — no monkey-patch)
- **Observability** (ax): `@arizeai/openinference-vercel`'s `OpenInferenceSimpleSpanProcessor` wrapping `@opentelemetry/exporter-trace-otlp-proto`'s `OTLPTraceExporter` pointed at `https://otlp.arize.com/v1/traces`, plus the same `@arizeai/openinference-instrumentation-openai-agents`. The AX tier deliberately skips `provider.register()` so Next.js's auto-OTel doesn't pump HTTP infra spans into the AX project

### OpenAI Voice (Python)
- **Framework**: OpenAI Agents SDK with the `realtime` extras — `agents.realtime.RealtimeAgent` + `RealtimeRunner` for voice, `agents.Agent` + `Runner` for the text fallback. Same `@function_tool` set drives both
- **LLM**: `gpt-realtime` for voice and `gpt-4o` for text
- **Backend**: FastAPI + uvicorn (port 8001) with a `/voice` WebSocket endpoint that bridges the browser to a `RealtimeSession`. The SDK owns the OpenAI Realtime WebSocket, VAD wiring, and tool dispatch — our handler only translates browser frames to/from SDK events
- **Frontend**: Next.js (App Router, Tailwind CSS) with a text/voice toggle in the chat header. Voice mode opens a browser WebSocket to the FastAPI backend, captures mic audio via an `AudioWorklet` (24 kHz mono PCM16), and plays back assistant audio via `AudioContext`-scheduled buffers
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0. WS auth uses a token + user_id in the query string (browsers can't set headers on WS upgrade), validated against the same `BACKEND_SECRET` the HTTP `/chat` route uses
- **Vector Search**: ChromaDB (local server, default embeddings) — shared with all other Python tiers
- **Tools**: 5 `@function_tool`-decorated functions in `backend/tools.py`, shared between voice and text mode. The Agents SDK derives JSON schemas from the type hints and handles dispatch
- **Observability** (phoenix): `arize-phoenix-otel` + `openinference-instrumentation-openai-agents`. The instrumentor patches both `RealtimeSession` and `Runner`, emitting the canonical OpenInference voice span tree (`AUDIO conversation.turn → USER + LLM + TOOL`) with audio captured as inline WAV data URIs on `input.audio.url` / `output.audio.url`
- **Observability** (ax): `arize-otel` + `openinference-instrumentation-openai-agents`. Same instrumentor as phoenix — only the tracer-provider `register(...)` call differs. Audio embeds as data URIs so the AX trace card audio player renders inline

## Running

`npm run dev` handles everything automatically via `scripts/start.sh`:
1. Creates a Python venv and installs ChromaDB if needed (requires `uv`)
2. Starts ChromaDB server if not already running
3. Indexes all 200 products if the collection is missing or incomplete
4. Starts the dev server (Next.js for JS frameworks; Python backend + Next.js for Python frameworks)

For Python frameworks (`langchain-py`, `llamaindex-py`, `microsoft-agent-py`, `openai-voice`), the start script also installs Python backend dependencies and starts a FastAPI server on port 8001. The Next.js frontend proxies HTTP API calls to it, and the `openai-voice` voice mode opens a WebSocket directly to `ws://localhost:8001/voice`.

The ChromaDB data (`chroma-data/`) and Python venv (`.venv/`) live at the repo root and are gitignored. All tiers share the same ChromaDB instance.

To run Next.js without ChromaDB: `npm run dev:next` (search falls back to keyword matching).

## Environment Variables

See `env.example` in each directory. Key variables:
- `ANTHROPIC_API_KEY` — Claude API key
- `NEXTAUTH_SECRET` — session encryption (`openssl rand -base64 32`)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — X OAuth app credentials
- `CHROMA_URL` — ChromaDB server URL (default: `http://localhost:8000`)
- `BACKEND_SECRET` / `BACKEND_URL` — Python backend auth (langchain-py, llamaindex-py, microsoft-agent-py, openai-voice only)
- `OPENAI_API_KEY` — OpenAI API key (openai-voice only)
- `NEXT_PUBLIC_VOICE_WS_URL` — Browser-side WS URL (openai-voice only; default `ws://localhost:8001/voice`)
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
