// Phoenix tracing initialiser for BeeAI TypeScript.
//
// Called once at process startup:
//   - by Next.js via `instrumentation.ts` (`register()` runs before user-land
//     modules load)
//   - by the standalone smoke script (`scripts/smoke-agent.ts`)
//
// Uses `@arizeai/phoenix-otel`'s `register()` with our own
// `OpenInferenceFilteredSimpleSpanProcessor` — a local subclass of OTel's
// standard `SimpleSpanProcessor` defined in `./oi-filter-processor.ts` that
// drops any span without an `openinference.span.kind` attribute. Without
// this filter, Next.js's built-in OTel auto-instrumentation pipes its
// HTTP / fetch / page-render spans through the global provider and into
// the Phoenix project alongside the agent spans.
//
// Then patches `beeai-framework` via the OpenInference instrumentor's
// `manuallyInstrument(...)` — required under ESM because Next.js doesn't
// load modules via CommonJS, so the auto-instrumentor's require-time hook
// misses.

let _initialised = false;

export async function initTracing() {
  if (_initialised) return;
  _initialised = true;

  const { register } = await import("@arizeai/phoenix-otel");
  const { BeeAIInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-beeai"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-proto"
  );
  const { OpenInferenceFilteredSimpleSpanProcessor } = await import(
    "./oi-filter-processor"
  );
  // Whole namespace import so the instrumentor can patch all exported classes.
  const beeaiFramework = await import("beeai-framework");

  const projectName = process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-beeai-ts";
  // register() expects the base URL without /v1/traces — it appends.
  const rawEndpoint = process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006";
  const baseUrl = rawEndpoint.replace(/\/v1\/traces\/?$/, "");
  const apiKey = process.env.PHOENIX_API_KEY ?? undefined;

  const exporter = new OTLPTraceExporter({
    url: `${baseUrl.replace(/\/$/, "")}/v1/traces`,
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
  });

  const provider = register({
    projectName,
    spanProcessors: [new OpenInferenceFilteredSimpleSpanProcessor(exporter)],
  });

  const instrumentation = new BeeAIInstrumentation({ tracerProvider: provider });
  instrumentation.manuallyInstrument(beeaiFramework);

  console.log(
    `[tracing] Phoenix tracing initialised for BeeAI → ${baseUrl} (project: ${projectName}, OI-filtered)`,
  );
}
