import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@langchain/core", "@langchain/anthropic", "@langchain/langgraph", "@arizeai/phoenix-otel", "@arizeai/openinference-instrumentation-langchain", "@arizeai/openinference-core", "@arizeai/openinference-semantic-conventions", "@opentelemetry/exporter-trace-otlp-proto", "@opentelemetry/sdk-trace-base", "lru-cache", "chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
