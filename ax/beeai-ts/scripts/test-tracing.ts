import "dotenv/config";
import { register } from "@arizeai/phoenix-otel";
import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { BeeAIInstrumentation } from "@arizeai/openinference-instrumentation-beeai";
import * as beeaiFramework from "beeai-framework";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const provider = register({
  projectName: "wonder-toys-beeai-ts",
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: "http://localhost:6006/v1/traces",
      }),
    ),
  ],
});

const inst = new BeeAIInstrumentation({ tracerProvider: provider });
inst.manuallyInstrument(beeaiFramework as any);
console.log("---instrumentation done---");
console.log("beeai version:", (beeaiFramework as any).Version);
