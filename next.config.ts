import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
