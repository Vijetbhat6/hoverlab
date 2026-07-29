/**
 * Canonical site URL, shared by the root metadata, the sitemap, and robots.
 *
 * Set NEXT_PUBLIC_SITE_URL to the production domain. On Vercel the
 * VERCEL_URL fallback keeps preview deployments self-consistent, and the
 * localhost fallback keeps local dev working. Without an absolute base,
 * Next.js resolves OG images and sitemap entries against localhost, which
 * silently breaks every share card and every indexed URL in production.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

/** Join a path onto the canonical origin, avoiding double slashes. */
export function absoluteUrl(path: string): string {
  return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
