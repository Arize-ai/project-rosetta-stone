import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/product-images/:path*",
          destination:
            "https://raw.githubusercontent.com/Arize-ai/project-rosetta-stone/main/product-images/:path*",
        },
      ],
    };
  },
  serverExternalPackages: [
    "chromadb",
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    '@arizeai/openinference-core',
    '@arizeai/openinference-vercel',
    '@arizeai/openinference-semantic-conventions',
    '@vercel/otel',
    '@ai-sdk/otel',
  ],
};

export default nextConfig;
