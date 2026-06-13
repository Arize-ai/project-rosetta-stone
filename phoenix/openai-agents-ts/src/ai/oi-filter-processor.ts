import {
  BatchSpanProcessor,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { SemanticConventions } from "@arizeai/openinference-semantic-conventions";

// Drops any span that doesn't carry an `openinference.span.kind` attribute
// before it reaches the underlying batch exporter. Next.js's built-in OTel
// auto-instrumentation otherwise pipes its HTTP / fetch / page-render
// spans through whatever global provider is registered, polluting the
// observability project alongside the agent spans. Same predicate as
// `isOpenInferenceSpan` from `@arizeai/openinference-vercel`, inlined so we
// don't pull a Vercel-specific package into a non-Vercel tier.
function isOpenInferenceSpan(span: ReadableSpan): boolean {
  return (
    typeof span.attributes[SemanticConventions.OPENINFERENCE_SPAN_KIND] ===
    "string"
  );
}

export class OpenInferenceFilteredBatchSpanProcessor extends BatchSpanProcessor {
  onEnd(span: ReadableSpan): void {
    if (!isOpenInferenceSpan(span)) return;
    super.onEnd(span);
  }
}
