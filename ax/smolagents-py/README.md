# Wonder Toys — smolagents (Arize AX)

This is the smolagents (Hugging Face) variant of the Wonder Toys shopping agent instrumented with Arize AX.

## Observability

Tracing is initialised in `backend/tracing.py`, which is imported from `backend/main.py` **before** any smolagents import. We use:

- `arize-otel` `register(space_id=..., api_key=..., project_name=...)` to build the tracer provider that ships spans to Arize AX
- `openinference-instrumentation-smolagents`'s `SmolagentsInstrumentor().instrument(...)` to patch smolagents' agent + model classes

The instrumentor produces one CHAIN span per `agent.run(...)`, nested LLM spans for each `LiteLLMModel.generate_stream(...)` call, and TOOL spans for each tool invocation. We also wrap the agent run in `using_session(user_id)` so spans carry `session.id`, which makes the Arize AX UI group turns by user automatically.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: `smolagents.ToolCallingAgent` configured with the 5 Wonder Toys tools
- **LLM**: Claude (`claude-sonnet-4-20250514`) via `smolagents.LiteLLMModel` (LiteLLM under the hood reaches Anthropic directly with `ANTHROPIC_API_KEY`)
- **Tools**: Plain Python functions decorated with `@tool` from `smolagents`; tool descriptions and JSON schemas are derived from Google-style docstrings (`Args:` blocks)
- **Streaming**: `agent.run(message, stream=True, reset=...)` with `stream_outputs=True` on the agent yields `ChatMessageStreamDelta` token-level events; we forward `delta.content` to the SSE stream
- **Conversation memory**: one `ToolCallingAgent` instance per `user_id` is kept in memory; subsequent turns pass `reset=False` so smolagents' internal step log carries history forward
- **Tool context**: a `current_user_id` `ContextVar` is set before each `agent.run()` so tools can read it without round-tripping the user ID through the LLM
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
| `backend/agent.py` | Agent factory, per-user agent registry, and SSE streaming |
| `backend/tools.py` | Tool definitions using `@tool` decorator from `smolagents` |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## smolagents Notes

### Tool definitions need Google-style docstrings

The `@tool` decorator parses the function's docstring to build the tool description and per-parameter JSON schema. The summary line becomes the tool description; each parameter must appear under an `Args:` block. Type hints (including `Optional[T]` and `list[T]`) become JSON schema types. We don't use `Annotated[..., Field(description=...)]` here because smolagents doesn't read Pydantic Field metadata.

### Conversation memory via `reset=False`

smolagents stores conversation memory inside the agent itself (not in a separate `message_history` parameter). To continue a conversation we hold one `ToolCallingAgent` per user and call `agent.run(message, stream=True, reset=False)` on subsequent turns. The first turn passes `reset=True` to clear any prior state.

### Streaming with `stream_outputs=True`

Two flags work together:

- `ToolCallingAgent(..., stream_outputs=True)` — tells the agent to call `model.generate_stream(...)` so token-level deltas flow up
- `agent.run(task, stream=True)` — turns `run` itself into a generator that yields the deltas plus step boundary objects (`PlanningStep`, `ActionStep`, `FinalAnswerStep`)

We forward each `ChatMessageStreamDelta.content` as an SSE `data: {"text": "..."}` chunk and use the step boundaries to inject paragraph breaks between pre-tool and post-tool text.

### User identity in tools

Rather than passing `user_id` through the LLM (which the agent could hallucinate or omit), we stash it in a `ContextVar` from `backend/context.py` before calling `agent.run(...)`. Tools that need the user ID (purchase, order status, cancellation) read it from the context variable.
