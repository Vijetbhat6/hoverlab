import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * `typescript.ignoreBuildErrors` used to be true here.
   *
   * Source is clean under `tsc --noEmit`, so nothing was hiding behind it
   * — which is exactly why it cost nothing to turn off, and exactly why
   * leaving it on was the risk: the *next* type error would have shipped
   * silently instead of failing the build. There is no setting to restore
   * here; the default is to typecheck.
   */
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

  /**
   * One licence page, not two.
   *
   * `/licence` and `/license` both shipped — the legal document in the
   * (legal) route group, and a sales-shaped version of the same terms — and
   * both were indexed, both self-canonical, and both in the sitemap. That is
   * two pages competing for one query ("can I use these in client work"),
   * which splits whatever authority either would have had.
   *
   * `/licence` wins because it is the URL every internal link already used:
   * the footer twice, the pricing footnote, /docs, /terms, the homepage and
   * the legal nav. Redirecting the other way would have meant rewriting all
   * of those to point at a page that was linked from nowhere.
   *
   * Permanent (308), not temporary. The terms live at one address and are
   * meant to be forwarded to a client's legal team; a 307 tells a crawler
   * to keep both, which is the thing being fixed.
   */
  async redirects() {
    return [
      { source: "/license", destination: "/licence", permanent: true },
    ];
  },
};

export default nextConfig;
