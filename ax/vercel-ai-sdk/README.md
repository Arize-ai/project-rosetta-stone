# Wonder Toys — Vercel AI SDK (Arize AX Instrumented)

This is the Vercel AI SDK (TypeScript) variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

## Observability Setup

AX instrumentation is configured in `src/instrumentation.ts` via Next.js's instrumentation hook:

```typescript
import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

export function register() {
  registerOTel({
    serviceName: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    spanProcessors: [
      new RootAwareOpenInferenceProcessor({
        exporter: new OTLPTraceExporter({
          url: 'https://otlp.arize.com/v1/traces',
          headers: {
            space_id: process.env.ARIZE_SPACE_ID ?? '',
            api_key: process.env.ARIZE_API_KEY ?? '',
          },
        }),
      }),
    ],
  });
}
```

Raw OpenTelemetry via `@vercel/otel` — no Arize-specific SDK package required, just OTLP export directly to `otlp.arize.com`.

### Root-Aware Span Processor

The Vercel AI SDK emits spans for all operations including HTTP `POST`/`GET` requests, not just AI calls. The `@arizeai/openinference-vercel` package provides an `isOpenInferenceSpan` filter to drop these non-AI spans — but using it naively creates an orphaning problem: the HTTP spans are typically the trace root, so once they're filtered out the remaining AI spans have no parent and won't appear on the **Traces** tab (only on the **Spans** tab).

`src/root-aware-processor.ts` solves this with `RootAwareOpenInferenceProcessor`, which:

1. Applies the `isOpenInferenceSpan` filter to drop HTTP/infrastructure spans
2. Promotes the first top-level AI SDK span (e.g. `ai.streamText`) to be the actual trace root by clearing its parent span ID, using an LRU cache to ensure only the topmost span per trace is promoted

See the [Arize docs on span filtering](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/vercel/vercel-ai-sdk-tracing#span-filter) for the full explanation.

## Differences from `no-observability/vercel-ai-sdk`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/instrumentation.ts` | **New** — `registerOTel` with OTLP exporter pointing at Arize AX |
| `src/root-aware-processor.ts` | **New** — custom span processor that only exports root-level spans |
| `src/app/api/chat/route.ts` | Session ID read from `x-session-id` header and set into OTel context via `context.with(setSession(...))` before calling `streamText` |
| `src/components/Chat.tsx` | `sessionId` state persisted in `sessionStorage("chat-session-id")`; rotated to a new UUID when the user starts a new chat; sent as `x-session-id` header on every `/api/chat` request |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@vercel/otel`, `@opentelemetry/*`, `@arizeai/openinference-*` added |
| `env.example` | AX env vars added |

### Session tracking

Each conversation is assigned a UUID that groups all its spans under a single session in Arize. The ID is generated in `Chat.tsx` on first load (or restored from `sessionStorage`) and replaced with a fresh UUID whenever the user clicks the logo to start a new chat. It is sent to the server as an `x-session-id` request header.

In `route.ts`, the session ID is injected into the active OTel context using `setSession` from `@arizeai/openinference-core` before `streamText` is called, so every span created during that request automatically carries the `session.id` attribute:

```typescript
import { context } from '@opentelemetry/api';
import { setSession } from '@arizeai/openinference-core';

const sessionId = req.headers.get('x-session-id') ?? crypto.randomUUID();

const result = context.with(
  setSession(context.active(), { sessionId }),
  () => streamText({ ... }),
);
```

The `RootAwareOpenInferenceProcessor` (and the `SessionUserSpanProcessor` in `src/instrumentation.ts`) read the session ID back out of the context in their `onStart` hook and stamp it onto each span as it is created.

All other frontend code, tools, and agent logic are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + AX credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
