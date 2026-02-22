# Wonder Toys — LangChain.js + Phoenix Cloud

This is the Phoenix Cloud-instrumented version of the Wonder Toys shopping agent built with LangChain.js.

## Architecture

```
src/
├── langchain/
│   ├── agent.ts               — LangGraph ReAct agent + Phoenix observability setup
│   └── tools/
│       ├── search-products.ts — Vector search (ChromaDB) with keyword fallback
│       ├── get-product.ts     — Single product detail lookup
│       ├── purchase.ts        — Purchase flow (deducts inventory, creates order)
│       ├── order-status.ts    — Order lookup by ID, user, or product search
│       └── cancel-order.ts    — Cancel non-delivered orders (restores inventory)
├── lib/
│   ├── inventory.ts           — 200 products (in-memory array, typed as Product[])
│   ├── orders.ts              — In-memory order store (Map, resets on restart)
│   ├── chroma.ts              — ChromaDB client wrapper with graceful fallback
│   └── auth.ts                — NextAuth config (Twitter/X OAuth 2.0)
├── components/
│   ├── Chat.tsx               — Main chat component
│   ├── CartContext.tsx         — Cart state management
│   ├── CartIcon.tsx            — Cart icon with badge
│   └── SessionProvider.tsx     — NextAuth provider wrapper
├── app/
│   ├── api/chat/route.ts      — Streaming chat endpoint (SSE via streamEvents)
│   ├── api/products/          — REST endpoints for featured products and product detail
│   ├── api/auth/              — NextAuth route handler
│   ├── page.tsx               — Home page (top 5 products, category chips, chat)
│   ├── product/[id]/          — Product detail page with add-to-cart
│   ├── cart/                  — Shopping cart page (sessionStorage-backed)
│   └── login/                 — Login page
scripts/
├── start.sh                   — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts          — Index 200 products into ChromaDB
```

## Observability (Phoenix-specific)

The only file that differs from `no-observability/langchain-js` for observability reasons:

- **`src/langchain/agent.ts`** — At the top of the file (before any LangChain imports), registers Phoenix via `@arizeai/phoenix-otel` and instruments LangChain via `@arizeai/openinference-instrumentation-langchain`:
  ```typescript
  import { register } from "@arizeai/phoenix-otel";
  import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";
  import * as CallbackManagerModule from "@langchain/core/callbacks/manager";

  register({ projectName: "...", url: process.env.PHOENIX_COLLECTOR_ENDPOINT, apiKey: process.env.PHOENIX_API_KEY });
  new LangChainInstrumentation().manuallyInstrument(CallbackManagerModule);
  ```
- **`next.config.ts`** — `serverExternalPackages` adds `@arizeai/phoenix-otel` and `@arizeai/openinference-instrumentation-langchain`.
- **`package.json`** — Adds `@arizeai/phoenix-otel` and `@arizeai/openinference-instrumentation-langchain`.

Phoenix Cloud env vars (`PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`) are in `.env.local`. The endpoint must be the full OTLP URL including `/v1/traces`.

### LangChain.js vs Mastra observability approach

Unlike Mastra (which uses `@mastra/observability` + `@mastra/arize`), LangChain.js uses OpenInference instrumentation directly. The `register()` call sets up OpenTelemetry, and `LangChainInstrumentation` patches LangChain's callback manager to emit spans. This must happen before any LangChain clients are created.

## Key Implementation Details

- **Streaming**: The chat route uses LangChain's `streamEvents` API (v2). It extracts text from `event.data.chunk.content`, handling both string content and Anthropic's array-of-blocks format. Injects `\n\n` paragraph breaks when text resumes after a tool call.
- **Vector search**: ChromaDB with `@chroma-core/default-embed` (all-MiniLM-L6-v2). Supports metadata filters for age range and category. Falls back to substring matching if ChromaDB is unavailable.
- **Orders**: In-memory `Map<string, Order>` — resets on process restart. Order status is randomly assigned on each check (simulates progression).
- **Inventory**: Mutable — purchases deduct stock, cancellations restore it. Resets on restart.
- **Auth**: Twitter/X OAuth 2.0 via NextAuth v4. The chat route prepends a system message with the authenticated user's ID.
- **Product images**: AI-generated, stored in repo root `product-images/`, symlinked to `public/product-images/`. Agent uses markdown image syntax with local paths.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
