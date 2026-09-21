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
 * There is no fallback here. The site used to run on Vercel and inherit
 * VERCEL_PROJECT_PRODUCTION_URL. On Netlify, next.config.ts bridges Netlify's
 * own `URL` into this variable at build time, so nothing needs setting; on any
 * other host (Firebase App Hosting: apphosting.yaml) it has to be set
 * explicitly. NEXT_PUBLIC_ values are inlined at BUILD time, so setting it
 * only on a running server does nothing. `npm run check:env` reports it as
 * required in production.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Join a path onto the canonical origin, avoiding double slashes. */
export function absoluteUrl(path: string): string {
  return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
