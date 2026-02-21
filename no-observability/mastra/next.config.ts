import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/ai-sdk", "chromadb"],
};

export default nextConfig;
