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
  // Override Permissions-Policy so we don't send unrecognized directives (e.g. browsing-topics)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
  // Allow dev server access from APP_URL (e.g. Docker accessed via host IP)
  ...(process.env.APP_URL
    ? (() => {
        try {
          const raw = process.env.APP_URL!;
          const origin = new URL(raw.startsWith("http") ? raw : `http://${raw}`).origin;
          return { allowedDevOrigins: [origin] };
        } catch {
          return {};
        }
      })()
    : {}),
};

const config = withBundleAnalyzer(withPWA(nextConfig));

// Enable Cloudflare bindings in local dev (next dev). Skip when running in Docker:
// workerd binary is glibc-only and cannot run on Alpine (musl).
if (process.env.SKIP_CLOUDFLARE_DEV_INIT !== "1") {
  initOpenNextCloudflareForDev();
}

export default config;
