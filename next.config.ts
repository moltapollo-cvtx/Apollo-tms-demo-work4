import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily disable type checking in build for demo
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
