import { Context } from "@opentelemetry/api";
import {
  BatchSpanProcessor,
  ReadableSpan,
  Span,
  SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { getSession } from "@arizeai/openinference-core";
import {
  SemanticConventions,
  SESSION_ID,
} from "@arizeai/openinference-semantic-conventions";
import { LRUCache } from "lru-cache";

// Top-level LangChain/LangGraph runnable names that should become the trace root
// when HTTP infrastructure spans would otherwise parent them. `LangGraph` is the
// `lc_name()` of the compiled Pregel graph that `createReactAgent` returns.
const ROOT_OI_SPAN_PREFIXES = [
  "LangGraph",
  "RunnableSequence",
  "AgentExecutor",
];

function isRootOISpanByName(spanName: string): boolean {
  const head = spanName.split(" ")[0];
  return ROOT_OI_SPAN_PREFIXES.some(
    (prefix) => head === prefix || head.startsWith(prefix + " "),
  );
}

function isOpenInferenceSpan(span: ReadableSpan): boolean {
  return (
    typeof span.attributes[SemanticConventions.OPENINFERENCE_SPAN_KIND] ===
    "string"
  );
}

interface RootAwareConfig {
  exporter: SpanExporter;
  cacheSize?: number;
}

export class RootAwareOpenInferenceProcessor extends BatchSpanProcessor {
  private traceIds: LRUCache<string, boolean>;

  constructor(config: RootAwareConfig) {
    super(config.exporter);
    this.traceIds = new LRUCache({ max: config.cacheSize ?? 1000 });
  }

  onStart(span: Span, parentContext: Context): void {
    const session = getSession(parentContext);
    if (session?.sessionId) {
      span.setAttribute(SESSION_ID, session.sessionId);
    }

    const traceId = span.spanContext().traceId;
    if (isRootOISpanByName(span.name) && !this.traceIds.has(traceId)) {
      (span as unknown as { parentSpanId?: string }).parentSpanId = undefined;
      (span as unknown as { parentSpanContext?: unknown }).parentSpanContext =
        undefined;
      this.traceIds.set(traceId, true);
    }

    super.onStart(span, parentContext);
  }

  onEnd(span: ReadableSpan): void {
    if (!isOpenInferenceSpan(span)) return;
    super.onEnd(span);
  }

  shutdown(): Promise<void> {
    this.traceIds.clear();
    return super.shutdown();
  }
}
