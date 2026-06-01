# Wonder Toys — Mastra (No Observability)

This is the Mastra (TypeScript) variant of the Wonder Toys shopping agent with no observability instrumentation. It serves as the canonical baseline — all other tiers and frameworks should match this behavior.

## Architecture

- **Next.js monolith** — agent, tools, and UI all run in one Next.js app
- **Agent**: Mastra `Agent` with Vercel AI SDK (`@ai-sdk/anthropic`)
- **Tools**: Defined as Mastra tools with Zod schemas in `src/mastra/tools/`
- **Streaming**: `stream.fullStream` iterates over `text-delta` and `tool-call` events
- **Vector search**: ChromaDB via `@chroma-core/default-embed` (all-MiniLM-L6-v2)

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + indexes products + runs Next.js
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `src/mastra/index.ts` | Mastra instance + agent definition |
| `src/mastra/tools/` | Tool definitions (search, purchase, orders, etc.) |
| `src/app/api/chat/route.ts` | Streaming chat API route |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + indexing + Next.js) |
