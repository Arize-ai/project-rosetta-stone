# Wonder Toys — OpenAI Agents SDK TypeScript (Arize AX)

AX-instrumented variant of the OpenAI Agents JS SDK tier. Functionally identical to `no-observability/openai-agents-ts`; only the tracing setup and a small chat-route addition differ.

## Tracing

- **`instrumentation.ts`** — root-level file Next.js auto-detects. Calls `register()` once per server process at startup, before user-land modules load.
- **`src/ai/tracing.ts`** — builds a `NodeTracerProvider` with the `openinference.project.name` resource attribute, wraps an `OTLPTraceExporter` (pointed at `https://otlp.arize.com/v1/traces` with `space_id` + `api_key` headers) in a local `OpenInferenceFilteredBatchSpanProcessor` (subclass of `BatchSpanProcessor` from `@opentelemetry/sdk-trace-base`, defined in `src/ai/oi-filter-processor.ts`), then calls `new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)`.
- **`src/ai/oi-filter-processor.ts`** — ~15-line subclass that drops any span without `SemanticConventions.OPENINFERENCE_SPAN_KIND`. Same predicate the Vercel package's `isOpenInferenceSpan` uses, inlined locally so the OpenAI Agents tier doesn't take a Vercel-specific dependency.

> **Deliberately omits `provider.register()`.** Making the provider global would otherwise let Next.js's built-in OTel auto-instrumentation pump its own HTTP infra spans (`GET /`, `POST /api/chat`, `fetch POST https://telemetry.nextjs.org/...`) into the AX project bucket. The OpenInference instrumentor resolves its tracer directly off the provider we hand it, so global registration isn't needed.

## Force-flush

- **`src/app/api/chat/route.ts`** — calls `getTracerProvider()?.forceFlush()` after `stream.completed`. Without it, the OTel batch processor can hold spans past the request lifecycle and they're never written.

## What differs from the no-observability tier

- **`src/ai/tracing.ts`** — new file (above).
- **`instrumentation.ts`** — new file (above).
- **`src/app/api/chat/route.ts`** — single added `forceFlush()` call.
- **`next.config.ts`** — adds `@arizeai/openinference-instrumentation-openai-agents` to `serverExternalPackages`.
- **`package.json`** — adds `@arizeai/openinference-instrumentation-openai-agents`, `@arizeai/openinference-semantic-conventions`, `@opentelemetry/exporter-trace-otlp-proto`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`.
- **`env.example`** — adds `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`.

Everything else (agent, tools, UI, lib, components, scripts) is unchanged.

## Span coverage

Same as Phoenix — the OpenInference instrumentor emits one canonical span tree:

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
npm run dev
```
