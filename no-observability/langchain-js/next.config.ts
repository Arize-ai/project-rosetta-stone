import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@langchain/core", "@langchain/anthropic", "@langchain/langgraph", "chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
