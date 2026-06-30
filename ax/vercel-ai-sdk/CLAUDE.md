# Wonder Toys — Vercel AI SDK + Arize AX

This is the Arize AX-instrumented version of the Wonder Toys shopping agent built with the Vercel AI SDK directly (no Mastra).

## Architecture

```
src/
├── ai/
│   ├── agent.ts              — Model, tools object, and SYSTEM_PROMPT
│   └── tools/
│       ├── search-products.ts — Vector search (ChromaDB) with keyword fallback
│       ├── get-product.ts     — Single product detail lookup
│       ├── purchase.ts        — Purchase flow (deducts inventory, creates order)
│       ├── order-status.ts    — Order lookup by ID, user, or product search
│       └── cancel-order.ts    — Cancel non-delivered orders (restores inventory)
├── lib/
│   ├── inventory.ts          — 200 products (in-memory array, typed as Product[])
│   ├── orders.ts             — In-memory order store (Map, resets on restart)
│   ├── chroma.ts             — ChromaDB client wrapper with graceful fallback
│   └── auth.ts               — NextAuth config (Twitter/X OAuth 2.0)
├── app/
│   ├── api/chat/route.ts     — Streaming chat endpoint (SSE via fullStream)
│   ├── api/products/         — REST endpoints for featured products and product detail
│   ├── api/auth/             — NextAuth route handler
│   ├── page.tsx              — Home page (top 5 products, category chips, chat)
│   ├── product/[id]/         — Product detail page with add-to-cart
│   ├── cart/                 — Shopping cart page (sessionStorage-backed)
│   └── login/                — Login page
└── instrumentation.ts        — OTel setup: registerTelemetry (AI SDK v7) + registerOTel + OpenInferenceSimpleSpanProcessor
scripts/
├── start.sh                  — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts         — Index 200 products into ChromaDB
```

## Observability (AX-specific)

The files that differ from `no-observability/vercel-ai-sdk` for observability reasons:

- **`src/instrumentation.ts`** — Calls AI SDK v7's `registerTelemetry(new OpenTelemetry(...))` (from `ai` + `@ai-sdk/otel`) to enable telemetry, then registers OTel via `@vercel/otel`'s `registerOTel` with a stock `OpenInferenceSimpleSpanProcessor` (`@arizeai/openinference-vercel` v3) and an `OTLPTraceExporter` pointing at `otlp.arize.com` (auth via `ARIZE_SPACE_ID` / `ARIZE_API_KEY` headers). The processor uses `spanFilter: isOpenInferenceSpan` + `reparentOrphanedSpans: true` — the v3 flag that re-roots AI spans whose non-AI (HTTP) parent the filter dropped, replacing the old custom `RootAwareOpenInferenceProcessor`. `propagateContextAttributes` (default `true`) copies the session id onto every AI span.
- **`src/app/api/chat/route.ts`** — Reads `x-session-id` header; wraps `streamText` call in `context.with(setSession(...))` so `propagateContextAttributes` carries the session ID onto all AI spans. Uses AI SDK v7 `telemetry: { functionId }` (not v6's `experimental_telemetry`).
- **`src/components/Chat.tsx`** — Generates a UUID session ID on first load (persisted in `sessionStorage`), rotates it on new chat, sends it as `x-session-id` header.
- **`next.config.ts`** — `serverExternalPackages` includes OTel, `@ai-sdk/otel`, and OpenInference packages.
- **`package.json`** — Adds `@vercel/otel`, `@ai-sdk/otel`, `@opentelemetry/*`, `@arizeai/openinference-vercel` (v3), `@arizeai/openinference-core`.
- **`env.example`** — Adds `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`.

Arize AX env vars (`ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`) are in `.env.local`.

### Phoenix vs AX exporter difference

Phoenix uses `PHOENIX_COLLECTOR_ENDPOINT` (full OTLP URL) + `Authorization: Bearer` header.
AX uses `https://otlp.arize.com/v1/traces` with `space_id` and `api_key` headers.

## Key Implementation Details

- **`maxSteps: 10`** — required for multi-turn tool use; Mastra handles this internally but the raw Vercel AI SDK requires it explicitly.
- **`part.text`** — the Vercel AI SDK v7 `fullStream` text-delta event uses `part.text`; Mastra re-wraps it as `part.payload.text`.
- **AI SDK v7 telemetry** — telemetry is enabled globally by `registerTelemetry(new OpenTelemetry(...))` in `instrumentation.ts`; the chat route passes `telemetry: { functionId }` only for the span name. v6's `experimental_telemetry: { isEnabled: true }` no longer exists. AI SDK v7 requires Node 22+ and is ESM-only.
- **`system` parameter** — user context is appended to the system string passed to `streamText()`; in Mastra it was injected as a `role: "system"` message in the messages array.
- **Streaming**: same custom SSE format as Mastra (`data: {"text":"..."}\n\n` / `data: [DONE]\n\n`) so Chat.tsx is unchanged.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
