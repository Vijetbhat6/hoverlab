import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  /**
   * Load firebase-admin from node_modules at runtime instead of putting it
   * through the bundler.
   *
   * It is a Node-only package with native and conditional-export dependencies
   * — notably jwks-rsa, which reaches jose@6. jose@6 is ESM-only and declares
   * no `require` export, so anything that pulls it in through a CommonJS
   * wrapper fails with ERR_REQUIRE_ESM the first time a session is verified.
   * That is invisible in `next dev` and only appears in a deployed function.
   *
   * Paired with engines.node = 24.x in package.json: Node only supports
   * require() of an ES module from 22.12 onwards, so the runtime version is
   * part of this fix, not incidental to it.
   */
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
