import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images configuration for Cloudflare
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
