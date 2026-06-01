# Wonder Toys — AWS Strands Python (No Observability)

This is the AWS Strands Python variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Python FastAPI backend** (port 8031) — agent, tools, and API
- **Next.js frontend** (port 3030) — UI, auth, proxies chat to the Python backend
- **Agent**: `strands.Agent` wired to `strands.models.anthropic.AnthropicModel` — uses Claude via the direct Anthropic API (not Bedrock)
- **LLM**: Claude (`claude-sonnet-4-20250514`) via `strands.models.anthropic.AnthropicModel`
- **Tools**: Plain Python functions decorated with `@tool` from `strands`; descriptions taken from Google-style "Args:" docstring sections
- **Streaming**: `async for event in agent.stream_async(prompt)` yielding events with `event["data"]` (text deltas) and `event["current_tool_use"]` (tool calls)
- **Sessions**: Per-user `Agent` instances cached by `user_id`; their internal `messages` list accumulates history automatically and is reset when the browser-side history shrinks
- **Tool context**: A `contextvars.ContextVar` (`current_user_id`) is set before each `stream_async` so tools can look up the caller without the LLM seeing the user ID
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
| `backend/agent.py` | Agent definition, per-user history, and SSE streaming |
| `backend/tools.py` | Tool definitions using `@tool` decorator from `strands` |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## AWS Strands Notes

### Direct Anthropic API, not Bedrock

This repo is standardised on the direct Anthropic API for fair cross-framework comparison. Strands supports both Bedrock and direct Anthropic — we wire `AnthropicModel(client_args={"api_key": ...})` so no AWS credentials are needed:

```python
model = AnthropicModel(
    client_args={"api_key": os.environ["ANTHROPIC_API_KEY"]},
    model_id="claude-sonnet-4-20250514",
    max_tokens=4096,
    params={"temperature": 0.7},
)
```

### Tool parameter descriptions via docstrings

Strands' `@tool` decorator does **not** support `Annotated[..., pydantic.Field(description=...)]` (see [strands-agents/sdk-python#511](https://github.com/strands-agents/sdk-python/issues/511)). Per-parameter descriptions are extracted from Google-style `Args:` sections in the docstring instead. Type hints supply the JSON schema types.

```python
@tool
def search_products(query: Optional[str] = None, ...) -> dict:
    """Search the toy store inventory ...

    Args:
        query: Free-text search query to match against product names and descriptions.
        ...
    """
```

### Session/history management

Strands `Agent` instances keep their own conversation history in an internal `messages` list. We cache one `Agent` per `user_id` and reuse it across turns. When the browser sends a `messages` array with fewer assistant turns than we've seen (e.g. after a refresh), we build a fresh `Agent` to clear state.
