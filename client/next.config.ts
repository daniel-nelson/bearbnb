import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  /* config options here */
};

export default nextConfig;
