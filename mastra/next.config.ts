import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/core", "@mastra/ai-sdk", "@mastra/arize"],
};

export default nextConfig;
