# AutoGen AgentChat (added 2026-05-19)

Microsoft AutoGen v0.4+ split into `autogen-core`, `autogen-agentchat`, and `autogen-ext`. We use the conversational `autogen-agentchat` `AssistantAgent` layer because its tool-loop + streaming surface maps onto the SSE wire format the other tiers use.

## Things to remember next time

### Tool-description style is non-standard
`autogen_core.tools.FunctionTool` introspects `Annotated` metadata expecting a plain `str` description (`Annotated[str, "what this is"]`). The Pydantic-style `Annotated[Optional[T], Field(description=...)]` that every other Python tier uses raises::

    ValueError: Invalid description annotation=NoneType required=True
                description='...' for parameter X, should be a string.

`tools.py` is rewritten in all three AutoGen tiers to use the plain-string form. This is the only Python tier so far where the build skill's "tools.py stays almost identical" assumption breaks.

### `AssistantAgent` defaults need three flips for chat-shaped behaviour
- `model_client_stream=True` — without this you only see the aggregated final text, never `ModelClientStreamingChunkEvent` deltas.
- `reflect_on_tool_use=True` — default returns raw `ToolCallSummaryMessage` (JSON) instead of a narrated text response after a tool call.
- `max_tool_iterations=10` — default is **1**, which kills any search → detail → purchase chain after one step.

### `AnthropicChatCompletionClient` lives in `autogen-ext`
`pip install "autogen-ext[anthropic]"` — the model client is at `autogen_ext.models.anthropic.AnthropicChatCompletionClient`. `claude-sonnet-4-20250514` works (docs show older Claude 3 strings but newer ones also work).

### Per-user agent instances for memory isolation
AutoGen keeps conversation history on the agent's `model_context` and only persists it via `save_state()`/`load_state()`. Simplest isolation: a `dict[str, AssistantAgent]` keyed by `user_id`. Reset by `pop()`-ing the user's agent when the client-side message history shrinks (browser refresh).

### Tracing — session.id is NOT auto-emitted
The OpenInference `openinference-instrumentation-autogen-agentchat` package (v0.1.9) only sets `gen_ai.*` attributes — no `session.id`, no `user.id`. Wrap the `agent.run_stream(...)` call in both `using_session(user_id)` and `using_user(user_id)` so Arize groups spans correctly. Use the `try/except ImportError` fallback so the no-observability tier still imports cleanly without `openinference.instrumentation`.

### Use the AgentChat-layer instrumentor, not the core one
Arize publishes two packages: `openinference-instrumentation-autogen` (low-level core) and `openinference-instrumentation-autogen-agentchat` (the AgentChat layer). For an AssistantAgent-based app you want the AgentChat one — it knows how to interpret `on_messages_stream` and the AgentChat message types.

### Working tracing.py pattern (both Phoenix and AX)
The standard `register()` flow worked first try — no need for the manual `TracerProvider(Resource.create({PROJECT_NAME: ...}))` workaround that Microsoft Agent Framework required.

```python
from openinference.instrumentation.autogen_agentchat import AutogenAgentChatInstrumentor
from phoenix.otel import register   # or `from arize.otel import register`

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-autogen"),
    auto_instrument=False,
)
AutogenAgentChatInstrumentor().instrument(tracer_provider=_tracer_provider)
```
