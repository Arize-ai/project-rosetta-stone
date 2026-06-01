# Wonder Toys — Semantic Kernel Python (Arize Phoenix)

This is the Microsoft Semantic Kernel variant of the Wonder Toys shopping agent instrumented with Arize Phoenix Cloud.

## Architecture

Same as the [no-observability tier](../../no-observability/semantic-kernel-py/README.md), with one extra step in the request pipeline:

- **Tracing**: `backend/tracing.py` initializes OpenLIT auto-instrumentation and reshapes spans into OpenInference format before exporting to Phoenix Cloud over OTLP/HTTP.

## Why OpenLIT?

Semantic Kernel does **not** have a dedicated `openinference-instrumentation-semantic-kernel` package. Arize's official integration goes through the OpenLIT bridge:

1. `openlit` auto-instruments Semantic Kernel + the Anthropic SDK to emit raw OpenTelemetry LLM spans.
2. `openinference-instrumentation-openlit` provides an `OpenInferenceSpanProcessor` that reshapes those spans into the OpenInference semantic conventions Arize expects.

The order matters: `import backend.tracing` MUST happen before any `semantic_kernel` import in `backend/main.py`, otherwise OpenLIT's monkey-patches miss the import sites.

## Running

```bash
cp env.example .env.local   # fill in your API keys + Phoenix credentials
npm install
npm run dev
```

## Eval Harness

```bash
npm run synthetic-requests   # fire 25 synthetic chat sessions
npm run evals                # run the 6 Phoenix evals against the resulting traces
```

See [`evals/README.md`](../../evals/README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/tracing.py` | OpenLIT init + OpenInferenceSpanProcessor wiring to Phoenix |
| `backend/main.py` | `import backend.tracing` is the FIRST import |
| `backend/agent.py` | Agent + streaming (identical to no-observability tier) |
| `backend/tools.py` | `WonderToysPlugin` (identical to no-observability tier) |
