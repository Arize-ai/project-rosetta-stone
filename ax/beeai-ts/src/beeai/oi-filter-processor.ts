import {
  SimpleSpanProcessor,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { SemanticConventions } from "@arizeai/openinference-semantic-conventions";

// Drops any span that doesn't carry an `openinference.span.kind` attribute
// before it reaches the underlying simple-span exporter. Same predicate
// `@arizeai/openinference-vercel` uses internally, inlined locally so the
// BeeAI tier doesn't pull a Vercel-specific package.
//
// `SimpleSpanProcessor` (rather than `BatchSpanProcessor`) matches the
// original beeai-ts behaviour and ensures the standalone `smoke-agent.ts`
// script — which exits as soon as the run completes — doesn't drop the
// trailing batch.
function isOpenInferenceSpan(span: ReadableSpan): boolean {
  return (
    typeof span.attributes[SemanticConventions.OPENINFERENCE_SPAN_KIND] ===
    "string"
  );
}

export class OpenInferenceFilteredSimpleSpanProcessor extends SimpleSpanProcessor {
  onEnd(span: ReadableSpan): void {
    if (!isOpenInferenceSpan(span)) return;
    super.onEnd(span);
  }
}
