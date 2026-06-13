# Wonder Toys — OpenAI Agents SDK (TypeScript) — Arize AX

The **OpenAI Agents JS SDK** variant of the Wonder Toys shopping agent, instrumented for **Arize AX**. Functionally identical to `no-observability/openai-agents-ts` — only the tracing layer plus a one-line `forceFlush()` in the chat route differ.

## How tracing works

`@arizeai/openinference-instrumentation-openai-agents` is **not** a monkey-patching instrumentation. The OpenAI Agents JS SDK exposes a first-class `TracingProcessor` interface, and the OpenInference package implements that interface, registering via the SDK's own `setTraceProcessors` / `addTraceProcessor` APIs.

Two files do the work:

```
instrumentation.ts                   ─→ Next.js auto-detects; calls register() at startup
└── src/ai/tracing.ts
    ├── NodeTracerProvider           with the `openinference.project.name` resource attribute
    ├── OpenInferenceSimpleSpanProcessor   (from @arizeai/openinference-vercel)
    │     └── OTLPTraceExporter      url: https://otlp.arize.com/v1/traces
    │                                 headers: { space_id, api_key }
    └── new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)
```

### Two gotchas the AX path adds

1. **No `provider.register()`.** Making the provider global would let Next.js's built-in OTel auto-instrumentation pipe its HTTP infra spans (`GET /`, `POST /api/chat`, `fetch POST https://telemetry.nextjs.org/...`) into the AX project bucket. The OpenInference instrumentor resolves its tracer directly off the provider we pass in, so global registration isn't needed.
2. **Force-flush after every chat turn.** `src/app/api/chat/route.ts` calls `getTracerProvider()?.forceFlush()` after `stream.completed`. Without it the OTel batch processor can hold spans past the request lifecycle and they're never written.

The Phoenix tier doesn't need either workaround: `@arizeai/phoenix-otel`'s `register()` does its own global-state snapshot/restore, and its default span processor flushes more aggressively.

## Span coverage

| SDK span     | `openinference.span.kind` |
|--------------|---------------------------|
| `agent`      | `AGENT`                   |
| `generation` | `LLM`                     |
| `response`   | `LLM`                     |
| `function`   | `TOOL`                    |
| `handoff`    | `TOOL`                    |
| `guardrail`  | `GUARDRAIL`               |

## Running

```bash
cp env.example .env.local   # fill in OPENAI_API_KEY + ARIZE_*
npm install
npm run dev
```

## What differs from `no-observability/openai-agents-ts`

- New `instrumentation.ts` at root.
- New `src/ai/tracing.ts`.
- `src/app/api/chat/route.ts` — adds the `forceFlush()` call.
- `next.config.ts` — `serverExternalPackages` adds `@arizeai/openinference-instrumentation-openai-agents`.
- `package.json` — adds `@arizeai/openinference-instrumentation-openai-agents`, `@arizeai/openinference-semantic-conventions`, `@arizeai/openinference-vercel`, `@opentelemetry/exporter-trace-otlp-proto`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`.
- `env.example` — adds `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`.

Everything else is unchanged.
