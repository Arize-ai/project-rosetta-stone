# Wonder Toys — LlamaIndex Workflows (No Observability)

This is the LlamaIndex **Workflows** variant of the Wonder Toys shopping agent with no observability instrumentation. Distinct from the sibling `llamaindex-py` tier — that one uses the higher-level `FunctionAgent`; this one hand-rolls the ReAct loop as an event-driven `Workflow` with `@step` decorators and custom event types.

## Architecture

- **Python FastAPI backend** (port 8001) — workflow, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Workflow**: `WonderToysWorkflow(Workflow)` with three `@step` methods (`prepare_chat_history`, `handle_llm_input`, `handle_tool_calls`) wired together by typed `Event` subclasses
- **LLM**: Claude (`claude-sonnet-4-20250514`) via `llama_index.llms.anthropic.Anthropic`
- **Tools**: Plain Python functions wrapped with `FunctionTool.from_defaults(fn=...)`
- **Streaming**: `llm.astream_chat_with_tools(...)` inside `handle_llm_input`, deltas pushed to the workflow stream via `ctx.write_event_to_stream(StreamEvent(delta=...))`
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
| `backend/agent.py` | `WonderToysWorkflow` definition (events, `@step` methods, SSE adapter) |
| `backend/tools.py` | The 5 plain Python tool functions |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## LlamaIndex Workflows Notes

### Workflow shape

```python
class WonderToysWorkflow(Workflow):
    @step
    async def prepare_chat_history(self, ctx, ev: StartEvent) -> LLMInputEvent: ...
    @step
    async def handle_llm_input(self, ctx, ev: LLMInputEvent) -> ToolCallEvent | StopEvent: ...
    @step
    async def handle_tool_calls(self, ctx, ev: ToolCallEvent) -> LLMInputEvent: ...
```

Each step's input/output types form the state machine. The workflow loops between `handle_llm_input` and `handle_tool_calls` until the LLM returns no more tool calls and a `StopEvent` is emitted.

### Token streaming

LlamaIndex Workflows don't auto-stream LLM tokens. Inside `handle_llm_input`, we call `llm.astream_chat_with_tools(...)` and explicitly push every delta to the workflow's event stream:

```python
ctx.write_event_to_stream(StreamEvent(delta=delta))
```

The FastAPI `stream_agent` adapter then iterates `handler.stream_events()` and filters for `StreamEvent` instances to forward as SSE.

### Tool execution

LlamaIndex's `FunctionTool.from_defaults(fn=...)` introspects the Python function signature (including `Annotated[..., Field(description=...)]`) to build the JSON schema. We keep the tool functions plain — no decorator required — and the workflow calls `tool.acall(**tc.tool_kwargs)` in `handle_tool_calls`.

### Persisted history

The `stream_agent` adapter keeps a per-user `_histories` dict at module scope; the system prompt is seeded on the first turn, then each call appends the user message, assistant message, and any tool messages. A browser refresh (fewer assistant turns than expected) resets the in-memory history.
