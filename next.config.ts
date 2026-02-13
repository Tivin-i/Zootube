import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Bundle analyzer (only when ANALYZE env var is set)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Explicitly enable turbopack (silences the warning)
  turbopack: {},
  // Standalone output for Docker; omit when building for Cloudflare (OpenNext)
  ...(process.env.BUILD_FOR_CLOUDFLARE !== "1" ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-table"],
  },
};

const config = withBundleAnalyzer(withPWA(nextConfig));

// Enable Cloudflare bindings in local dev (next dev)
initOpenNextCloudflareForDev();

export default config;
