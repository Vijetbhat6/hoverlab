import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt, generated so it can reference the sitemap at the correct
 * absolute origin per environment.
 *
 * This replaces the previous static public/robots.txt, which allowed
 * everything but pointed at no sitemap — leaving crawlers to find 1,600+
 * effect pages by traversal alone, from a client-rendered grid behind
 * auth. They never did.
 *
 * Auth and API routes are disallowed: they're either user-specific or
 * JSON, so indexing them wastes crawl budget on pages that can't rank.
 *
 * /embed is disallowed too. Those documents contain the same markup and
 * CSS as the effect pages with none of the surrounding copy, so indexing
 * them would compete with the page that should actually rank. They're
 * meant to be loaded inside someone else's <iframe>, not found in search.
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
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
