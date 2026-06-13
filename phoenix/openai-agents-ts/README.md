# Wonder Toys — OpenAI Agents SDK (TypeScript) — Arize Phoenix

The **OpenAI Agents JS SDK** variant of the Wonder Toys shopping agent, instrumented with **Arize Phoenix Cloud** (or any self-hosted Phoenix). Functionally identical to `no-observability/openai-agents-ts` — only the tracing layer differs.

## How tracing works

`@arizeai/openinference-instrumentation-openai-agents` is **not** a monkey-patching instrumentation. The OpenAI Agents JS SDK exposes a first-class `TracingProcessor` interface, and the OpenInference package implements that interface, registering via the SDK's own `setTraceProcessors` / `addTraceProcessor` APIs.

Three files do the work:

```
instrumentation.ts                            ─→ Next.js auto-detects; calls register() at startup
└── src/ai/tracing.ts
    ├── @arizeai/phoenix-otel                  register({ projectName, url, apiKey, spanProcessors })
    ├── src/ai/oi-filter-processor.ts          OpenInferenceFilteredBatchSpanProcessor (~15 LOC subclass)
    ├── @arizeai/openinference-instrumentation-openai-agents
    │       new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)
    └── @openai/agents                          (the imported namespace passed to the instrumentor)
```

`@arizeai/phoenix-otel`'s `register()` sets up a `NodeTracerProvider` with the `openinference.project.name` resource attribute. We pass our own `spanProcessors` array containing `OpenInferenceFilteredBatchSpanProcessor` — a thin subclass of OTel's standard `BatchSpanProcessor` defined in `src/ai/oi-filter-processor.ts`. The default processor doesn't filter, so Next.js's built-in OTel auto-instrumentation otherwise pumps its own HTTP / fetch / page-render spans through whatever global provider is registered, polluting the Phoenix project alongside the agent spans. Our processor drops anything that doesn't carry an `openinference.span.kind` attribute (using `SemanticConventions.OPENINFERENCE_SPAN_KIND` from `@arizeai/openinference-semantic-conventions`), so only `AGENT` / `LLM` / `TOOL` / `GUARDRAIL` / `CHAIN` spans reach the exporter.

## Span coverage

| SDK span     | `openinference.span.kind` | What lands |
|--------------|---------------------------|------------|
| `agent`      | `AGENT`                   | `graph.node.id`, `graph.node.parent_id` on handoff destination |
| `generation` | `LLM`                     | `llm.model_name`, invocation params, input/output messages, token counts |
| `response`   | `LLM`                     | All of the above + `llm.tools.*`, system instructions as message 0 |
| `function`   | `TOOL`                    | `tool.name`, `input.value`, `output.value` |
| `handoff`    | `TOOL`                    | Span name `handoff to <to_agent>` |
| `guardrail`  | `GUARDRAIL`               | `tool.name`, `guardrail.triggered` |

## Running

```bash
cp env.example .env.local   # fill in OPENAI_API_KEY + PHOENIX_*
npm install
npm run dev
```

`PHOENIX_COLLECTOR_ENDPOINT` should be the **base URL** (e.g. `https://app.phoenix.arize.com` or `http://localhost:6006`) — `@arizeai/phoenix-otel`'s `register()` appends `/v1/traces` itself. This differs from `phoenix/mastra` and `phoenix/langchain-js`, which expect the full OTLP URL with `/v1/traces` already included.

## What differs from `no-observability/openai-agents-ts`

- New `instrumentation.ts` at root.
- New `src/ai/tracing.ts`.
- New `src/ai/oi-filter-processor.ts` — local `OpenInferenceFilteredBatchSpanProcessor` subclass of `BatchSpanProcessor` from `@opentelemetry/sdk-trace-base`.
- `next.config.ts` — `serverExternalPackages` adds `@arizeai/openinference-instrumentation-openai-agents` and `@arizeai/phoenix-otel`.
- `package.json` — adds `@arizeai/phoenix-otel`, `@arizeai/openinference-instrumentation-openai-agents`, `@arizeai/openinference-semantic-conventions`, `@opentelemetry/exporter-trace-otlp-proto`, `@opentelemetry/sdk-trace-base`.
- `env.example` — adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`.

Everything else is unchanged.
