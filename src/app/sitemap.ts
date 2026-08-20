import type { MetadataRoute } from 'next'
import { EFFECTS, CATEGORIES } from '@/lib/effects'
import { categorySlug } from '@/lib/effect-types'
import { absoluteUrl } from '@/lib/site'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { BLOCK_INDEX, populatedBlockCategories } from '@/lib/blocks/block-index'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import { PATHS } from '@/lib/paths/catalog'

/**
 * XML sitemap covering every indexable URL.
 *
 * The catalog's whole SEO value is long-tail: nobody searches "Hoverlab",
 * they search "css shimmer skeleton loader" or "glassmorphism card hover".
 * That traffic only exists if each artifact page is discoverable, so every
 * one of them is listed here.
 *
 * This file spent one release listing almost nothing, because the catalog
 * was behind auth and a sitemap full of URLs that 307 to /login is worse
 * than a short one. The gate is gone (see PROTECTED_PREFIXES in proxy.ts)
 * and the enumeration is back with it. The two must move together: if the
 * catalog is ever closed again, trim this file in the same commit rather
 * than leaving it advertising redirects.
 *
 * Category deep-links are included on the same principle — /category/<slug>
 * is a real landing page for head terms like "css button effects", and it
 * links out to every effect under it.
 *
 * The three tiers above effects — blocks, pages, templates — were written
 * for search ("react pricing section", "nextjs saas starter") and are
 * listed the same way.
 *
 * Entries are emitted small-tier-first so the ~200 hand-authored URLs sit
 * ahead of the 835 generated ones. Crawlers do not promise to honor document
 * order, but where they use it as a hint, it points at the pages with the
 * most work behind them.
 *
 * Served at /sitemap.xml and referenced from robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Marketing + tool pages.
  //
  // Absent on purpose: /login, /signup and /account have nothing to index,
  // and /playground is the one catalog-adjacent route still behind auth —
  // listing it would advertise a redirect, which is the mistake this file
  // is being restored from.
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
    // Docs. Indexable on purpose: "hoverlab cli", "install tailwind block"
    // are navigational queries people actually type.
    { url: absoluteUrl('/docs'), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...['cli', 'api', 'mcp', 'dna', 'skills'].map((slug) => ({
      url: absoluteUrl(`/docs/${slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Guided paths — "how to build a landing page" is a head term, and
    // these are the pages that actually answer it.
    { url: absoluteUrl('/paths'), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...PATHS.map((path) => ({
      url: absoluteUrl(`/paths/${path.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // The designer tools are self-contained utilities, not catalog
    // artifacts. Derived from the registry rather than a second list: a
    // hand-kept copy here is how the sitemap once carried a redirecting
    // /tools/fonts and missed new tools.
    { url: absoluteUrl('/tools'), changeFrequency: 'monthly' as const, priority: 0.9 },
    ...DESIGNER_TOOLS.map((tool) => ({
      url: absoluteUrl(tool.href),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
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
  // taxonomy and runs ahead of what is built, so listing all of them would
  // hand a crawler empty pages and teach it that this site has thin ones.
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

  // Templates rank highest of the three: there are only seven, they are
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
