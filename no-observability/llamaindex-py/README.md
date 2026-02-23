# Wonder Toys — LlamaIndex Python (No Observability)

This is the LlamaIndex Python variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: `FunctionAgent` from `llama_index.core.agent.workflow` — uses Claude's native function calling
- **LLM**: `llama_index.llms.anthropic.Anthropic`
- **Tools**: `FunctionTool.from_defaults(fn=...)` wraps plain Python functions
- **Streaming**: `agent.run()` returns a handler; iterate `handler.stream_events()` for `AgentStream` (text deltas) and `ToolCall` events
- **Vector search**: ChromaDB (default embeddings)

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + installs Python deps + runs backend + Next.js
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/agent.py` | FunctionAgent definition + SSE streaming |
| `backend/tools.py` | Tool definitions (search, purchase, orders, etc.) |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |
