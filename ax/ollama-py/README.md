# Wonder Toys — Microsoft Agent Framework Python (No Observability)

This is the Microsoft Agent Framework Python variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: `AnthropicClient().as_agent()` from `agent_framework.anthropic` — uses Claude via the Microsoft Agent Framework
- **LLM**: Claude (`claude-sonnet-4-6`) via `agent_framework.anthropic.AnthropicClient`
- **Tools**: Plain Python functions decorated with `@tool(approval_mode="never_require")` from `agent_framework`
- **Streaming**: `agent.run(message, stream=True, session=session)` yields chunks with `chunk.text`
- **Sessions**: Per-user `AgentSession` objects stored in memory for multi-turn conversation
- **Tool context**: `FunctionInvocationContext` injects `user_id` at runtime via `function_invocation_kwargs`
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
| `backend/agent.py` | Agent definition, session management, and SSE streaming |
| `backend/tools.py` | Tool definitions using `@tool` decorator from `agent_framework` |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## Microsoft Agent Framework Notes

### Package Installation

The `agent-framework` packages are pre-release and must be installed with the `--pre` flag:

```bash
uv pip install --pre agent-framework agent-framework-anthropic
```

The `start.sh` script handles this automatically.

### Session Management

The Microsoft Agent Framework uses `AgentSession` objects for multi-turn conversations. This implementation stores one session per `user_id` in memory. Sessions persist until the server restarts, which is the same lifetime as the in-memory order store.

If a user refreshes their browser (clearing sessionStorage) and starts a new conversation, the server-side session is automatically reset when the agent detects the message history has fewer turns than expected.

### User Identity in Tools

Rather than passing `user_id` through the LLM (as LangChain/LlamaIndex versions do), this implementation uses `function_invocation_kwargs` to inject `user_id` directly into tool calls at runtime:

```python
# In agent.py — injected at call time
async for chunk in agent.run(message, function_invocation_kwargs={"user_id": user_id}, ...):

# In tools.py — received via FunctionInvocationContext
def purchase_product(..., ctx: FunctionInvocationContext) -> dict:
    user_id = ctx.kwargs.get("user_id", "anonymous")
```

This is more secure than having the LLM pass the user ID.
