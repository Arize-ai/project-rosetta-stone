# Wonder Toys — Semantic Kernel Python (Arize AX)

This is the Microsoft Semantic Kernel variant of the Wonder Toys shopping agent instrumented with Arize AX.

## Architecture

Same as the [no-observability tier](../../no-observability/semantic-kernel-py/README.md), with one extra step in the request pipeline:

- **Tracing**: `backend/tracing.py` initializes OpenLIT auto-instrumentation and reshapes spans into OpenInference format before exporting to Arize AX over OTLP/gRPC.

## Why OpenLIT?

Semantic Kernel does **not** have a dedicated `openinference-instrumentation-semantic-kernel` package. Arize's official integration goes through the OpenLIT bridge:

1. `openlit` auto-instruments Semantic Kernel + the Anthropic SDK to emit raw OpenTelemetry LLM spans.
2. `openinference-instrumentation-openlit` provides an `OpenInferenceSpanProcessor` that reshapes those spans into the OpenInference semantic conventions Arize expects.

The order matters: `import backend.tracing` MUST happen before any `semantic_kernel` import in `backend/main.py`, otherwise OpenLIT's monkey-patches miss the import sites.

## Running

```bash
cp env.example .env.local   # fill in your API keys + Arize credentials
npm install
npm run dev
```

## Eval Harness

```bash
npm run synthetic-requests   # fire 25 synthetic chat sessions
# Evals on AX are configured in the Arize UI — see evals/README.md
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/tracing.py` | OpenLIT init + OpenInferenceSpanProcessor wiring to Arize AX |
| `backend/main.py` | `import backend.tracing` is the FIRST import |
| `backend/agent.py` | Agent + streaming (identical to no-observability tier) |
| `backend/tools.py` | `WonderToysPlugin` (identical to no-observability tier) |
