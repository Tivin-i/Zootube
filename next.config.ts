import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly enable turbopack (silences the warning)
  turbopack: {},
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
};

export default nextConfig;
