# Wonder Toys — Mastra + Phoenix Cloud

This is the Phoenix Cloud-instrumented version of the Wonder Toys shopping agent built with Mastra.

## Architecture

```
src/
├── mastra/
│   ├── index.ts              — Mastra instance with Phoenix observability config
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
evals/
├── synthetic-requests.ts     — 25 synthetic requests sent directly to the agent
└── run-evals.ts              — 6 evaluators run against Phoenix traces
scripts/
├── start.sh                  — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts         — Index 200 products into ChromaDB
```

## Observability (Phoenix-specific)

The only file that differs from `no-observability/mastra` for observability reasons:

- **`src/mastra/index.ts`** — Configures `@mastra/observability` with `@mastra/arize` ArizeExporter pointing at Phoenix Cloud. `serializationOptions.maxStringLength` is set to 10,000 (default 1024 truncates agent responses).
- **`next.config.ts`** — `serverExternalPackages` includes `@mastra/arize`.
- **`package.json`** — Adds `@mastra/arize`, `@mastra/observability`, `@arizeai/phoenix-client`, `@arizeai/phoenix-evals`.

Phoenix Cloud env vars (`PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`) are in `.env.local`. The endpoint must be the full OTLP URL including `/v1/traces`.

## Eval Harness

### Synthetic Requests (`evals/synthetic-requests.ts`)

Sends 25 requests directly to the Mastra agent (bypassing Next.js and auth). Groups: simple searches, filtered searches, product details, multi-turn, purchases, order status, cancellation, complex/compound, edge cases.

```bash
set -a && source .env.local && set +a && npx tsx --conditions=import evals/synthetic-requests.ts
```

### Eval Runner (`evals/run-evals.ts`)

Fetches spans from Phoenix Cloud, runs 6 evaluators, logs results as span annotations:

| Eval | Type | What it checks |
|------|------|----------------|
| Correctness | LLM (custom template) | Agent addresses user's request appropriately |
| Tool Selection | LLM (built-in) | Correct tools chosen for the query |
| Tool Response Handling | LLM (built-in) | Agent uses tool results properly |
| Format Compliance | LLM (custom template) | Markdown product card formatting rules |
| Image URL Correctness | Code | All image URLs match `/product-images/toy-\d{3}\.png` |
| Tool Call Count | Code | Appropriate number of tool calls (not 0 for action queries, not >5) |

```bash
set -a && source .env.local && set +a && npx tsx --conditions=import evals/run-evals.ts
```

The `--conditions=import` flag is required because `@arizeai/openinference-genai` (transitive dep) only exports an `"import"` condition with no `"default"` or `"require"` fallback.

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
