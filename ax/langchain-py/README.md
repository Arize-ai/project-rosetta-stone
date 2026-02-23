# Wonder Toys — LangChain Python (Arize AX Instrumented)

This is the LangChain / LangGraph Python variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

## Observability Setup

AX instrumentation is initialized in `backend/tracing.py`, which must be imported before any LangChain imports:

```python
from arize.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-langchain-py"),
)
LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
```

Same pattern as Phoenix, just `arize.otel.register` with `space_id`/`api_key` instead of `phoenix.otel.register`.

## Differences from `no-observability/langchain-py`

Only observability-related files differ:

| File | Change |
|------|--------|
| `backend/tracing.py` | **New** — Arize AX/OpenInference initialization |
| `backend/main.py` | `import backend.tracing` added |
| `backend/requirements.txt` | `arize-otel`, `openinference-instrumentation-langchain` added |
| `env.example` | AX env vars added |
| `evals/` | **New** — synthetic request harness + eval setup guide (UI-driven) |

All frontend code, tools, agent logic, and FastAPI endpoints are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + AX credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
