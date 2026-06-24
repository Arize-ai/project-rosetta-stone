import { defineInstrumentation } from "eve/instrumentation";
import { registerOTel } from "@vercel/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { RootAwareOpenInferenceProcessor } from "./root-aware-processor";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export default defineInstrumentation({
  setup: ({ agentName }) =>
    registerOTel({
      serviceName: process.env.ARIZE_PROJECT_NAME ?? "eve",
      attributes: { model_id: process.env.ARIZE_PROJECT_NAME ?? "eve" },
      spanProcessors: [
        new RootAwareOpenInferenceProcessor({
          exporter: new OTLPTraceExporter({
            url: "https://otlp.arize.com/v1/traces",
            headers: {
              "arize-space-id": process.env.ARIZE_SPACE_ID ?? "",
              "arize-api-key": process.env.ARIZE_API_KEY ?? "",
            },
          }),
        }),
      ],
    }),
});
