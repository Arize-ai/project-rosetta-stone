# Wonder Toys — BeeAI (TypeScript, No Observability)

This is the **canonical baseline** version of the Wonder Toys shopping agent built with BeeAI (TypeScript). It has no observability instrumentation. All agent logic, tools, UI, and shared functionality changes should be made here first, then copied to `phoenix/beeai-ts` and `ax/beeai-ts`.

This app is derived from the Mastra version. If functionality changes here, mirror them to the other TypeScript tiers (`mastra`, `langchain-js`).

## Architecture

```
src/
├── beeai/
│   ├── agent.ts                 — RequirementAgent factory + streamAgentResponse() generator
│   └── tools/
│       ├── search-products.ts   — Vector search (ChromaDB) with keyword fallback
│       ├── get-product.ts       — Single product detail lookup
│       ├── purchase.ts          — Purchase flow (deducts inventory, creates order)
│       ├── order-status.ts      — Order lookup by ID, user, or product search
│       └── cancel-order.ts      — Cancel non-delivered orders (restores inventory)
├── lib/
│   ├── inventory.ts             — 200 products (in-memory array, typed as Product[])
│   ├── orders.ts                — In-memory order store (Map, resets on restart)
│   ├── chroma.ts                — ChromaDB client wrapper with graceful fallback
│   └── auth.ts                  — NextAuth config (Twitter/X OAuth 2.0)
├── components/                  — Chat, CartContext, CartIcon, SessionProvider
└── app/
    ├── api/chat/route.ts        — Streaming chat endpoint (SSE, drives BeeAI agent)
    ├── api/products/            — REST endpoints for featured products and product detail
    ├── api/auth/                — NextAuth route handler
    ├── page.tsx                 — Home page (top 5 products, category chips, chat)
    ├── product/[id]/            — Product detail page with add-to-cart
    ├── cart/                    — Shopping cart page (sessionStorage-backed)
    └── login/                   — Login page
scripts/
├── start.sh                     — Dev startup (ChromaDB + indexing + Next.js)
└── index-products.ts            — Index 200 products into ChromaDB
```

## BeeAI vs the other TypeScript tiers

- **Agent**: `ReActAgent` from `beeai-framework/agents/react/agent` (the BeeAI ReAct-pattern agent) with `UnconstrainedMemory`. We don't use the newer `RequirementAgent` because the OpenInference instrumentation only supports `beeai-framework <0.1.14`, and `RequirementAgent` only exists on later versions. See "Why beeai-framework is pinned to 0.1.13" below.
- **LLM**: `AnthropicChatModel` from `beeai-framework/adapters/anthropic/backend/chat` (BeeAI's wrapper around `@ai-sdk/anthropic`). Configured with `stream: true`.
- **Tools**: BeeAI's `Tool<StringToolOutput>` class. Each tool defines `name`, `description`, `inputSchema()` (zod), an `emitter` namespaced under `["tool", "<name>"]`, and an async `_run()` returning `StringToolOutput` (serialised JSON).
- **Streaming**: `agent.run({ prompt }).observe(emitter => …)` exposes events:
  - `partialUpdate` event with `update.key === "final_answer"` and `update.value` carrying each delta — only the final-answer key is forwarded to the SSE client; `thought`/`tool_name`/`tool_input` keys are internal reasoning.
  - `tool.<name>.start` (via a `/tool\.[^.]+\.start$/` regex matcher with `matchNested: true`) — tool-call boundary, used for the `\n\n` paragraph break between pre- and post-tool text.
- **Memory**: The chat front-end resends full history each turn. The agent factory replays the history into `UnconstrainedMemory` then runs with the most recent user message as `prompt`. A user-context system message is prepended so the agent knows the authenticated user's ID.

## What differs in observability tiers

Only these files differ between this baseline and `phoenix/beeai-ts` or `ax/beeai-ts`:

- **`src/beeai/agent.ts`** — Instrumented tiers prepend a tracing initialiser (registers the OTel `NodeSDK` with `BeeAIInstrumentation`, then calls `inst.manuallyInstrument(beeaiFramework)`).
- **`next.config.ts`** — Instrumented tiers add `@arizeai/openinference-instrumentation-beeai` and the OTel SDK packages to `serverExternalPackages`.
- **`package.json`** — Instrumented tiers add `@arizeai/openinference-instrumentation-beeai` + OTel SDK packages.
- **`env.example`** — Instrumented tiers add observability-related env vars.

Everything else (tools, lib, UI, scripts) should be identical across tiers.

## Why `.npmrc` has `legacy-peer-deps=true`

`beeai-framework` lists `@langchain/core@^0.2.27` as an **optional** peer dependency. Modern Next.js stacks pin newer `@langchain/core`, and npm's strict resolution rejects the install. `legacy-peer-deps` tells npm to ignore the optional peer (we never use BeeAI's langchain adapter). Same fix applies to all three tiers.

## Why zod is pinned to v3

`beeai-framework` imports `ZodEffects` from zod — a v3 API removed in v4. The pin `zod@^3.25.76` keeps that working.

## Why beeai-framework is pinned to 0.1.13

`@arizeai/openinference-instrumentation-beeai@^1.5.15` declares a peer dep of `beeai-framework@^0.1.13`, but the **runtime version check** in its source still hardcodes `INSTRUMENTS = [">=0.1.9 <0.1.14"]`. On any beeai-framework 0.1.14+ the `manuallyInstrument()` call silently bails out — the framework still works, but no spans get produced (we hit this on 0.1.29 during the spike).

Pinning to `beeai-framework@0.1.13` keeps the version inside the supported range so tracing fires. The trade-off: `RequirementAgent` and `agent_framework_*` classes that landed in 0.1.14+ aren't available — we use `ReActAgent` instead, which is what the OpenInference example uses anyway. When upstream bumps the runtime constraint, this tier can move to the latest framework + `RequirementAgent` without changing anything else.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
