# Wonder Toys — BeeAI (TypeScript, Arize AX)

BeeAI TypeScript shopping agent, instrumented with **Arize AX**. This tier is a clone of `no-observability/beeai-ts` plus an OTel `NodeTracerProvider` configured to ship spans to `otlp.arize.com`.

## What this tier adds on top of the baseline

- **`src/beeai/tracing.ts`** — sets up `NodeTracerProvider` with the `openinference.project.name` resource attribute, an `OTLPTraceExporter` pointing at `https://otlp.arize.com/v1/traces`, and the AX `space_id` / `api_key` headers. Then patches `beeai-framework` via `BeeAIInstrumentation.manuallyInstrument(...)` (required under ESM).
- **`instrumentation.ts`** — Next.js auto-detects this file and runs `register()` once per server process at startup. Delegates to `src/beeai/tracing.ts`'s `initTracing()`.
- **`next.config.ts`** — adds the OTel SDK packages and `@arizeai/openinference-instrumentation-beeai` to `serverExternalPackages` so they aren't bundled.
- **`package.json`** — adds `@arizeai/openinference-instrumentation-beeai`, `@arizeai/openinference-semantic-conventions`, and the matching `@opentelemetry/*` packages.
- **`env.example`** — adds `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME`.

Everything else (agent code, tools, lib, UI, scripts) is byte-identical to `no-observability/beeai-ts`.

## Why the version pins are what they are

The OpenInference instrumentation package (`@arizeai/openinference-instrumentation-beeai@^1.5.15`) declares a peer dep of `beeai-framework@^0.1.13`, but its **runtime source still hardcodes** `INSTRUMENTS = [">=0.1.9 <0.1.14"]` — so on `beeai-framework@0.1.29` (latest) the `manuallyInstrument()` call silently bails out and no spans get produced.

Until upstream bumps the runtime constraint, this tier pins `beeai-framework@0.1.13`. The trade-off: `RequirementAgent` doesn't exist at 0.1.13, so we use `ReActAgent` instead. ReActAgent streams properly via `partialUpdate` events with `update.key === "final_answer"`, which is exactly what the chat SSE route needs.

## Architecture

See `no-observability/beeai-ts/CLAUDE.md` for the canonical breakdown — this tier shares the same `src/` layout. Just instrumented.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```

After a chat, traces land in the AX project named in `ARIZE_PROJECT_NAME`.

## Smoke test (bypasses NextAuth)

```bash
npx tsx scripts/smoke-agent.ts
```

Streams the canned 3-turn dragon-toys conversation through the agent directly. Traces land in AX after a ~30s ingestion wait.
