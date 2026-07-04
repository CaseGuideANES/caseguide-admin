import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/sign-in",
        permanent: false,
      },
      {
        source: "/marketing",
        destination: "/about",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;