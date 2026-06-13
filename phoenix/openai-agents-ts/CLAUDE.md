# Wonder Toys — OpenAI Agents SDK TypeScript (Phoenix)

Phoenix-instrumented variant of the OpenAI Agents JS SDK tier. Functionally identical to `no-observability/openai-agents-ts`; only the tracing setup differs.

## Tracing

- **`instrumentation.ts`** — root-level file Next.js auto-detects. Calls `register()` once per server process at startup, before user-land modules load.
- **`src/ai/tracing.ts`** — calls `register({ projectName, url, apiKey, batch: true })` from `@arizeai/phoenix-otel`, then `new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)` on the imported `@openai/agents` namespace.

The OpenInference instrumentor for `@openai/agents` is **not** a monkey-patch — the SDK exposes a first-class `TracingProcessor` interface and the instrumentor implements it, registering via the SDK's own `setTraceProcessors` / `addTraceProcessor` APIs.

## What differs from the no-observability tier

- **`src/ai/tracing.ts`** — new file (above).
- **`instrumentation.ts`** — new file (above).
- **`next.config.ts`** — adds `@arizeai/openinference-instrumentation-openai-agents` and `@arizeai/phoenix-otel` to `serverExternalPackages`.
- **`package.json`** — adds `@arizeai/phoenix-otel`, `@arizeai/openinference-instrumentation-openai-agents`, `@arizeai/openinference-semantic-conventions`, `@opentelemetry/sdk-trace-base`.
- **`env.example`** — adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`.

Everything else (agent, tools, chat route, UI, lib, components, scripts) is unchanged.

## Span coverage

The instrumentor emits the canonical OpenInference span tree:

| SDK span     | `openinference.span.kind` |
|--------------|---------------------------|
| `agent`      | `AGENT`                   |
| `generation` | `LLM`                     |
| `response`   | `LLM`                     |
| `function`   | `TOOL`                    |
| `handoff`    | `TOOL` (name `handoff to <to_agent>`) |
| `guardrail`  | `GUARDRAIL`               |

Tool input/output, LLM messages, model name, and token counts all land automatically.

## Running

```bash
npm run dev
```

`PHOENIX_COLLECTOR_ENDPOINT` should be the base URL (e.g. `https://app.phoenix.arize.com` or `http://localhost:6006`) — `@arizeai/phoenix-otel`'s `register()` appends `/v1/traces` itself.
