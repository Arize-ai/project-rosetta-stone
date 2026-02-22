# Wonder Toys — LangChain.js (No Observability)

This is the **canonical baseline** LangChain.js version of the Wonder Toys shopping agent. It has no observability instrumentation. All agent logic, tools, UI, and shared functionality changes should be made here first, then copied to `phoenix/langchain-js` and `ax/langchain-js`.

This app is derived from the Mastra version, which was built first. If there are changes in functionality to this app they should probably be reflected there.

## Architecture

```
src/
├── langchain/
│   ├── agent.ts               — LangGraph ReAct agent (Claude Sonnet, system prompt, 5 tools)
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

## LangChain.js vs Mastra

Key differences from the Mastra implementation:

- **Agent**: Uses `createReactAgent` from `@langchain/langgraph/prebuilt` instead of Mastra's `Agent` class.
- **LLM**: `ChatAnthropic` from `@langchain/anthropic` instead of `@ai-sdk/anthropic`.
- **Tools**: LangChain's `tool()` function from `@langchain/core/tools` instead of Mastra's `createTool()`.
- **Streaming**: Uses `shoppingAgent.streamEvents()` with `version: "v2"` instead of Vercel AI SDK's `fullStream`. Watches for `on_chat_model_stream` events (text tokens) and `on_tool_start` events (tool boundaries).
- **Messages**: Converts to LangChain message types (`HumanMessage`, `AIMessage`, `SystemMessage`) from `@langchain/core/messages`.
- **System prompt**: Exported as `SYSTEM_PROMPT` constant (appended with user context in the chat route) rather than being part of the agent constructor.

## What differs in observability tiers

Only these files differ between this baseline and `phoenix/langchain-js` or `ax/langchain-js`:

- **`src/langchain/agent.ts`** — Here it has no observability imports. Instrumented tiers add setup code at the top of this file, before the LLM/agent are created.
- **`next.config.ts`** — Instrumented tiers add observability packages to `serverExternalPackages`.
- **`package.json`** — Instrumented tiers add observability dependencies.
- **`env.example`** — Instrumented tiers add observability-related env vars.

Everything else (tools, lib, UI, components, scripts) should be identical across tiers.

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
