import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt, generated so it can reference the sitemap at the correct
 * absolute origin per environment.
 *
 * The catalog is behind auth (see PROTECTED_PREFIXES in proxy.ts), so every
 * catalog path is disallowed here. A crawler that requests one gets a 307
 * to /login and nothing indexable, and letting it discover that ~4,300
 * times over is pure waste — worse, a domain whose crawled pages are mostly
 * redirects to a login screen looks thin. Saying so up front in robots.txt
 * is the honest version of what the gate already enforces.
 *
 * There is no Googlebot exemption anywhere in this codebase on purpose:
 * serving crawlers content that humans are bounced away from is cloaking.
 *
 * Auth and API routes are disallowed for the older reason: they're either
 * user-specific or JSON, so indexing them can't rank.
 *
 * /embed is disallowed too. Those documents contain the same markup and
 * CSS as the effect pages with none of the surrounding copy, so indexing
 * them would compete with the page that should actually rank. They're
 * meant to be loaded inside someone else's <iframe>, not found in search.
 *
 * What's left crawlable — the landing page, /docs and /tools — is exactly
 * what sitemap.ts lists.
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
          // Auth-gated catalog. Keep in sync with PROTECTED_PREFIXES.
          '/library',
          '/browse',
          '/category',
          '/blocks',
          '/pages',
          '/templates',
          '/paths',
          '/effect',
          '/block',
          '/page',
          '/template',
          '/playground',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
