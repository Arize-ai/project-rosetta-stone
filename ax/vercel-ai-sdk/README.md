# Wonder Toys — Vercel AI SDK (Arize AX Instrumented)

This is the Vercel AI SDK (TypeScript) variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability. It uses **AI SDK v7**.

## Observability Setup

AX instrumentation is configured in `src/instrumentation.ts` via Next.js's instrumentation hook:

```typescript
import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  isOpenInferenceSpan,
  OpenInferenceSimpleSpanProcessor,
} from '@arizeai/openinference-vercel';
import { registerTelemetry } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';

export function register() {
  registerOTel({
    serviceName: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    attributes: { model_id: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk' },
    spanProcessors: [
      new OpenInferenceSimpleSpanProcessor({
        exporter: new OTLPTraceExporter({
          url: 'https://otlp.arize.com/v1/traces',
          headers: {
            'arize-space-id': process.env.ARIZE_SPACE_ID ?? '',
            'arize-api-key': process.env.ARIZE_API_KEY ?? '',
          },
        }),
        spanFilter: isOpenInferenceSpan,
        reparentOrphanedSpans: true,
      }),
    ],
  });

  // AI SDK v7 removed built-in OTel tracing — @ai-sdk/otel bridges the SDK's
  // telemetry events into OpenTelemetry spans. Without this, the per-call
  // `experimental_telemetry: { isEnabled: true }` opt-in emits no spans.
  registerTelemetry(new OpenTelemetry());
}
```

Raw OpenTelemetry via `@vercel/otel` — no Arize-specific SDK package required, just OTLP export directly to `otlp.arize.com`.

### AI SDK v7 telemetry

AI SDK **v7** removed the built-in OpenTelemetry tracing that v6 emitted directly. Telemetry now flows through a pluggable **integrations** model: the SDK emits internal telemetry events and a registered integration turns them into spans. `@ai-sdk/otel`'s `registerTelemetry(new OpenTelemetry())` installs that bridge globally, so each `streamText` call only needs the `experimental_telemetry: { isEnabled: true }` opt-in (set in `src/app/api/chat/route.ts`). Without the bridge, v7 produces **zero** spans.

### Span filter + reparenting

The Vercel AI SDK's spans nest under HTTP `POST`/`GET` spans that `@vercel/otel` and Next.js emit for every request. Two options on the stock `OpenInferenceSimpleSpanProcessor` (from `@arizeai/openinference-vercel` ≥ 2.8.0) clean this up:

1. **`spanFilter: isOpenInferenceSpan`** keeps only the AI spans and drops the raw HTTP/fetch spans.
2. **`reparentOrphanedSpans: true`** re-roots any AI span left orphaned when the filter drops its parent, so the top-level call span becomes a clean trace root.

This replaces the bespoke `RootAwareOpenInferenceProcessor` the tier used previously. See the [Arize docs on span filtering](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/vercel/vercel-ai-sdk-v7-tracing#span-filter) for the full explanation.

## Differences from `no-observability/vercel-ai-sdk`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/instrumentation.ts` | **New** — `registerOTel` with the stock OpenInference processor (`reparentOrphanedSpans`) + `@ai-sdk/otel` `registerTelemetry` |
| `src/app/api/chat/route.ts` | Adds `experimental_telemetry: { isEnabled: true }` to the `streamText` call (plus the `x-eval-secret` bypass for headless evals) |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@ai-sdk/otel`, `@vercel/otel`, `@opentelemetry/*`, `@arizeai/openinference-vercel` added |
| `env.example` | AX env vars added |

All other frontend code, tools, and agent logic are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + AX credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
