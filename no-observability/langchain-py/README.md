# Wonder Toys — LangChain Python (No Observability)

This is the LangChain / LangGraph Python variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: LangGraph ReAct agent via `langgraph`
- **LLM**: `langchain-anthropic` (ChatAnthropic)
- **Tools**: Defined with `@tool` decorator from `langchain_core.tools`
- **Streaming**: `astream_events` (v2) iterates over `on_chat_model_stream` events
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
| `backend/agent.py` | LangGraph agent definition + SSE streaming |
| `backend/tools.py` | Tool definitions (search, purchase, orders, etc.) |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |
