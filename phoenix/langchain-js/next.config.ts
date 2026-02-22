import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@langchain/core", "@langchain/anthropic", "@langchain/langgraph", "@arizeai/phoenix-otel", "@arizeai/openinference-instrumentation-langchain", "chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
