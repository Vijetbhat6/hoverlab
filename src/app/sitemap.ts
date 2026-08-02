import type { MetadataRoute } from 'next'
import { EFFECTS, CATEGORIES } from '@/lib/effects'
import { categorySlug } from '@/lib/effect-types'
import { absoluteUrl } from '@/lib/site'

/**
 * XML sitemap covering every indexable URL.
 *
 * The catalog's whole SEO value is long-tail: nobody searches "Hoverlab",
 * they search "css shimmer skeleton loader" or "glassmorphism card hover".
 * That traffic only exists if each of the 1,600+ effect pages is
 * discoverable, so every one of them is listed here — previously nothing
 * was, and the only entry point was a client-rendered grid behind auth,
 * which crawlers can't traverse.
 *
 * Category deep-links are included too: /library?filter=Buttons is a real
 * landing page for head terms like "css button effects", and it links out
 * to every effect in that category.
 *
 * Served at /sitemap.xml and referenced from robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Marketing + tool pages. Auth-gated routes (/account, /login, /signup)
  // are deliberately absent — they have nothing to index.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly' as const, priority: 1 },
    { url: absoluteUrl('/library'), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: absoluteUrl('/category'), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: absoluteUrl('/playground'), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: absoluteUrl('/tools'), changeFrequency: 'monthly' as const, priority: 0.8 },
    ...[
      'palette',
      'gradient',
      'shadow',
      'contrast',
      'units',
      'typography',
      'border-radius',
      'easing',
      'glassmorphism',
    ].map((slug) => ({
      url: absoluteUrl(`/tools/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ].map((entry) => ({ ...entry, lastModified: now }))

  // Category landing pages — head terms ("css loaders", "css card hover").
  //
  // These point at /category/<slug>, not /library?filter=<name>. The
  // library is a client-rendered grid behind a query string: a crawler
  // gets an empty shell, and query-string URLs make weak canonicals. The
  // hub pages are static HTML with real previews and editorial copy, so
  // they're what should be indexed for these terms.
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: absoluteUrl(`/category/${categorySlug(category)}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Every effect detail page — the long tail, and the bulk of the sitemap.
  // Curated (featured) effects rank slightly higher so crawl budget favors
  // the hand-written ones.
  const effectRoutes: MetadataRoute.Sitemap = EFFECTS.map((effect) => ({
    url: absoluteUrl(`/effect/${effect.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: effect.featured ? 0.9 : 0.6,
  }))

  return [...staticRoutes, ...categoryRoutes, ...effectRoutes]
}
