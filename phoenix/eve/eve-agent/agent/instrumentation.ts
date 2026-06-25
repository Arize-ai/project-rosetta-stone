import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import {
  isOpenInferenceSpan,
  OpenInferenceSimpleSpanProcessor,
} from "@arizeai/openinference-vercel";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export default defineInstrumentation({
  setup: ({ agentName }) =>
    registerOTel({
      serviceName: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      attributes: {
        [SEMRESATTRS_PROJECT_NAME]: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      },
      spanProcessors: [
        // `reparentOrphanedSpans` drops non-AI spans (raw HTTP/fetch, Vercel
        // Workflow) and re-roots any orphaned AI span. It also tags Eve's
        // `ai.eve.turn` wrapper as an agent span so it survives the filter as
        // the per-turn root — replacing the old custom RootAwareOpenInferenceProcessor.
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
