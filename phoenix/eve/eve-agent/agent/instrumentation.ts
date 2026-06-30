import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import {
  OpenInferenceSimpleSpanProcessor,
  isOpenInferenceSpan,
} from "@arizeai/openinference-vercel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

// Eve owns the model loop and registers AI SDK v7 telemetry itself
// (`registerTelemetry(new OpenTelemetry(...))` via its otel-integration
// harness), so this file only wires the OTel provider + exporter.
export default defineInstrumentation({
  setup: () =>
    registerOTel({
      serviceName: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      attributes: {
        [SEMRESATTRS_PROJECT_NAME]: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      },
      spanProcessors: [
        // `reparentOrphanedSpans` (openinference-vercel v3) re-roots AI spans
        // whose non-AI parent the filter dropped. Eve's per-turn `ai.eve.turn`
        // wrapper is an `ai.*` framework span on top of the AI SDK — the flag
        // detects it by shape, tags it `openinference.span.kind = AGENT`, and
        // keeps it as the trace root. That replaces the old custom
        // RootAwareOpenInferenceProcessor.
        new OpenInferenceSimpleSpanProcessor({
          exporter: new OTLPTraceExporter({
            url: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "",
            headers: { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` },
          }),
          spanFilter: isOpenInferenceSpan,
          reparentOrphanedSpans: true,
        }),
      ],
    }),
});
