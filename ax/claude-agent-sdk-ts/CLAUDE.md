# Wonder Toys — OpenAI Agents SDK TypeScript (No Observability)

The OpenAI Agents JS SDK variant of the Wonder Toys shopping agent. Baseline tier with no observability instrumentation.

## What differs from the other TS tiers

- **`src/ai/`** — `Agent` from `@openai/agents` + a per-request `AgentInputItem[]` history (built with the `user(...)` / `assistant(...)` helpers). Tools defined via `tool({ name, description, parameters: zod-v4, execute })` from `@openai/agents`.
- **`src/app/api/chat/route.ts`** — `await run(agent, history, { stream: true, maxTurns: 10 })`, then iterate `stream.toStream()`. `raw_model_stream_event` → `output_text_delta` gives token deltas; `run_item_stream_event` → `tool_call_item` marks tool boundaries (used to inject a `\n\n` between pre- and post-tool text).
- **Eval-bypass header** — the chat route checks `x-eval-secret` against `EVAL_SECRET` (env). When matched, NextAuth is skipped and the user ID is taken from `x-eval-user-id`. Lets the rosetta-test harness drive chat without going through Twitter OAuth.
- **`next.config.ts`** — `serverExternalPackages` lists `@openai/agents`, `@openai/agents-core`, `chromadb`, `@chroma-core/default-embed`. `turbopack.root` is set to `__dirname` per the Next.js 16 + Turbopack convention.
- **`package.json`** — depends on `@openai/agents` + `zod@4` (peer-dep requirement of `@openai/agents`).
- **LLM** — `gpt-5.4-mini` via the native OpenAI Responses API (not Anthropic), matching the Python `openai-agents-py` tier. The SDK can be routed through `@ai-sdk/anthropic` via `@openai/agents-extensions`, but the native path keeps the OpenInference tracing surface clean.

Everything else (`src/lib`, `src/components`, `src/app/*` pages, `scripts/`) is identical to the other TypeScript tiers.

## What changes in observability tiers

When creating `phoenix/openai-agents-ts` or `ax/openai-agents-ts`:

- **`src/ai/tracing.ts`** — new file. Sets up an OTel tracer provider and hands it to `OpenAIAgentsInstrumentation.manuallyInstrument(agents)`. The instrumentor implements the SDK's first-class `TracingProcessor` interface — no monkey-patch.
- **`instrumentation.ts`** — new file at the project root. Next.js auto-detects it and calls `register()` once per server process.
- **`next.config.ts`** — additional observability packages in `serverExternalPackages`.
- **`package.json`** — observability dependencies (`@arizeai/openinference-instrumentation-openai-agents` plus the platform-specific OTel wiring).
- **`env.example`** — observability environment variables.
- **`src/app/api/chat/route.ts`** (AX only) — calls `getTracerProvider()?.forceFlush()` after stream completion so spans drain out of the batch buffer before the route handler exits.

## Running

```bash
npm run dev        # Full startup: ChromaDB + indexing + Next.js
npm run dev:next   # Next.js only (search falls back to keyword matching)
```
