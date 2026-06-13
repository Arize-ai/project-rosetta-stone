// Phoenix tracing initialiser for the OpenAI Agents TypeScript SDK.
//
// Called once at process startup by Next.js via the top-level
// `instrumentation.ts` file (`register()` runs before user-land modules
// load).
//
// The OpenAI Agents SDK exposes a first-class `TracingProcessor` interface
// rather than relying on monkey-patching, so the OpenInference instrumentor
// implements that interface and registers via the SDK's
// `setTraceProcessors` / `addTraceProcessor` APIs. We hand it the
// Phoenix-aware tracer provider returned by `@arizeai/phoenix-otel`.
//
// We override `register()`'s default span processor with our own
// `OpenInferenceFilteredBatchSpanProcessor` (subclass of the standard OTel
// `BatchSpanProcessor`) that drops any span without an
// `openinference.span.kind` attribute. Next.js's built-in OTel
// auto-instrumentation otherwise emits its own HTTP / page-render / fetch
// spans through whatever global provider is registered, and they'd
// otherwise pollute the Phoenix project alongside the agent spans.

let _initialised = false;

export async function initTracing() {
  if (_initialised) return;
  _initialised = true;

  const { register } = await import("@arizeai/phoenix-otel");
  const { OpenAIAgentsInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-openai-agents"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-proto"
  );
  const { OpenInferenceFilteredBatchSpanProcessor } = await import(
    "./oi-filter-processor"
  );
  // Whole-namespace import so the instrumentor can swap in its trace
  // processor before any Agent / run() calls fire.
  const agents = await import("@openai/agents");

  const projectName =
    process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-openai-agents-ts";
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

  const instrumentation = new OpenAIAgentsInstrumentation({
    tracerProvider: provider,
  });
  instrumentation.manuallyInstrument(agents);

  console.log(
    `[tracing] Phoenix tracing initialised for OpenAI Agents → ${baseUrl} (project: ${projectName}, OI-filtered)`,
  );
}
