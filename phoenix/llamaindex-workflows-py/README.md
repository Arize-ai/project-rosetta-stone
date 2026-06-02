# Wonder Toys — LlamaIndex Workflows (Phoenix Instrumented)

This is the LlamaIndex **Workflows** variant of the Wonder Toys shopping agent, instrumented with Arize Phoenix for observability. Distinct from the sibling `phoenix/llamaindex-py` tier — that one wraps the higher-level `FunctionAgent`; this one hand-rolls the ReAct loop as an event-driven `Workflow` with `@step` decorators.

## Architecture

- **Python FastAPI backend** (port 8001) — workflow, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Workflow**: `WonderToysWorkflow(Workflow)` with three `@step` methods driven by typed `Event` subclasses
- **LLM**: Claude (`claude-sonnet-4-20250514`) via `llama_index.llms.anthropic.Anthropic`
- **Tools**: Plain Python functions wrapped with `FunctionTool.from_defaults(fn=...)`
- **Streaming**: `llm.astream_chat_with_tools(...)` inside `handle_llm_input`, deltas pushed via `ctx.write_event_to_stream(StreamEvent(delta=...))`
- **Vector search**: ChromaDB (default embeddings)
- **Observability**: `arize-phoenix-otel` + `openinference-instrumentation-llama-index` (the same instrumentor that covers core LlamaIndex also covers Workflows)

## LlamaIndex + OpenInference tracing quirks

The same three workarounds the `phoenix/llamaindex-py` tier applies are needed here, for the same reasons — `LlamaIndexInstrumentor` doesn't add a top-level agent span, leaves the OTel context unclean between requests, and lets workflow dispatcher spans stay open if the handler isn't awaited.

```python
from opentelemetry import context as otel_context, trace

_tracer = trace.get_tracer(__name__)

# 1. Force a blank OTel context — prevents leftover context from prior
#    requests from re-parenting child spans under the wrong trace.
otel_token = otel_context.attach(otel_context.Context())
try:
    # 2. Manual root AGENT span with input/output attributes so Phoenix
    #    shows the user query and final response at the trace level.
    with _tracer.start_as_current_span("agent") as span:
        span.set_attribute("openinference.span.kind", "AGENT")
        span.set_attribute("input.value", user_msg)

        handler = workflow.run(user_msg=user_msg, history=history)
        async for event in handler.stream_events():
            ...
        # 3. Await handler AFTER stream_events() so the workflow's
        #    internal dispatcher spans fully close.
        await handler

        span.set_attribute("output.value", "".join(full_response))
finally:
    otel_context.detach(otel_token)
```

All three pieces are required. Remove any one and traces break.

## Differences from `no-observability/llamaindex-workflows-py`

Only observability-related files differ:

| File | Change |
|---|---|
| `backend/tracing.py` | **New** — Phoenix/OpenInference initialization |
| `backend/agent.py` | Manual root span + clean OTel context |
| `backend/main.py` | `import backend.tracing` added |
| `backend/requirements.txt` | Phoenix packages added |
| `env.example` | Phoenix env vars added |
| `src/app/api/chat/route.ts` | `EVAL_SECRET` bypass for the synthetic-requests harness |
| `package.json` | `synthetic-requests` + `evals` scripts; `tsx` devDep |

All frontend code, tools, inventory, orders, and ChromaDB client are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + Python backend + Next.js
```
