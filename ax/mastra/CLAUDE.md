# Wonder Toys — Mastra + Arize AX

This is the Arize AX-instrumented version of the Wonder Toys shopping agent built with Mastra.

## Architecture

```
src/
├── mastra/
│   ├── index.ts              — Mastra instance with Arize AX observability config
│   ├── agents/
│   │   └── shopping-agent.ts — Agent definition (Claude Sonnet, system prompt, 5 tools)
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
scripts/
├── start.sh                  — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts         — Index 200 products into ChromaDB
```

## Observability (AX-specific)

The only file that differs from `no-observability/mastra` for observability reasons:

- **`src/mastra/index.ts`** — Configures `@mastra/observability` with `@mastra/arize` ArizeExporter pointing at Arize AX. Uses `spaceId` instead of `endpoint` (unlike Phoenix which uses an OTLP endpoint URL).
- **`next.config.ts`** — `serverExternalPackages` includes `@mastra/arize`.
- **`package.json`** — Adds `@mastra/arize`, `@mastra/observability`.

Arize AX env vars (`ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`) are in `.env.local`.

### Phoenix vs AX exporter difference

Phoenix uses `endpoint` (full OTLP URL) + `apiKey`:
```typescript
new ArizeExporter({ endpoint: "https://app.phoenix.arize.com/s/<space>/v1/traces", apiKey: "..." })
```

AX uses `spaceId` + `apiKey`:
```typescript
new ArizeExporter({ spaceId: "your-space-id", apiKey: "..." })
```

## Key Implementation Details

- **Streaming**: The chat route uses `stream.fullStream` (Vercel AI SDK) and injects `\n\n` paragraph breaks when text resumes after a tool call.
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
