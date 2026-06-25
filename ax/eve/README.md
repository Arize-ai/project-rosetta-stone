# Wonder Toys — Vercel Eve (Arize AX Instrumented)

This is the **Vercel Eve** variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

Eve is a **filesystem-first agent runtime** with its own dev server and HTTP channel — not an in-process library like the Vercel AI SDK or Mastra tiers. So this tier uses the repo's **separate-backend + Next.js-proxy pattern** (the same shape the Python/FastAPI tiers use): the Eve agent runs as its own dev server, and the Next.js frontend proxies the chat endpoint to it.

## Observability Setup

Tracing is configured inside the Eve project (`eve-agent/`):

- **`eve-agent/agent/instrumentation.ts`** — auto-discovered by Eve (root-only
  slot), runs before agent code. Calls `registerOTel` with an
  `OTLPTraceExporter` pointed at `https://otlp.arize.com/v1/traces` (authed with
  `space_id` / `api_key` headers), wrapped in the stock
  `OpenInferenceSimpleSpanProcessor` (`@arizeai/openinference-vercel` ≥ 2.8.0)
  with `spanFilter: isOpenInferenceSpan` and `reparentOrphanedSpans: true`.
  `reparentOrphanedSpans` drops non-AI spans, re-roots orphaned AI spans, and
  tags Eve's `ai.eve.turn` wrapper as an agent span so each turn lands in Arize
  as a single un-orphaned root (`ai.eve.turn`) with the gen_ai spans beneath it.
  Eve manages its own AI SDK telemetry, so no `@ai-sdk/otel` / `registerTelemetry`
  is needed.

Set `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, and `ARIZE_PROJECT_NAME` in `.env.local`.

## Architecture

The Eve agent lives in its own project (`eve-agent/`), and a Next.js frontend (copied from `no-observability/vercel-ai-sdk/`) proxies chat to it.

| Layer | Implementation |
|---|---|
| Runtime | Eve (`eve` npm package) — filesystem-first agent runtime, own dev server |
| LLM | `anthropic/claude-sonnet-4.6` via the Vercel AI Gateway |
| Agent loop | Eve's built-in tool-loop harness (durable sessions) |
| Tools | `defineTool()` from `eve/tools` with Zod input schemas |
| Channel | Eve's built-in HTTP channel (`POST /eve/v1/session`, `GET .../stream` NDJSON) |
| Chat proxy | `src/app/api/chat/route.ts` — translates Eve NDJSON → Wonder Toys SSE |
| Vector search | ChromaDB + `@chroma-core/default-embed` (all-MiniLM-L6-v2) |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0 |
| UI | Next.js App Router + Tailwind CSS v4 |

## Key Files

| File | Purpose |
|---|---|
| `eve-agent/agent/agent.ts` | `defineAgent({ model: "anthropic/claude-sonnet-4.6" })` |
| `eve-agent/agent/instructions.md` | Always-on system prompt |
| `eve-agent/agent/tools/` | 5 tools using `defineTool()` (`search_products`, `get_product`, `purchase`, `order_status`, `cancel_order`) |
| `eve-agent/agent/lib/` | `inventory.ts`, `orders.ts`, `chroma.ts` (shared ChromaDB inventory) |
| `src/app/api/chat/route.ts` | Proxies to the Eve HTTP channel + NDJSON→SSE translation |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup: ChromaDB + indexing + Eve dev server + Next.js |

## How it works

1. `scripts/start.sh` boots the Eve dev server on port `2000`
   (`eve dev --port 2000 --no-ui`), waits for it to listen, then starts Next.js
   on `3000`.
1. The Next.js chat route resolves the `userId` (NextAuth session, or the
   `x-eval-secret` / `x-eval-user-id` bypass header for headless smoke tests),
   `POST`s the user message to the Eve HTTP channel with the `userId` as
   `clientContext`, then attaches to the NDJSON stream.
1. It translates Eve's `message.appended` deltas into the Wonder Toys SSE shape
   (`data: {"text":"..."}\n\n` ... `data: [DONE]\n\n`), injecting a `\n\n`
   paragraph break when text resumes after a tool call so product cards render
   correctly.

## Running

```bash
cp env.example .env.local   # fill in AI_GATEWAY_API_KEY + auth secrets
npm install
(cd eve-agent && npm install)
npm run dev                 # ChromaDB + indexing + Eve dev server + Next.js
```

To run Next.js alone (chat returns 502 until the Eve agent is up):

```bash
npm run dev:next
```

## Environment Variables

See `env.example`. Required variables:

| Variable | Description |
|---|---|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (routes the Claude model) |
| `EVE_PORT` / `EVE_URL` | Eve dev server port / base URL the chat route proxies to |
| `NEXTAUTH_URL` | Callback URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session encryption key (`openssl rand -base64 32`) |
| `TWITTER_CLIENT_ID` | X OAuth app client ID |
| `TWITTER_CLIENT_SECRET` | X OAuth app client secret |
| `EVAL_SECRET` | Optional shared secret for the `/api/chat` eval-bypass header |

## Differences in observability tiers

`phoenix/eve` and `ax/eve` differ from this baseline only in observability, all
inside the `eve-agent/` project: a new `agent/instrumentation.ts` (which wires the
stock `OpenInferenceSimpleSpanProcessor` with `reparentOrphanedSpans: true` to
keep `ai.eve.turn` as the per-turn trace root), observability dependencies in
`eve-agent/package.json`, and observability env vars. Everything else is identical.
