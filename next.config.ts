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
   * Where the build writes. `.next` unless NEXT_DIST_DIR says otherwise.
   *
   * Two sessions in one checkout share `.next`: a `next build` rewrites the
   * directory a running `next dev` reads, and deleting it kills the dev
   * server outright. Pointing a verification build somewhere else (e.g.
   * NEXT_DIST_DIR=.next-verify) leaves the other one alone. Unset on Netlify,
   * so production output is unchanged.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /**
   * Canonical site URL on Netlify.
   *
   * lib/site.ts reads NEXT_PUBLIC_SITE_URL and has no other fallback. Vercel
   * used to supply one; Netlify does too, as `URL` — the primary address of
   * the site, which is the custom domain once one is attached and the
   * *.netlify.app name until then. `env` inlines it at build time exactly
   * like a NEXT_PUBLIC_ variable, so neither the prerendered pages nor the
   * checkout return URL can silently say localhost.
   *
   * An explicit NEXT_PUBLIC_SITE_URL always wins. Gated on NETLIFY so no other
   * host (or a developer machine that happens to have a `URL` variable)
   * picks it up.
   */
  env: {
    ...(process.env.NETLIFY === "true" &&
    !process.env.NEXT_PUBLIC_SITE_URL &&
    process.env.URL
      ? { NEXT_PUBLIC_SITE_URL: process.env.URL }
      : {}),

    /**
     * Whether this deployment can ever geolocate a visitor.
     *
     * The regional-offer banner sits in the root layout, so without this every
     * page view on every host fired a function call to /api/billing/pricing —
     * and on a host that sends no trusted country header that call can only
     * ever answer "no offer". This mirrors `trustedCountryHeader()` in
     * src/lib/billing/region.ts: Vercel sets VERCEL, and a deployment behind
     * Cloudflare opts in with TRUST_CF_IPCOUNTRY=1. When a Netlify header is
     * added there, add it here too, or the banner will never ask.
     *
     * Inlined at build time, so both variables must be visible to the build.
     */
    NEXT_PUBLIC_GEO_PRICING:
      process.env.VERCEL || process.env.TRUST_CF_IPCOUNTRY === "1" ? "1" : "",

    /**
     * Whether `x-nf-client-connection-ip` can be believed, i.e. the build is
     * for Netlify. Inlined rather than read as NETLIFY at request time,
     * because whether Netlify exposes that variable to a running function is
     * not something to bet a quota on — an unset one would quietly fall back
     * to the spoofable header. See `clientIp()` in lib/billing/request-subject.ts.
     */
    TRUST_NF_CLIENT_IP: process.env.NETLIFY === "true" ? "1" : "",
  },

  /**
   * Response headers every page ships with.
   *
   * There were none, so the site could be framed by anyone, sniffed and
   * downgraded to http on a first visit. These are the ones that cost nothing
   * and cannot break a page:
   *
   *   HSTS              A year, no `includeSubDomains` and no `preload`: this
   *                     is served from a shared *.netlify.app name today and
   *                     will move to a custom domain, and preload is a
   *                     commitment that cannot be taken back quickly.
   *   nosniff           Stops a served file being reinterpreted as another type.
   *   Referrer-Policy   The default, made explicit, so it does not change
   *                     under us.
   *   Permissions-Policy  Nothing here uses the camera, microphone or
   *                     location, so nobody embedded on a page can ask.
   *   X-Frame-Options   The preview iframes are same-origin, so SAMEORIGIN
   *                     is enough. `/embed/*` is excluded on purpose: it is
   *                     an embed, and its own route sets `frame-ancestors *`.
   *
   * NOT here: a Content-Security-Policy. A useful one has to govern inline
   * scripts, and Next inlines its bootstrap, the preview iframes inherit the
   * parent's policy through srcdoc, and PostHog and the checkout redirect
   * add origins. That needs a Report-Only run against real traffic first —
   * shipping one blind would break pages to look secure.
   */
  async headers() {
    const baseline = [
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    return [
      { source: "/:path*", headers: baseline },
      {
        source: "/((?!embed/).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },

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
  /**
   * `/docs/mcp` moved to `/mcp`.
   *
   * Agent access stopped being a thing you look up after deciding and
   * became a thing people decide on, so it got a landing page and left the
   * docs tree — see the docblock on `src/app/mcp/page.tsx`. Every internal
   * link moved with it, but the old URL is in the npm README, the skill
   * files, and anywhere anyone has pasted it, so it cannot simply 404.
   *
   * Permanent (308), like the licence redirect above and for the same
   * reason: there is one page here, not two, and a 307 tells a crawler to
   * keep both and split whatever authority either had.
   *
   * Next carries the fragment through on its own, so the `#figma` anchor
   * that `/design-system` and `/figma` used to point at still lands on the
   * Figma section — which is why that section on the new page kept the id.
   */
  async redirects() {
    return [
      { source: "/license", destination: "/licence", permanent: true },
      { source: "/docs/mcp", destination: "/mcp", permanent: true },
    ];
  },
};

export default nextConfig;
