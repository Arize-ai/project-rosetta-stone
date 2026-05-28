# Wonder Toys — BeeAI (TypeScript, Phoenix)

BeeAI TypeScript shopping agent, instrumented with **Arize Phoenix Cloud** (or any Phoenix-compatible OTLP collector). This tier is a clone of `no-observability/beeai-ts` with a single addition: `instrumentation.ts` at the project root wires up the OpenInference BeeAI instrumentor and exports spans via OTLP/protobuf.

## What this tier adds on top of the baseline

- **`src/beeai/tracing.ts`** — calls `@arizeai/phoenix-otel`'s `register({ projectName, url, apiKey, batch: false })` **without** custom `spanProcessors` (phoenix-otel wraps its OTLP exporter in `OpenInferenceSimpleSpanProcessor` which knows how to thread the project-name resource attribute — passing your own SimpleSpanProcessor breaks project routing). Then patches `beeai-framework` via `BeeAIInstrumentation.manuallyInstrument(...)` (required under ESM because Next.js doesn't import via CommonJS).
- **`instrumentation.ts`** — Next.js auto-detects this file and runs `register()` once per server process at startup. Delegates to `src/beeai/tracing.ts`'s `initTracing()`.
- **`next.config.ts`** — adds `@arizeai/phoenix-otel` and `@arizeai/openinference-instrumentation-beeai` to `serverExternalPackages` so they aren't bundled.
- **`package.json`** — adds `@arizeai/phoenix-otel`, `@arizeai/openinference-instrumentation-beeai`, and `@opentelemetry/sdk-trace-base`.
- **`env.example`** — adds `PHOENIX_COLLECTOR_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME`.

Everything else (agent code, tools, lib, UI, scripts) is byte-identical to `no-observability/beeai-ts`.

## Architecture

See `no-observability/beeai-ts/CLAUDE.md` for the canonical breakdown — this tier shares the same `src/` layout. Just instrumented.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```

After a chat, traces land in the Phoenix project named in `PHOENIX_PROJECT_NAME`.

## Smoke test (bypasses NextAuth)

```bash
npx tsx scripts/smoke-agent.ts
```

Streams the canned 3-turn dragon-toys conversation through the agent directly. Traces land in Phoenix once it's running.
