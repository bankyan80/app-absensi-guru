import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Untuk Vercel, tidak perlu output khusus (default sudah optimal)
  // Untuk GitHub Pages static, gunakan: output: "export"
  // Untuk VPS/self-hosted, gunakan: output: "standalone"
  
  images: {
    unoptimized: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
