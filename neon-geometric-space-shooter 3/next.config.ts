import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allow the sandbox preview proxy (and local host) to load dev assets
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;
