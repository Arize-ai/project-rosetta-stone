# Wonder Toys — OpenAI Agents SDK (TypeScript) — No Observability

The **OpenAI Agents JS SDK** variant of the Wonder Toys shopping agent. Baseline tier with no observability instrumentation — same agent, tools, and UI as every other Rosetta Stone tier, but driven by `@openai/agents`.

## Architecture

A Next.js monolith: the agent, tools, and UI all live in one app.

| Layer | Implementation |
|---|---|
| LLM | Native OpenAI Responses API via `model: "gpt-5.4-mini"` (the SDK can route through `@ai-sdk/anthropic` via `@openai/agents-extensions`, but the native path keeps the OpenInference tracing surface clean — matching the Python `openai-agents-py` tier) |
| Agent | `Agent` from `@openai/agents` with the system prompt as `instructions` |
| Tools | `tool({ name, description, parameters: zod-v4, execute })` from `@openai/agents` |
| Memory | Stateless per request — `AgentInputItem[]` rebuilt from the client's message history each call (`user(...)` / `assistant(...)` helpers) |
| Streaming | `await run(agent, history, { stream: true, maxTurns: 10 })` → iterate `stream.toStream()` → custom SSE (`data: {"text":"..."}\n\n`) |
| Vector search | ChromaDB + `@chroma-core/default-embed` (all-MiniLM-L6-v2) |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0, with an `x-eval-secret` header bypass for headless smoke tests |
| UI | Next.js App Router + Tailwind CSS v4 |

## Key Files

| File | Purpose |
|---|---|
| `src/ai/agent.ts` | `Agent` constructor, system prompt, model name |
| `src/ai/tools/` | 5 tool definitions using `@openai/agents`' `tool()` |
| `src/app/api/chat/route.ts` | Streaming chat endpoint (SSE) — pulls `output_text_delta` off `raw_model_stream_event` and injects `\n\n` between pre-tool and post-tool text |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `src/lib/inventory.ts` | 200-product in-memory database |
| `src/lib/orders.ts` | In-memory order store |
| `src/lib/chroma.ts` | ChromaDB client wrapper |
| `scripts/start.sh` | Dev startup: ChromaDB + indexing + Next.js |

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB, indexes products, runs Next.js
```

To skip ChromaDB (search falls back to keyword matching):

```bash
npm run dev:next
```

## Environment Variables

See `env.example`. Required variables:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key — used by the Responses API |
| `NEXTAUTH_URL` | Callback URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session encryption key (`openssl rand -base64 32`) |
| `TWITTER_CLIENT_ID` | X OAuth app client ID |
| `TWITTER_CLIENT_SECRET` | X OAuth app client secret |
| `EVAL_SECRET` | Optional — when set, `x-eval-secret: <value>` skips NextAuth (used by smoke / eval harnesses) |

## What the observability tiers add

`phoenix/openai-agents-ts/` and `ax/openai-agents-ts/` differ from this tier only in:

- A new `instrumentation.ts` at the project root (Next.js auto-detects it).
- A new `src/ai/tracing.ts` that builds an OTel tracer provider and calls `new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)`. The instrumentor implements the SDK's first-class `TracingProcessor` interface — no monkey-patching.
- Observability dependencies in `package.json` + corresponding entries in `serverExternalPackages` in `next.config.ts`.
- Phoenix uses `@arizeai/phoenix-otel`'s `register()`; AX builds the provider by hand and wraps the OTLP exporter in `OpenInferenceSimpleSpanProcessor` (from `@arizeai/openinference-vercel`).
