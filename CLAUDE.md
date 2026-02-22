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
└── ax/                  — Agents instrumented with Arize AX
```

Each top-level directory represents an observability tier. Within each, subdirectories hold the same agent implemented in different frameworks (currently only Mastra; more to come).

## The Agent

"Wonder Toys" is a chat-to-purchase toy store assistant. It can:
- Search a 200-product fake inventory via semantic vector search (ChromaDB + default embeddings) with fallback to keyword matching; supports filtering by age range and category (returns top 10 results)
- Show rich product details with images, ratings, dimensions, manufacturer info, and marketing copy
- Process purchases (credit card assumed on file; asks for shipping address including country — no geographic restrictions)
- Track order status by order ID or natural language product search
- Cancel orders that are still processing or shipping (delivered orders cannot be cancelled; cancellation restores inventory)

Product images and the store logo are AI-generated (gpt-image-1) and stored in `product-images/` at the repo root, symlinked into each tier's `public/product-images/` directory. The agent uses markdown image syntax with local paths (e.g. `![name](/product-images/toy-001.png)`) to display them in the chat UI. Product images in chat link to standalone product detail pages (`/product/[id]`).

The home page shows the top 5 products by best seller rank and category browse chips. Chat state is persisted in sessionStorage so it survives navigation to product pages. The UI includes a shopping cart (persisted in sessionStorage) — users can add items from chat product cards or product detail pages, then checkout from the cart page which sends the purchase request to the chat agent.

The chat UI renders product results as custom `ProductCard` components (image + "Add to Cart" button on the left, product details on the right) by pre-parsing the agent's markdown into typed segments before rendering.

The agent uses Claude (Anthropic) as the LLM and X (Twitter) OAuth for authentication.

## Editing Rules

**The `no-observability` version is the canonical baseline.** When making changes to the agent logic, tools, inventory, UI, or any shared functionality:

1. Make the change in `no-observability/` first
2. Copy the same change to `phoenix/` and `ax/`
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
- **Vector Search**: ChromaDB (local server) with `@chroma-core/default-embed` (all-MiniLM-L6-v2)
- **Observability** (phoenix tier): `@mastra/observability` + `@mastra/arize` → Phoenix Cloud
- **Observability** (ax tier): `@mastra/observability` + `@mastra/arize` → Arize AX

## Running

`npm run dev` handles everything automatically via `scripts/start.sh`:
1. Creates a Python venv and installs ChromaDB if needed (requires `uv`)
2. Starts ChromaDB server if not already running
3. Indexes all 200 products if the collection is missing or incomplete
4. Starts the Next.js dev server

The ChromaDB data (`chroma-data/`) and Python venv (`.venv/`) live at the repo root and are gitignored. All tiers share the same ChromaDB instance.

To run Next.js without ChromaDB: `npm run dev:next` (search falls back to keyword matching).

## Environment Variables

See `env.example` in each mastra/ directory. Key variables:
- `ANTHROPIC_API_KEY` — Claude API key
- `NEXTAUTH_SECRET` — session encryption (`openssl rand -base64 32`)
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — X OAuth app credentials
- `CHROMA_URL` — ChromaDB server URL (default: `http://localhost:8000`)
- `PHOENIX_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME` — Phoenix Cloud (phoenix tier only); endpoint must be the full OTLP URL including `/v1/traces` (e.g. `https://app.phoenix.arize.com/s/<space>/v1/traces`)
- `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME` — Arize AX (ax tier only)

## Streaming Architecture

The chat API route (`src/app/api/chat/route.ts`) uses Mastra's `stream.fullStream` (from Vercel AI SDK) to iterate over streaming events. Key event types:
- `text-delta` — text chunk, access via `part.payload.text`
- `tool-call` — tool invocation boundary

The route injects `\n\n` paragraph breaks when text resumes after a tool call so pre-tool and post-tool text don't run together.

**React Strict Mode caveat**: In dev mode, React calls state updater functions and effects twice. Avoid calling `fetch` or other side effects inside `setMessages` updaters — do it outside. Use refs to guard effects that should only fire once (e.g., the `?ask=` query parameter handler).

## Adding a New Framework

To add a new framework (e.g., LangChain, CrewAI):
1. Create `no-observability/<framework>/` with the same agent behavior
2. Create `phoenix/<framework>/` with Phoenix instrumentation added
3. Create `ax/<framework>/` with Arize AX instrumentation added
4. Keep the same inventory data, tool behavior, and UI flow so comparisons are fair
