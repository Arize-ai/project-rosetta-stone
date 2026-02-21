# Rosetta Stone: AI Agent Framework Comparison

This project implements the same AI shopping agent ("Wonder Toys") across multiple frameworks to compare developer experience, observability integration complexity, and framework ergonomics.

## Project Structure

```
rosetta/
├── product-images/      — Generated product images (shared across all tiers via symlinks)
├── no-observability/    — Baseline agents with no observability instrumentation
│   └── mastra/          — Mastra framework version
├── phoenix/             — Agents instrumented with Arize Phoenix Cloud
│   └── mastra/          — Mastra framework version
└── ax/                  — Agents instrumented with Arize AX (future)
```

Each top-level directory represents an observability tier. Within each, subdirectories hold the same agent implemented in different frameworks (currently only Mastra; more to come).

## The Agent

"Wonder Toys" is a chat-to-purchase toy store assistant. It can:
- Search a 200-product fake inventory by description, keywords, age range, or category (returns top 10 results)
- Show rich product details with images, ratings, dimensions, manufacturer info, and marketing copy
- Process purchases (credit card assumed on file; asks for shipping address)
- Track order status by order ID or natural language product search

Product images and the store logo are AI-generated (gpt-image-1) and stored in `product-images/` at the repo root, symlinked into each tier's `public/product-images/` directory. The agent uses markdown image syntax with local paths (e.g. `![name](/product-images/toy-001.png)`) to display them in the chat UI. Product images in chat link to standalone product detail pages (`/product/[id]`).

The home page shows the top 5 products by best seller rank and category browse chips. Chat state is persisted in sessionStorage so it survives navigation to product pages.

The agent uses Claude (Anthropic) as the LLM and X (Twitter) OAuth for authentication.

## Editing Rules

**The `no-observability` version is the canonical baseline.** When making changes to the agent logic, tools, inventory, UI, or any shared functionality:

1. Make the change in `no-observability/` first
2. Copy the same change to `phoenix/` (and `ax/` when it exists)
3. The **only** differences between tiers should be observability-related:
   - `src/mastra/index.ts` — observability config in the Mastra constructor
   - `next.config.ts` — `serverExternalPackages` entries for observability packages
   - `package.json` — observability package dependencies
   - `env.example` — observability-related environment variables

Do not let non-observability code drift between the tiers.

## Tech Stack (Mastra version)

- **Framework**: Mastra (`@mastra/core`) with Vercel AI SDK
- **LLM**: Anthropic Claude via `@ai-sdk/anthropic`
- **Web**: Next.js (App Router, Tailwind CSS)
- **Auth**: NextAuth v4 with Twitter/X OAuth 2.0
- **Observability** (phoenix tier): `@mastra/observability` + `@mastra/arize` → Phoenix Cloud

## Environment Variables

See `env.example` in each mastra/ directory. Key variables:
- `ANTHROPIC_API_KEY` — Claude API key
- `NEXTAUTH_SECRET` — session encryption (`openssl rand -base64 32`)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — X OAuth app credentials
- `PHOENIX_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME` — Phoenix Cloud (phoenix tier only)

## Adding a New Framework

To add a new framework (e.g., LangChain, CrewAI):
1. Create `no-observability/<framework>/` with the same agent behavior
2. Create `phoenix/<framework>/` with Phoenix instrumentation added
3. Keep the same inventory data, tool behavior, and UI flow so comparisons are fair
