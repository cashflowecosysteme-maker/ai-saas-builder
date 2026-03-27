import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode export statique pour Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
