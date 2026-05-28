import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "beeai-framework",
    "chromadb",
    "@arizeai/openinference-instrumentation-beeai",
    "@opentelemetry/sdk-node",
    "@opentelemetry/sdk-trace-node",
    "@opentelemetry/exporter-trace-otlp-proto",
  ],
};

export default nextConfig;
