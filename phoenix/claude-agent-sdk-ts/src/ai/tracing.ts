// Phoenix tracing initialiser for the Claude Agent SDK (TypeScript).
//
// Called once at process startup by Next.js via the top-level
// `instrumentation.ts` file (`register()` runs before user-land modules load).
//
// The OpenInference instrumentor for the Claude Agent SDK patches the SDK's
// `query()` export to emit AGENT spans (and TOOL child spans via hook
// injection). Because the SDK is native ESM whose exports are read-only, the
// instrumentor's `manuallyInstrument()` returns a *patched copy* of the module
// rather than mutating it in place — so the chat route must call the patched
// `query()` we expose here via `getInstrumentedQuery()`, not the static import.
//
// The instrumentor emits no LLM spans (the SDK makes its model calls inside the
// spawned Claude Code subprocess, invisible to an in-process instrumentor), so
// `agent.ts` synthesizes per-generation LLM spans using the tracer exposed here.
//
// We hand the instrumentor the Phoenix-aware tracer provider returned by
// `@arizeai/phoenix-otel` register(), overriding its default span processor
// with `OpenInferenceFilteredBatchSpanProcessor` so Next.js's built-in OTel
// HTTP/render spans don't pollute the Phoenix project alongside agent spans.

import type { Tracer, TracerProvider } from "@opentelemetry/api";
import type { query as QueryFn } from "@anthropic-ai/claude-agent-sdk";

// Tracing state is stashed on globalThis, not in module scope. In Next.js dev
// (Turbopack/HMR) this module can be re-evaluated, and the OpenInference
// instrumentor's process-global patch guard means a *second* manuallyInstrument
// returns the UN-patched SDK module — which would silently drop AGENT/TOOL
// spans. A globalThis singleton guarantees exactly one init and one patched
// `query()` for the life of the process, in dev and production alike.
type TracingState = {
  initialised: boolean;
  provider: (TracerProvider & { forceFlush?: () => Promise<void> }) | null;
  tracer: Tracer | null;
  query: typeof QueryFn | null;
};
const _g = globalThis as unknown as { __casTracing?: TracingState };
function state(): TracingState {
  if (!_g.__casTracing) {
    _g.__casTracing = {
      initialised: false,
      provider: null,
      tracer: null,
      query: null,
    };
  }
  return _g.__casTracing;
}

export function getTracerProvider() {
  return state().provider;
}

export function getTracer(): Tracer | null {
  return state().tracer;
}

export async function getInstrumentedQuery(): Promise<typeof QueryFn> {
  const s = state();
  if (s.query) return s.query;
  // Defensive fallback: tracing not initialised yet — use the un-patched query
  // so chat still works (no AGENT spans until init completes).
  const sdk = await import("@anthropic-ai/claude-agent-sdk");
  return sdk.query;
}

export async function initTracing() {
  const s = state();
  if (s.initialised) return;
  s.initialised = true;

  const { register } = await import("@arizeai/phoenix-otel");
  const { ClaudeAgentSDKInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-claude-agent-sdk"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-proto"
  );
  const { OpenInferenceFilteredBatchSpanProcessor } = await import(
    "./oi-filter-processor"
  );
  const { context } = await import("@opentelemetry/api");
  const { AsyncLocalStorageContextManager } = await import(
    "@opentelemetry/context-async-hooks"
  );
  const sdk = await import("@anthropic-ai/claude-agent-sdk");

  // Register a context manager so implicit OTel context propagation
  // (`context.with` / `context.active`) works. We deliberately do NOT call
  // `provider.register()` (that would make the provider global and let Next's
  // auto-OTel pollute the project), but the instrumentor parents its AGENT and
  // TOOL spans via the active context, and our CHAIN parent is propagated the
  // same way — both need a live ContextManager. Without one, `context.with` is
  // a no-op and the AGENT span becomes a separate root trace.
  const cm = new AsyncLocalStorageContextManager();
  cm.enable();
  context.setGlobalContextManager(cm);

  const projectName =
    process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-claude-agent-sdk-ts";
  // register() expects the base URL without /v1/traces — it appends.
  const rawEndpoint =
    process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006";
  const baseUrl = rawEndpoint.replace(/\/v1\/traces\/?$/, "");
  const apiKey = process.env.PHOENIX_API_KEY ?? undefined;

  const exporter = new OTLPTraceExporter({
    url: `${baseUrl.replace(/\/$/, "")}/v1/traces`,
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
  });

  const provider = register({
    projectName,
    url: baseUrl,
    apiKey,
    spanProcessors: [new OpenInferenceFilteredBatchSpanProcessor(exporter)],
  });

  s.provider = provider as TracerProvider & {
    forceFlush?: () => Promise<void>;
  };
  s.tracer = provider.getTracer("claude-agent-sdk-llm-spans");

  const instrumentation = new ClaudeAgentSDKInstrumentation({
    tracerProvider: provider,
  });
  // manuallyInstrument returns the patched module for native ESM — keep the
  // patched `query` so the chat route drives the instrumented code path.
  const patched = instrumentation.manuallyInstrument(sdk);
  s.query = patched.query;

  console.log(
    `[tracing] Phoenix tracing initialised for Claude Agent SDK → ${baseUrl} (project: ${projectName}, OI-filtered)`,
  );
}
