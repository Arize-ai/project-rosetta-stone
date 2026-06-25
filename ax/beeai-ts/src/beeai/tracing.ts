// Arize AX tracing initialiser for BeeAI TypeScript.
//
// Called once at process startup:
//   - by Next.js via `instrumentation.ts` (`register()` runs before user-land
//     modules load)
//   - by the standalone smoke script (`scripts/smoke-agent.ts`)
//
// Sets up an OTel `NodeTracerProvider` with the `openinference.project.name`
// resource attribute (so AX routes spans to the right project), points the
// OTLP exporter at `otlp.arize.com/v1/traces` with the space/key headers,
// then patches `beeai-framework` via the OpenInference instrumentor's
// `manuallyInstrument(...)` — required under ESM because Next.js doesn't
// load modules via CommonJS, so the auto-instrumentor's require-time hook
// misses.
//
// Uses our own `OpenInferenceFilteredSimpleSpanProcessor` (subclass of OTel's
// standard `SimpleSpanProcessor`, defined in `./oi-filter-processor.ts`) so any
// span without an `openinference.span.kind` attribute is dropped before
// export — keeps Next.js's HTTP / fetch / page-render spans out of the AX
// project bucket.

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
  const { BeeAIInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-beeai"
  );
  const { OpenInferenceFilteredSimpleSpanProcessor } = await import(
    "./oi-filter-processor"
  );
  // Whole namespace import so the instrumentor can patch all exported classes.
  const beeaiFramework = await import("beeai-framework");

  const projectName = process.env.ARIZE_PROJECT_NAME ?? "wonder-toys-beeai-ts";
  const spaceId = process.env.ARIZE_SPACE_ID ?? "";
  const apiKey = process.env.ARIZE_API_KEY ?? "";

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: projectName,
      [SEMRESATTRS_PROJECT_NAME]: projectName,
    }),
    spanProcessors: [
      new OpenInferenceFilteredSimpleSpanProcessor(
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

  provider.register();
  _provider = provider;

  const instrumentation = new BeeAIInstrumentation({ tracerProvider: provider });
  instrumentation.manuallyInstrument(beeaiFramework);

  console.log(
    `[tracing] Arize AX tracing initialised for BeeAI → otlp.arize.com (project: ${projectName})`,
  );
}
