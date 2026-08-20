import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt, generated so it can reference the sitemap at the correct
 * absolute origin per environment.
 *
 * The catalog is open (see PROTECTED_PREFIXES in proxy.ts), so nothing
 * under it is disallowed here any more. This file previously blocked every
 * catalog path because every one of them 307'd to /login; both halves of
 * that arrangement are gone.
 *
 * There is no Googlebot exemption anywhere in this codebase on purpose:
 * serving crawlers content that humans are bounced away from is cloaking.
 * With the catalog open the question no longer arises — crawler and human
 * get the same page.
 *
 * What stays disallowed:
 *  - /api/ — JSON, can't rank.
 *  - Auth and account routes — user-specific or empty.
 *  - /playground — still behind auth, so a crawler would only find a
 *    redirect. Keep this in step with PROTECTED_PREFIXES.
 *  - /embed/ — those documents contain the same markup and CSS as the
 *    effect pages with none of the surrounding copy, so indexing them
 *    would compete with the page that should actually rank. They're meant
 *    to be loaded inside someone else's <iframe>, not found in search.
 *
 * Everything else crawlable is what sitemap.ts enumerates.
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
          // Still auth-gated. Keep in sync with PROTECTED_PREFIXES.
          '/playground',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
