import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next-clean',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hzrxlhdhfaqraiaqyewk.supabase.co',
      },
    ],
  },
};

export default nextConfig;
