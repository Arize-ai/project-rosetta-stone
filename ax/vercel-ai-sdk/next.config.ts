import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "chromadb",
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    '@arizeai/openinference-vercel',
    '@vercel/otel',
    '@ai-sdk/otel',
  ],
};

export default nextConfig;
