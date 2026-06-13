import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "@openai/agents",
    "@openai/agents-core",
    "@arizeai/openinference-instrumentation-openai-agents",
    "chromadb",
    "@chroma-core/default-embed",
  ],
};

export default nextConfig;
