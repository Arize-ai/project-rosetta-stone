import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/ai-sdk", "@mastra/arize", "chromadb"],
};

export default nextConfig;
