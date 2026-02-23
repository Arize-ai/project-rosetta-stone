# Wonder Toys — LangChain Python (Phoenix Instrumented)

This is the LangChain / LangGraph Python variant of the Wonder Toys shopping agent, instrumented with Arize Phoenix Cloud for observability.

## Observability Setup

Phoenix instrumentation is initialized in `backend/tracing.py`, which must be imported before any LangChain imports:

```python
from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-langchain-py"),
)
LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
```

`backend/main.py` imports this module first: `import backend.tracing`.

## Differences from `no-observability/langchain-py`

Only observability-related files differ:

| File | Change |
|------|--------|
| `backend/tracing.py` | **New** — Phoenix/OpenInference initialization |
| `backend/main.py` | `import backend.tracing` added |
| `backend/requirements.txt` | `arize-phoenix-otel`, `openinference-instrumentation-langchain` added |
| `env.example` | Phoenix env vars added |
| `evals/` | **New** — synthetic request harness + programmatic eval runner |

All frontend code, tools, agent logic, and FastAPI endpoints are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + Phoenix credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
