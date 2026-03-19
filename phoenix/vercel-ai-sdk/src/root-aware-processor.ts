import { Context } from '@opentelemetry/api';
import { Span } from '@opentelemetry/sdk-trace-base';
import { 
  OpenInferenceBatchSpanProcessor,
  isOpenInferenceSpan,
} from '@arizeai/openinference-vercel';
import { getSession } from '@arizeai/openinference-core';
import { SESSION_ID } from '@arizeai/openinference-semantic-conventions';
import { LRUCache } from 'lru-cache';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';

/**
 * Root OpenInference span prefixes from the Vercel AI SDK.
 * These are the top-level CHAIN spans that wrap LLM/Embedding operations.
 * 
 * Note: Span names may have a function ID suffix (e.g., "ai.generateText my-function-id")
 * so we need to check the prefix, not exact match.
 * 
 * These are what we want to look for to find the "root" openinference span. 
 * The first one we see will have it's context reset to have no parent
 */
const ROOT_OI_SPAN_PREFIXES = [
  'ai.generateText',
  'ai.generateObject',
  'ai.streamText',
  'ai.streamObject',
  'ai.embed',
  'ai.embedMany',
];


function isRootOISpanByName(spanName: string): boolean {
  const functionName = spanName.split(' ')[0];
  return ROOT_OI_SPAN_PREFIXES.some(prefix => 
    functionName === prefix || functionName.startsWith(prefix + ' ')
  );
}

interface RootAwareProcessorConfig {
  exporter: SpanExporter;
  /** Size of the LRU cache for tracking trace IDs. Defaults to 1000. */
  cacheSize?: number;
}

/**
 * A span processor that:
 * 1. Propagates OpenInference session ids from context to spans
 * 2. Makes the first root OpenInference span the actual root of the trace
 *    by clearing its parent span ID
 * 
 * This solves the issue where HTTP/fetch spans become root spans in Vercel/Next.js
 * environments, causing the trace hierarchy to break when using isOpenInferenceSpan filter.
 * 
 * Uses an LRU cache to track which traces have already had their root span identified.
 * This way if for some reason there are multiple ROOT_OI_SPAN_PREFIXES spans in a trace, only the "top" one will be set to root
 */
export class RootAwareOpenInferenceProcessor extends OpenInferenceBatchSpanProcessor {
  private traceIdCache: LRUCache<string, boolean>;
  
  constructor(config: RootAwareProcessorConfig) {
    super({
      exporter: config.exporter,
      spanFilter: isOpenInferenceSpan,
    });
    this.traceIdCache = new LRUCache({ max: config.cacheSize ?? 1000 });
  }

  onStart(span: Span, parentContext: Context): void {
    const sessionInfo = getSession(parentContext);
    if (sessionInfo?.sessionId) {
      span.setAttribute(SESSION_ID, sessionInfo.sessionId);
    }

    const spanName = span.name;
    const traceId = span.spanContext().traceId;
    
    if (isRootOISpanByName(spanName)) {
      if (!this.traceIdCache.has(traceId)) {
        // This is the first root OI span for this trace - make it the actual root and then add it to the lru cache
        // parentSpanId is a readonly property so we need to cast the Span to any to modify the parent context.
        (span as any).parentSpanId = undefined;
        (span as any).parentSpanContext = undefined;
        
        this.traceIdCache.set(traceId, true);
      }
    }

    super.onStart(span, parentContext);
  }
  
  shutdown(): Promise<void> {
    this.traceIdCache.clear();
    return super.shutdown();
  }
}
