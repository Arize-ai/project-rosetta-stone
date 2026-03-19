# Wonder Toys — Vercel AI SDK (No Observability)

This is the Vercel AI SDK variant of the Wonder Toys shopping agent. It has no observability instrumentation. It is functionally identical to `no-observability/mastra` — same agent logic, tools, inventory, and UI — but uses the Vercel AI SDK directly instead of Mastra.

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
scripts/
├── start.sh                  — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts         — Index 200 products into ChromaDB
```

## What differs from the Mastra baseline

Only the framework layer differs:

- **`src/ai/`** replaces `src/mastra/` — `tool()` instead of `createTool()`, `streamText()` instead of `Agent`/`Mastra`
- **`src/app/api/chat/route.ts`** — uses `streamText({ model, system, messages, tools, stopWhen: stepCountIs(10) })` and reads `part.text` (vs Mastra's `part.payload.text`)
- **`next.config.ts`** — only `"chromadb"` in `serverExternalPackages` (no Mastra packages)
- **`package.json`** — no `@mastra/core` or `@mastra/ai-sdk`

Everything else (lib, components, pages, scripts) is identical to the Mastra variant.

## What differs in observability tiers

When creating `phoenix/vercel-ai-sdk` or `ax/vercel-ai-sdk`:

- **`src/app/api/chat/route.ts`** or **`src/ai/agent.ts`** — add OTel/observability setup
- **`next.config.ts`** — add observability packages to `serverExternalPackages`
- **`package.json`** — add observability dependencies
- **`env.example`** — add observability environment variables

## Key Implementation Details

- **`maxSteps: 10`** — required for multi-turn tool use; Mastra handles this internally but the raw Vercel AI SDK requires it explicitly
- **`part.text`** — the Vercel AI SDK v6 `fullStream` text-delta event uses `part.text`; Mastra re-wraps it as `part.payload.text`
- **`system` parameter** — user context is appended to the system string passed to `streamText()`; in Mastra it was injected as a `role: "system"` message in the messages array
- **Streaming**: same custom SSE format as Mastra (`data: {"text":"..."}\n\n` / `data: [DONE]\n\n`) so Chat.tsx is unchanged

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
