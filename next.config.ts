import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.shadcnblocks.com",
        pathname: "/images/block/logos/**",
      },
    ],
  },
};

export default nextConfig;
