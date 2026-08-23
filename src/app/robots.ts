import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt, generated so it can reference the sitemap at the correct
 * absolute origin per environment.
 *
 * The catalog is open (see PROTECTED_PREFIXES in proxy.ts), so every hub,
 * category and detail page is crawlable and every one of them is listed in
 * sitemap.ts. This file only names the paths that cannot rank.
 *
 * What stays disallowed, and why:
 *
 *   /api/                JSON, not documents.
 *   /account, /login,    User-specific or empty. Nothing to index, and an
 *   /signup, /forgot-,   indexed login page competes with the page the
 *   /reset-password      visitor actually wanted.
 *   /playground          Needs a session; a crawler gets a redirect.
 *   /embed/              Same markup and CSS as the effect pages with none
 *                        of the surrounding copy, so indexing them would
 *                        compete with the page that should rank. They are
 *                        meant to load inside someone else's <iframe>.
 *
 * There is no Googlebot exemption anywhere in this codebase, and there is
 * no longer anything to exempt it from: crawlers and humans now get the
 * same pages, which is the only version of this that is not cloaking.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/embed/',
          // Keep in sync with PROTECTED_PREFIXES in proxy.ts.
          '/playground',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
