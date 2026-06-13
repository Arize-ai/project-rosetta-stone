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

let _initialised = false;

export async function initTracing() {
  if (_initialised) return;
  _initialised = true;

  const { register } = await import("@arizeai/phoenix-otel");
  const { OpenAIAgentsInstrumentation } = await import(
    "@arizeai/openinference-instrumentation-openai-agents"
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

  const provider = register({
    projectName,
    url: baseUrl,
    apiKey,
    batch: true,
  });

  const instrumentation = new OpenAIAgentsInstrumentation({
    tracerProvider: provider,
  });
  instrumentation.manuallyInstrument(agents);

  console.log(
    `[tracing] Phoenix tracing initialised for OpenAI Agents → ${baseUrl} (project: ${projectName})`,
  );
}
