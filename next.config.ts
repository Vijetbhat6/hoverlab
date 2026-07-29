import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The `build` / `start` package scripts (and .zscripts/build.sh) copy from
  // and run `.next/standalone/server.js`, which only exists with this set.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
