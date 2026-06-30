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
    serviceName: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    attributes: {
      model_id: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    },
    spanProcessors: [
      // `reparentOrphanedSpans` re-roots AI spans whose non-AI parent (the
      // Next.js HTTP span) is dropped by the filter — replacing the old custom
      // RootAwareOpenInferenceProcessor. `propagateContextAttributes` (on by
      // default) copies the session id set via setSession(...) in the chat
      // route onto every AI span, so turns group into sessions.
      new OpenInferenceSimpleSpanProcessor({
        exporter: new OTLPTraceExporter({
          url: 'https://otlp.arize.com/v1/traces',
          headers: {
            'arize-space-id': process.env.ARIZE_SPACE_ID ?? '',
            'arize-api-key': process.env.ARIZE_API_KEY ?? '',
          },
        }),
        spanFilter: isOpenInferenceSpan,
        reparentOrphanedSpans: true,
      }),
    ],
  });
}
