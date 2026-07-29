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
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account', '/login', '/signup'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
