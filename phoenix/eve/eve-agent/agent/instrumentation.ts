import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import { RootAwareOpenInferenceProcessor } from "./root-aware-processor";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export default defineInstrumentation({
  setup: ({ agentName }) =>
    registerOTel({
      serviceName: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      attributes: {
        [SEMRESATTRS_PROJECT_NAME]: process.env.PHOENIX_PROJECT_NAME ?? "wonder-toys-eve",
      },
      spanProcessors: [
        new RootAwareOpenInferenceProcessor({
          exporter: new OTLPTraceExporter({
            url: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "",
            headers: { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` },
          }),
        }),
      ],
    }),
});
