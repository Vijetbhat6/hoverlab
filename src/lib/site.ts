/**
 * Canonical site URL, shared by the root metadata, the sitemap, robots, and
 * the checkout success redirect.
 *
 * Set NEXT_PUBLIC_SITE_URL to the production domain. Without an absolute
 * base, Next.js resolves OG images and sitemap entries against localhost,
 * which silently breaks every share card and every indexed URL — and since
 * checkout builds its return URL from here, a wrong value strands a paying
 * customer on a dead page immediately after they are charged.
 *
 * The Vercel fallbacks are ordered deliberately:
 *
 *   VERCEL_PROJECT_PRODUCTION_URL  the project's stable production domain.
 *     Constant across deploys, so canonical tags and sitemap entries stay
 *     valid rather than pointing at a build that has since been superseded.
 *
 *   VERCEL_URL  the deployment-specific hostname, which carries a per-build
 *     hash. Right for a preview (it is self-consistent), wrong for anything
 *     durable: the URL dies with the deployment, and preview hostnames sit
 *     behind Vercel's SSO wall where neither a crawler nor Polar's webhook
 *     can reach them.
 *
 * Both are server-side runtime values, not NEXT_PUBLIC_ build-time ones —
 * safe here because every consumer of this module is server-only.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

/** Join a path onto the canonical origin, avoiding double slashes. */
export function absoluteUrl(path: string): string {
  return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
