import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api';
import { RootAwareOpenInferenceProcessor } from './root-aware-processor';

// Captures OTLP export errors and OTel pipeline warnings
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

export function register() {
  registerOTel({
    serviceName: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    attributes: {
      model_id: process.env.ARIZE_PROJECT_NAME ?? 'vercel-ai-sdk',
    },
    spanProcessors: [
      new RootAwareOpenInferenceProcessor({
        exporter: new OTLPTraceExporter({
          url: 'https://otlp.arize.com/v1/traces',
          headers: {
            space_id: process.env.ARIZE_SPACE_ID ?? '',
            api_key: process.env.ARIZE_API_KEY ?? '',
          },
        }),
      }),
    ],
  });
}
