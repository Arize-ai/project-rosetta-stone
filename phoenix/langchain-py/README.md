# Wonder Toys — LangChain Python (Phoenix Instrumented)

This is the LangChain / LangGraph Python variant of the Wonder Toys shopping agent, instrumented with Arize Phoenix Cloud for observability.

## Observability setup

`backend/main.py` imports `backend.tracing` before LangChain. The module configures Phoenix's tracer provider and OpenInference's LangChain instrumentation.

An explicit HTTP `PHOENIX_COLLECTOR_ENDPOINT` can be a base URL or a full `/v1/traces` URL. Cloud and reverse-proxy path prefixes are preserved. The standard `OTEL_EXPORTER_OTLP_ENDPOINT` is also honored when no Phoenix endpoint is set. With neither endpoint set, the SDK keeps its default local gRPC collector. A gRPC collector uses `PHOENIX_GRPC_PORT` (default `4317`). API keys and tracing headers remain SDK configuration.

## Differences from the uninstrumented demo

The model, default system prompt, tools, inventory, catalogue, purchase rules, and SSE response format are unchanged. The Phoenix variant adds:

- A `Wonder Toys` agent root with the current request and streamed response. LangGraph's nested spans retain the full model and tool details. Completed roots have OK status; failed streams have ERROR status.
- Conversation IDs separate from shopper IDs. The browser keeps one ID per chat; starting a new chat replaces it. The proxy forwards an existing `X-Session-ID`, including IDs sent by the synthetic-request harness. Older clients without that header still work, but each request receives a new conversation ID.
- Optional agent-factory arguments for isolated Academy experiments. The normal app continues to use its original model, prompt, and tools.

Trace consumers should use span kinds and attributes rather than assume that the root is named `LangGraph`, contains serialized messages, or has `session.id` equal to `user.id`. HTTP wrapper tracing is disabled so the agent operation is the trace root. Product and chat endpoints are otherwise the same.

The [Academy exercises](../../academy/README.md) run separately; starting the demo does not run evaluations, CI tests, or Harbor tasks.

## Running

```bash
cp env.example .env.local   # fill in your API keys + Phoenix credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
