import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
  // Include @sparticuz/chromium binary files in the serverless bundle
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - outputFileTracingIncludes is valid but missing from older type defs
  outputFileTracingIncludes: {
    '/api/admin/import-bmw-images': ['./node_modules/@sparticuz/chromium/**/*'],
    '/api/admin/import-bmw-options': ['./node_modules/@sparticuz/chromium/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hzrxlhdhfaqraiaqyewk.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
