import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Externalise the whole OpenTelemetry + OpenInference stack so the app code
  // and the instrumentor share a SINGLE copy of `@opentelemetry/api` (and its
  // one global ContextManager). If webpack bundled a second copy, our
  // `context.with(chainSpan)` would be invisible to the instrumentor's
  // `context.active()`, and the instrumentor's AGENT span would land in a
  // separate trace from our CHAIN parent instead of nesting under it.
  serverExternalPackages: [
    "@anthropic-ai/claude-agent-sdk",
    "@arizeai/openinference-instrumentation-claude-agent-sdk",
    "@arizeai/openinference-semantic-conventions",
    "@arizeai/phoenix-otel",
    "@opentelemetry/api",
    "@opentelemetry/context-async-hooks",
    "@opentelemetry/core",
    "@opentelemetry/exporter-trace-otlp-proto",
    "@opentelemetry/sdk-trace-base",
    "chromadb",
    "@chroma-core/default-embed",
  ],
};

export default nextConfig;
