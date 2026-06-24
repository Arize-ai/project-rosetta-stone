# Wonder Toys — Vercel Eve + Arize AX

This is the Arize AX-instrumented version of the Wonder Toys shopping agent built with Vercel Eve. It is identical to `no-observability/eve` except for the observability files inside the Eve project (`eve-agent/agent/instrumentation.ts` + `eve-agent/agent/root-aware-processor.ts`), the observability dependencies in `eve-agent/package.json`, and the `ARIZE_*` env vars.

## Observability

`eve-agent/agent/instrumentation.ts` is auto-discovered by Eve (root-only slot) and runs before agent code. It calls `registerOTel` with an OTLP exporter pointed at `https://otlp.arize.com/v1/traces` (auth via `space_id` / `api_key` headers). The exporter is wrapped in `RootAwareOpenInferenceProcessor` (`eve-agent/agent/root-aware-processor.ts`), which keeps only OpenInference spans plus Eve's `ai.eve.turn` workflow span and promotes `ai.eve.turn` to the trace root — so each turn lands as a single un-orphaned root in Arize.

Eve is a **filesystem-first agent runtime** with its own dev server and HTTP channel — it is not an in-process library like the Vercel AI SDK or Mastra tiers. So this tier follows the repo's **separate-backend + Next.js-proxy pattern** (the same shape the Python/FastAPI tiers use): the Eve agent runs as its own dev server, and the Next.js frontend proxies the chat endpoint to it.

## Architecture

```
agent/                          — The Eve agent project (separate runtime)
├── agent.ts                    — defineAgent({ model: "anthropic/claude-sonnet-4.6" })
├── instructions.md             — System prompt (always-on)
├── tools/
│   ├── search_products.ts      — Vector search (ChromaDB) with keyword fallback
│   ├── get_product.ts          — Single product detail lookup
│   ├── purchase.ts             — Purchase flow (deducts inventory, creates order)
│   ├── order_status.ts         — Order lookup by ID, user, or product search
│   └── cancel_order.ts         — Cancel non-delivered orders (restores inventory)
├── lib/
│   ├── inventory.ts            — 200 products (copied from the frontend lib)
│   ├── orders.ts               — In-memory order store
│   └── chroma.ts               — ChromaDB client wrapper with graceful fallback
└── package.json                — Eve + ai + zod + chromadb

src/                            — Next.js frontend (copied from no-observability/vercel-ai-sdk)
├── app/
│   ├── api/chat/route.ts       — Proxies to the Eve HTTP channel + NDJSON→SSE translation
│   ├── api/products/           — REST endpoints for featured products and product detail
│   ├── api/auth/               — NextAuth route handler
│   ├── page.tsx                — Home page (top 5 products, category chips, chat)
│   ├── product/[id]/           — Product detail page with add-to-cart
│   ├── cart/                   — Shopping cart page (sessionStorage-backed)
│   └── login/                  — Login page
├── lib/
│   ├── inventory.ts            — 200 products (used by the products REST routes)
│   ├── orders.ts               — In-memory order store
│   └── auth.ts                 — NextAuth config (Twitter/X OAuth 2.0)
scripts/
├── start.sh                    — Dev startup (ChromaDB + indexing + Eve dev server + Next.js)
└── index-products.ts           — Index 200 products into ChromaDB
```

## How the agent runs

Eve is filesystem-first: you author capabilities under `agent/` and Eve runs the
model loop, persists every session, and serves the agent over its built-in HTTP
channel:

- `POST /eve/v1/session` — start a session (async; returns `202` with an
  `x-eve-session-id` header and a `{ sessionId, continuationToken }` body)
- `GET /eve/v1/session/<id>/stream` — NDJSON event stream
  (`session.started`, `actions.requested`, `action.result`, `message.appended`
  deltas, `message.completed`, `session.completed`)

`scripts/start.sh` boots the Eve dev server on port `2000`
(`eve dev --port 2000 --no-ui` — `--no-ui` is required in non-TTY contexts) and
waits for it to listen before starting Next.js on `3000`.

## The chat proxy (`src/app/api/chat/route.ts`)

The Next.js chat route:

1. Resolves `userId` from the NextAuth session (or the `x-eval-secret` /
   `x-eval-user-id` bypass header for headless smoke tests).
1. POSTs the latest user message to the Eve HTTP channel, passing the `userId`
   as `clientContext` (Eve surfaces it to the model as `Client context: ...`).
1. Attaches to the session NDJSON stream and **translates it into the Wonder
   Toys SSE shape** (`data: {"text":"..."}\n\n` ... `data: [DONE]\n\n`). It
   diffs `message.appended` cumulative text into deltas and injects a `\n\n`
   paragraph break when text resumes after a tool call, so product cards render
   correctly.

## userId threading

Eve tools receive a `userId` argument the same way the vercel-ai-sdk tier does:
the system prompt tells the model the authenticated user's ID (delivered via
`clientContext`), and the model passes it into the `userId` argument of the
`purchase`, `order_status`, and `cancel_order` tools.

## What differs in observability tiers

When creating `phoenix/eve` or `ax/eve`, the ONLY differences are observability,
all inside the `agent/` project:

- **`agent/instrumentation.ts`** — new file. `defineInstrumentation` +
  `registerOTel` wiring the OTLP exporter.
- **`agent/root-aware-processor.ts`** — new file. `RootAwareOpenInferenceProcessor`
  promotes Eve's `ai.eve.turn` workflow span to the trace root.
- **`agent/package.json`** — observability dependencies.
- **`env.example`** — observability environment variables.

Do not let non-observability code (the frontend, tools, libs, start script) drift
between tiers.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Eve dev server + Next.js
npm run dev:next   # Next.js only (chat will 502 until the Eve agent is running)
```
