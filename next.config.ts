import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode export statique pour Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Exclude API routes from static export (will be handled by Cloudflare Workers)
  // The API routes need to be deployed separately as Cloudflare Workers
};

export default nextConfig;
