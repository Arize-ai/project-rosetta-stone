# Wonder Toys — LlamaIndex Python (Arize AX Instrumented)

This is the LlamaIndex Python variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

## LlamaIndex + OpenInference Tracing Quirks

The LlamaIndex OpenInference instrumentor (`openinference-instrumentation-llama-index`) auto-instruments LLM calls, tool calls, and workflow steps. However, integrating it with the `FunctionAgent` workflow system requires some workarounds:

### 1. Manual root span with clean context (`backend/agent.py`)

The LlamaIndex instrumentor does not create a top-level agent span with `input.value`/`output.value` attributes that AX can display. It also doesn't create trace boundaries between requests — without intervention, all spans from all requests merge into a single trace.

The fix uses three techniques together:

```python
from opentelemetry import context as otel_context, trace

_tracer = trace.get_tracer(__name__)

# 1. Force a blank OTel context — prevents leftover context from prior
#    requests from causing child spans to parent under the wrong trace.
token = otel_context.attach(otel_context.Context())
try:
    # 2. Create a manual root span with input/output attributes so
    #    AX shows the user query and agent response at the trace level.
    with _tracer.start_as_current_span("agent") as span:
        span.set_attribute("openinference.span.kind", "AGENT")
        span.set_attribute("input.value", user_msg)

        handler = agent.run(user_msg=user_msg, chat_history=chat_history)
        async for event in handler.stream_events():
            ...

        # 3. Await the handler AFTER stream_events() completes — this forces
        #    the workflow to fully close its internal dispatcher spans. Without
        #    this, the workflow's spans remain "open" and subsequent requests'
        #    child spans all parent under the first request's trace.
        await handler

        span.set_attribute("output.value", "".join(full_response))
finally:
    otel_context.detach(token)
```

All three pieces are required. Remove any one and traces break:
- Without `otel_context.Context()`: context leaks between requests
- Without the manual span: no input/output on root, and no trace boundaries
- Without `await handler`: all child spans collapse into the first trace

### 2. Batch span processor (`backend/tracing.py`)

The `arize.otel.register()` call defaults to `batch=True`, which uses the `BatchSpanProcessor` to avoid synchronous HTTP exports that can drop spans in async contexts.

### 3. Import order (`backend/main.py`)

`import backend.tracing` must appear before any LlamaIndex imports so the instrumentor can patch LlamaIndex's dispatcher system.

## Differences from `no-observability/llamaindex-py`

Only observability-related files differ:

| File | Change |
|---|---|
| `backend/tracing.py` | **New** — Arize AX/OpenInference initialization |
| `backend/agent.py` | Manual root span + context management (see above) |
| `backend/main.py` | `import backend.tracing` added |
| `backend/requirements.txt` | AX packages added |
| `env.example` | AX env vars added |
| `evals/` | **New** — synthetic request harness + eval setup guide |

All frontend code, tools, inventory, orders, and ChromaDB client are identical to the no-observability version.
