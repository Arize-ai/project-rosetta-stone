# Wonder Toys — Vercel AI SDK + Phoenix Cloud

This is the Phoenix Cloud-instrumented version of the Wonder Toys shopping agent built with the Vercel AI SDK directly (no Mastra).

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
└── instrumentation.ts        — OTel setup via registerOTel + stock OpenInferenceSimpleSpanProcessor (reparentOrphanedSpans) + @ai-sdk/otel registerTelemetry
scripts/
├── start.sh                  — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts         — Index 200 products into ChromaDB
```

## Observability (Phoenix-specific)

The files that differ from `no-observability/vercel-ai-sdk` for observability reasons:

- **`src/instrumentation.ts`** — Registers OTel via `@vercel/otel`'s `registerOTel` with the stock `OpenInferenceSimpleSpanProcessor` (`spanFilter: isOpenInferenceSpan` + `reparentOrphanedSpans: true`, ≥ `@arizeai/openinference-vercel` 2.8.0) and an `OTLPTraceExporter` pointing at `PHOENIX_COLLECTOR_ENDPOINT`. Sets `SEMRESATTRS_PROJECT_NAME` as a resource attribute for Phoenix project routing. `reparentOrphanedSpans` drops non-AI spans and re-roots any orphaned AI span, replacing the old custom `RootAwareOpenInferenceProcessor`. Also calls `registerTelemetry(new OpenTelemetry())` from `@ai-sdk/otel` — AI SDK v7 removed built-in OTel tracing, so this bridge is required for any spans to emit.
- **`src/app/api/chat/route.ts`** — Sets `experimental_telemetry: { isEnabled: true }` on the `streamText` call (plus the `x-eval-secret` bypass for headless evals). Otherwise identical to the no-observability route.
- **`next.config.ts`** — `serverExternalPackages` includes OTel, OpenInference, and `@ai-sdk/otel` packages.
- **`package.json`** — Adds `@ai-sdk/otel`, `@vercel/otel`, `@opentelemetry/*`, `@arizeai/openinference-vercel`, `@arizeai/openinference-semantic-conventions`.
- **`env.example`** — Adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`.

Session grouping was intentionally dropped when migrating to `reparentOrphanedSpans` — the stock processor does not propagate a session ID from OTel context, so `route.ts` and `Chat.tsx` no longer differ from the no-observability tier for session handling.

Phoenix Cloud env vars (`PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`) are in `.env.local`. The endpoint must be the full OTLP URL including `/v1/traces`.

### Phoenix vs AX exporter difference

Phoenix uses `PHOENIX_COLLECTOR_ENDPOINT` (full OTLP URL) + `Authorization: Bearer` header.
AX uses `https://otlp.arize.com/v1/traces` with `space_id` and `api_key` headers.

## Key Implementation Details

- **`maxSteps: 10`** — required for multi-turn tool use; Mastra handles this internally but the raw Vercel AI SDK requires it explicitly.
- **`part.text`** — the Vercel AI SDK v7 `fullStream` text-delta event uses `part.text`; Mastra re-wraps it as `part.payload.text`.
- **`system` parameter** — user context is appended to the system string passed to `streamText()`; in Mastra it was injected as a `role: "system"` message in the messages array.
- **Streaming**: same custom SSE format as Mastra (`data: {"text":"..."}\n\n` / `data: [DONE]\n\n`) so Chat.tsx is unchanged.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
