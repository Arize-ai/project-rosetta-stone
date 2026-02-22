# Wonder Toys — LangChain.js + Arize AX

This is the Arize AX-instrumented version of the Wonder Toys shopping agent built with LangChain.js.

## Architecture

```
src/
├── langchain/
│   ├── agent.ts               — LangGraph ReAct agent + Arize AX observability setup
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

## Observability (AX-specific)

The only file that differs from `no-observability/langchain-js` for observability reasons:

- **`src/langchain/agent.ts`** — At the top of the file (before any LangChain imports), sets up OpenTelemetry manually with `NodeTracerProvider` and `OTLPTraceExporter` pointing to `https://otlp.arize.com/v1/traces`, then instruments LangChain:
  ```typescript
  import { NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
  import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
  import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";

  const provider = new NodeTracerProvider({
    resource: new Resource({ [ATTR_SERVICE_NAME]: projectName, [SEMRESATTRS_PROJECT_NAME]: projectName }),
    spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter({
      url: "https://otlp.arize.com/v1/traces",
      headers: { space_id: "...", api_key: "..." },
    }))],
  });
  provider.register();
  new LangChainInstrumentation().manuallyInstrument(CallbackManagerModule);
  ```
- **`next.config.ts`** — `serverExternalPackages` adds all OpenTelemetry and OpenInference packages.
- **`package.json`** — Adds `@opentelemetry/*` packages, `@arizeai/openinference-instrumentation-langchain`, and `@arizeai/openinference-semantic-conventions`.

Arize AX env vars (`ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`) are in `.env.local`.

### Phoenix vs AX instrumentation difference

Phoenix uses the convenience `register()` from `@arizeai/phoenix-otel` which handles OpenTelemetry setup internally. AX requires manual OpenTelemetry setup with `NodeTracerProvider`, `OTLPTraceExporter`, and explicit resource attributes — more boilerplate but full control over the OTel pipeline.

Both use `LangChainInstrumentation.manuallyInstrument()` to patch LangChain's callback manager.

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
