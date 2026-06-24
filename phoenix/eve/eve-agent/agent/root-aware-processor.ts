import { Context } from "@opentelemetry/api";
import { ReadableSpan, Span, SpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  OpenInferenceSimpleSpanProcessor,
  isOpenInferenceSpan,
} from "@arizeai/openinference-vercel";
import { LRUCache } from "lru-cache";

// Eve wraps each turn's OpenInference spans under its own `ai.eve.turn`
// workflow span, which in turn hangs off Vercel Workflow spans that are
// dropped. Keep `ai.eve.turn` and promote it to the trace root so the
// gen_ai spans have a single, un-orphaned parent.
const EVE_ROOT_SPAN_NAME = "ai.eve.turn";

function isEveSpan(span: ReadableSpan): boolean {
  return isOpenInferenceSpan(span) || span.name === EVE_ROOT_SPAN_NAME;
}

interface RootAwareConfig {
  exporter: SpanExporter;
  cacheSize?: number;
}

export class RootAwareOpenInferenceProcessor
  extends OpenInferenceSimpleSpanProcessor {
  private traceIds: LRUCache<string, boolean>;

  constructor(config: RootAwareConfig) {
    super({ exporter: config.exporter, spanFilter: isEveSpan });
    this.traceIds = new LRUCache({ max: config.cacheSize ?? 1000 });
  }

  onStart(span: Span, parentContext: Context): void {
    const traceId = span.spanContext().traceId;
    if (span.name === EVE_ROOT_SPAN_NAME && !this.traceIds.has(traceId)) {
      (span as unknown as { parentSpanId?: string }).parentSpanId = undefined;
      (span as unknown as { parentSpanContext?: unknown })
        .parentSpanContext = undefined;
      this.traceIds.set(traceId, true);
    }
    super.onStart(span, parentContext);
  }

  shutdown(): Promise<void> {
    this.traceIds.clear();
    return super.shutdown();
  }
}
