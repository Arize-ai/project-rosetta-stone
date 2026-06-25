# Wonder Toys — Vercel AI SDK (No Observability)

This is the **Vercel AI SDK (TypeScript)** variant of the Wonder Toys shopping agent with no observability instrumentation. It is functionally identical to the Mastra variant — same agent, same tools, same UI — but uses the Vercel AI SDK directly instead of Mastra.

## Architecture

A Next.js monolith: the agent, tools, and UI all live in one app.

| Layer | Implementation |
|---|---|
| LLM | `@ai-sdk/anthropic` — Claude `claude-sonnet-4-6` |
| Agent loop | `streamText()` from `ai` with `maxSteps: 10` |
| Tools | `tool()` from `ai` with Zod parameter schemas |
| Streaming | `result.fullStream` → custom SSE (`data: {"text":"..."}\n\n`) |
| Vector search | ChromaDB + `@chroma-core/default-embed` (all-MiniLM-L6-v2) |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0 |
| UI | Next.js App Router + Tailwind CSS v4 |

## Key Files

| File | Purpose |
|---|---|
| `src/ai/agent.ts` | Model, tools object, and system prompt |
| `src/ai/tools/` | 5 tool definitions using Vercel AI SDK `tool()` |
| `src/app/api/chat/route.ts` | Streaming chat endpoint (SSE) |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `src/lib/inventory.ts` | 200-product in-memory database |
| `src/lib/orders.ts` | In-memory order store |
| `src/lib/chroma.ts` | ChromaDB client wrapper |
| `scripts/start.sh` | Dev startup: ChromaDB + indexing + Next.js |

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB, indexes products, runs Next.js
```

To skip ChromaDB (search falls back to keyword matching):

```bash
npm run dev:next
```

## Environment Variables

See `env.example`. Required variables:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `NEXTAUTH_URL` | Callback URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session encryption key (`openssl rand -base64 32`) |
| `TWITTER_CLIENT_ID` | X OAuth app client ID |
| `TWITTER_CLIENT_SECRET` | X OAuth app client secret |

## Differences from the Mastra variant

The only differences from `no-observability/mastra/` are in the framework layer:

| File | Mastra | Vercel AI SDK |
|---|---|---|
| `src/mastra/` → `src/ai/` | `createTool()`, `Agent`, `Mastra` instance | `tool()`, `streamText()` |
| `src/app/api/chat/route.ts` | `shoppingAgent.stream()` + `part.payload.text` | `streamText()` + `part.text` + `stopWhen: stepCountIs(10)` |
| `next.config.ts` | `serverExternalPackages: ["@mastra/core", "@mastra/ai-sdk", "chromadb"]` | `serverExternalPackages: ["chromadb"]` |
| `package.json` | includes `@mastra/core`, `@mastra/ai-sdk` | neither Mastra package |

Everything else (lib, components, pages, scripts) is identical.
