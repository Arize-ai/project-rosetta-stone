import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "@anthropic-ai/claude-agent-sdk",
    "chromadb",
    "@chroma-core/default-embed",
  ],
};

export default nextConfig;
