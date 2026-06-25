import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import {
  isOpenInferenceSpan,
  OpenInferenceSimpleSpanProcessor,
} from "@arizeai/openinference-vercel";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export default defineInstrumentation({
  setup: ({ agentName }) =>
    registerOTel({
      serviceName: process.env.ARIZE_PROJECT_NAME ?? "eve",
      attributes: { model_id: process.env.ARIZE_PROJECT_NAME ?? "eve" },
      spanProcessors: [
        // `reparentOrphanedSpans` drops non-AI spans (raw HTTP/fetch, Vercel
        // Workflow) and re-roots any orphaned AI span. It also tags Eve's
        // `ai.eve.turn` wrapper as an agent span so it survives the filter as
        // the per-turn root — replacing the old custom RootAwareOpenInferenceProcessor.
        new OpenInferenceSimpleSpanProcessor({
          exporter: new OTLPTraceExporter({
            url: "https://otlp.arize.com/v1/traces",
            headers: {
              "arize-space-id": process.env.ARIZE_SPACE_ID ?? "",
              "arize-api-key": process.env.ARIZE_API_KEY ?? "",
            },
          }),
          spanFilter: isOpenInferenceSpan,
          reparentOrphanedSpans: true,
        }),
      ],
    }),
});
