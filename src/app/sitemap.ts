import type { MetadataRoute } from 'next'
import { EFFECTS, CATEGORIES } from '@/lib/effects'
import { categorySlug } from '@/lib/effect-types'
import { absoluteUrl } from '@/lib/site'
import { BLOCK_INDEX, populatedBlockCategories } from '@/lib/blocks/block-index'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'

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
 * The three tiers above effects — blocks, pages, templates — are listed on
 * the same principle. They were written for search ("react pricing section",
 * "nextjs saas starter") and were invisible to it while this file knew only
 * about /effect: no hub, no category and no detail URL among them appeared
 * here, which made every one of those pages unreachable except by a visitor
 * who was already on the site.
 *
 * Entries are emitted small-tier-first so the ~500 hand-authored URLs sit
 * ahead of the 4,300 generated ones. Crawlers do not promise to honor
 * document order, but where they use it as a hint, it points at the pages
 * with the most work behind them.
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
    // The unified surface. Only the bare URL — `?level=` and `?category=`
    // are filters that canonicalize back to this, not separate documents.
    { url: absoluteUrl('/browse'), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: absoluteUrl('/category'), changeFrequency: 'weekly' as const, priority: 0.9 },
    // The three tiers above effects. Each is a static, server-rendered hub
    // with real links out to its catalog, so a crawler that lands on one
    // can reach every artifact under it.
    { url: absoluteUrl('/blocks'), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: absoluteUrl('/pages'), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: absoluteUrl('/templates'), changeFrequency: 'weekly' as const, priority: 0.9 },
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

  // Block category hubs — "react pricing section", "tailwind faq section".
  //
  // Only populated categories. `BLOCK_CATEGORIES` describes the finished
  // taxonomy and runs ahead of what is built, so listing all 28 would hand
  // a crawler seven empty pages and teach it that this site has thin ones.
  const blockCategoryRoutes: MetadataRoute.Sitemap = populatedBlockCategories().map(
    (category) => ({
      url: absoluteUrl(`/blocks/${blockCategorySlug(category)}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  )

  // Detail pages for the upper three tiers. These read from the *index*
  // modules rather than the catalogs: the sitemap needs ids and a featured
  // flag, and importing `templates.ts` here would assemble every project's
  // files on every build of this route to throw all of them away.
  const blockRoutes: MetadataRoute.Sitemap = BLOCK_INDEX.map((block) => ({
    url: absoluteUrl(`/block/${block.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: block.featured ? 0.8 : 0.7,
  }))

  const pageRoutes: MetadataRoute.Sitemap = PAGE_INDEX.map((page) => ({
    url: absoluteUrl(`/page/${page.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: page.featured ? 0.8 : 0.7,
  }))

  // Templates rank highest of the three: there are ~20 of them, they are
  // the deepest pages on the site, and they are what a "nextjs saas
  // starter" search is actually looking for.
  const templateRoutes: MetadataRoute.Sitemap = TEMPLATE_INDEX.map((template) => ({
    url: absoluteUrl(`/template/${template.id}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...blockCategoryRoutes,
    ...blockRoutes,
    ...pageRoutes,
    ...templateRoutes,
    ...effectRoutes,
  ]
}
