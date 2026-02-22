import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@langchain/core", "@langchain/anthropic", "@langchain/langgraph", "@arizeai/openinference-instrumentation-langchain", "@arizeai/openinference-semantic-conventions", "@opentelemetry/api", "@opentelemetry/exporter-trace-otlp-proto", "@opentelemetry/resources", "@opentelemetry/sdk-trace-base", "@opentelemetry/sdk-trace-node", "@opentelemetry/semantic-conventions", "chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
