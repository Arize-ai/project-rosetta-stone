import { registerOTel } from '@vercel/otel';
import { registerTelemetry } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';
import {
  OpenInferenceSimpleSpanProcessor,
  isOpenInferenceSpan,
} from '@arizeai/openinference-vercel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api';
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";

// Captures OTLP export errors and OTel pipeline warnings
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export function register() {
  // AI SDK v7 emits telemetry via @ai-sdk/otel. registerTelemetry turns it on
  // once at startup; per-call `telemetry` is then only needed for metadata.
  registerTelemetry(
    new OpenTelemetry({
      usage: true,
      providerMetadata: true,
      embedding: true,
      reranking: true,
      runtimeContext: true,
      headers: true,
      toolChoice: true,
      schema: true,
    }),
  );

  registerOTel({
    serviceName: process.env.PHOENIX_PROJECT_NAME ?? 'wonder-toys-vercel',
    attributes: {
      [SEMRESATTRS_PROJECT_NAME]: process.env.PHOENIX_PROJECT_NAME ?? 'wonder-toys-vercel',
    },
    spanProcessors: [
      // `reparentOrphanedSpans` re-roots AI spans whose non-AI parent (the
      // Next.js HTTP span) is dropped by the filter — replacing the old custom
      // RootAwareOpenInferenceProcessor. `propagateContextAttributes` (on by
      // default) copies the session id set via setSession(...) in the chat
      // route onto every AI span, so turns group into sessions.
      new OpenInferenceSimpleSpanProcessor({
        exporter: new OTLPTraceExporter({
          url: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? '',
          headers: { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` },
        }),
        spanFilter: isOpenInferenceSpan,
        reparentOrphanedSpans: true,
      }),
    ],
  });
}
