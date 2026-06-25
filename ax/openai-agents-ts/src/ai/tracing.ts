// Arize AX tracing initialiser for the OpenAI Agents TypeScript SDK.
//
// Called once at process startup by Next.js via the top-level
// `instrumentation.ts` file (`register()` runs before user-land modules
// load).
//
// The OpenAI Agents SDK exposes a first-class `TracingProcessor` interface
// rather than relying on monkey-patching, so the OpenInference instrumentor
// implements that interface and registers via the SDK's
// `setTraceProcessors` / `addTraceProcessor` APIs. We hand it an OTel
// `NodeTracerProvider` configured to ship to AX's OTLP endpoint with the
// `openinference.project.name` resource attribute set so AX routes spans
// to the right project.
//
// We use our own `OpenInferenceFilteredBatchSpanProcessor` (subclass of
// the standard OTel `BatchSpanProcessor`) so any span without an
// `openinference.span.kind` attribute is dropped before export.

let _initialised = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _provider: any | null = null;

export function getTracerProvider() {
  return _provider;
}

export async function initTracing() {
  if (_initialised) return;
  _initialised = true;

  const { SEMRESATTRS_PROJECT_NAME } = await import(
    "@arizeai/openinference-semantic-conventions"
  );
  const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-proto");
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");
  const { ATTR_SERVICE_NAME } = await import("@opentelemetry/semantic-conventions");
  const { OpenAIAgentsInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-openai-agents"
  );
  const { OpenInferenceFilteredBatchSpanProcessor } = await import(
    "./oi-filter-processor"
  );
  // Whole-namespace import so the instrumentor can swap in its trace
  // processor before any Agent / run() calls fire.
  const agents = await import("@openai/agents");

  const projectName = process.env.ARIZE_PROJECT_NAME ?? "wonder-toys-openai-agents-ts";
  const spaceId = process.env.ARIZE_SPACE_ID ?? "";
  const apiKey = process.env.ARIZE_API_KEY ?? "";

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: projectName,
      [SEMRESATTRS_PROJECT_NAME]: projectName,
    }),
    spanProcessors: [
      new OpenInferenceFilteredBatchSpanProcessor(
        new OTLPTraceExporter({
          url: "https://otlp.arize.com/v1/traces",
          headers: {
            "arize-space-id": spaceId,
            "arize-api-key": apiKey,
          },
        }),
      ),
    ],
  });

  // NB: do *not* call `provider.register()`. The OpenAI Agents instrumentor
  // resolves its tracer directly off the provider we pass in, so making the
  // provider global would only invite collisions with Next.js's built-in
  // OTel auto-instrumentation (which would otherwise pump its own HTTP
  // spans into our project bucket).
  _provider = provider;

  const instrumentation = new OpenAIAgentsInstrumentation({
    tracerProvider: provider,
  });
  instrumentation.manuallyInstrument(agents);

  console.log(
    `[tracing] Arize AX tracing initialised for OpenAI Agents → otlp.arize.com (project: ${projectName})`,
  );
}
