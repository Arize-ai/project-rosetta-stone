import {
  BatchSpanProcessor,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { SemanticConventions } from "@arizeai/openinference-semantic-conventions";

// Drops any span that doesn't carry an `openinference.span.kind` attribute
// before it reaches the underlying batch exporter. Belt-and-braces for the
// AX tier — we already skip `provider.register()` so Next.js's auto-OTel
// shouldn't see this provider in the first place, but if something ever
// makes the provider global, the filter keeps the AX project clean.
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
