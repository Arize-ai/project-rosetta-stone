import type { NextConfig } from "next";
import path from "node:path";

// Next.js 16 + Turbopack needs an explicit `turbopack.root` when public/
// contains a symlink to a directory outside the tier (we symlink
// `public/product-images` → repo-root product-images/). Without this,
// Turbopack's CSS asset scanner walks the symlink, computes a path that
// escapes the project root, and fails with "leaves the filesystem root".
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
