import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api';
import {
  isOpenInferenceSpan,
  OpenInferenceSimpleSpanProcessor,
} from '@arizeai/openinference-vercel';
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import { registerTelemetry } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';

// Captures OTLP export errors and OTel pipeline warnings
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export function register() {
  registerOTel({
    serviceName: process.env.PHOENIX_PROJECT_NAME ?? 'wonder-toys-vercel',
    attributes: {
      [SEMRESATTRS_PROJECT_NAME]: process.env.PHOENIX_PROJECT_NAME ?? 'wonder-toys-vercel',
    },
    spanProcessors: [
      // `reparentOrphanedSpans` drops non-AI spans (raw HTTP/fetch) and re-roots
      // any AI span the filter would otherwise orphan, so each call lands as a
      // single clean trace root.
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

  // AI SDK v7 removed built-in OTel tracing; @ai-sdk/otel bridges the SDK's
  // telemetry events into OpenTelemetry spans. Without this, the per-call
  // `experimental_telemetry: { isEnabled: true }` opt-in emits no spans.
  registerTelemetry(new OpenTelemetry());
}
