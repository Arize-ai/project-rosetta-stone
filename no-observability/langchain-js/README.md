# Wonder Toys — LangChain.js (No Observability)

This is the LangChain.js / LangGraph variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Next.js monolith** — agent, tools, and UI all run in one Next.js app
- **Agent**: LangGraph ReAct agent via `@langchain/langgraph`
- **LLM**: `@langchain/anthropic` (ChatAnthropic)
- **Tools**: Defined with `tool()` from `@langchain/core/tools` with Zod schemas
- **Streaming**: `streamEvents` (v2) iterates over `on_chat_model_stream` events
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
| `src/langchain/agent.ts` | LangGraph agent definition + streaming |
| `src/langchain/tools.ts` | Tool definitions (search, purchase, orders, etc.) |
| `src/app/api/chat/route.ts` | Streaming chat API route |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + indexing + Next.js) |
