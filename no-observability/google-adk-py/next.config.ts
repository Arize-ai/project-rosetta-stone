import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo has multiple Next.js sub-projects under no-observability/,
  // phoenix/, and ax/, with no root package.json. Without an explicit
  // turbopack root, Next.js 16 + Turbopack walks up and can't resolve
  // next/package.json from src/app.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
