import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import {
  OpenInferenceSimpleSpanProcessor,
  isOpenInferenceSpan,
} from "@arizeai/openinference-vercel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

// Eve owns the model loop and registers AI SDK v7 telemetry itself
// (`registerTelemetry(new OpenTelemetry(...))` via its otel-integration
// harness), so this file only wires the OTel provider + exporter.
export default defineInstrumentation({
  setup: () =>
    registerOTel({
      serviceName: process.env.ARIZE_PROJECT_NAME ?? "eve",
      attributes: { model_id: process.env.ARIZE_PROJECT_NAME ?? "eve" },
      spanProcessors: [
        // `reparentOrphanedSpans` (openinference-vercel v3) re-roots AI spans
        // whose non-AI parent the filter dropped. Eve's per-turn `ai.eve.turn`
        // wrapper is an `ai.*` framework span on top of the AI SDK — the flag
        // detects it by shape, tags it `openinference.span.kind = AGENT`, and
        // keeps it as the trace root. That replaces the old custom
        // RootAwareOpenInferenceProcessor.
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
