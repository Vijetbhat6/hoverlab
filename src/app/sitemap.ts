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
import { addedAt } from '@/lib/recency'

/**
 * XML sitemap covering every indexable URL.
 *
 * The catalog's whole SEO value is long-tail: nobody searches "Hoverlab",
 * they search "css shimmer skeleton loader" or "react pricing section with
 * toggle". That traffic only exists if each detail page is discoverable, so
 * every one of them is listed here.
 *
 * This file was trimmed to ~25 URLs while the catalog sat behind a login,
 * for a good reason — a sitemap full of URLs that 307 to /login is a
 * quality signal against the whole domain. The gate is gone (see proxy.ts),
 * so the reason is gone with it and the full set is back. The invariant
 * that trimming honoured still holds: this file lists only what an
 * anonymous visitor can actually load. If a route ever goes back behind
 * auth, it comes out of here in the same commit.
 *
 * `lastModified` comes from the git-derived recency ledger for artifacts
 * that have an entry, not from `new Date()`. A build timestamp tells a
 * crawler that every page on the site changed at once, every deploy, which
 * teaches it to stop believing the field. Marketing routes have no ledger
 * entry and still use build time — for a handful of URLs that is a hint
 * rather than a claim.
 *
 * Entries are emitted small-tier-first so the hand-authored URLs sit ahead
 * of the generated ones. Crawlers do not promise to honour document order,
 * but where they use it as a hint, it points at the pages with the most
 * work behind them.
 *
 * Served at /sitemap.xml and referenced from robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Marketing, hub and reference routes. /account, /login, /signup and
  // /playground are deliberately absent: the first three have nothing to
  // index and the fourth needs a session.
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
    // Guided paths — "how to build a landing page" is a head term, and
    // these are the pages that actually answer it.
    { url: absoluteUrl('/paths'), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...PATHS.map((path) => ({
      url: absoluteUrl(`/paths/${path.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Docs. Indexable on purpose: "hoverlab cli", "install tailwind block"
    // are navigational queries people actually type.
    { url: absoluteUrl('/docs'), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...['cli', 'api', 'mcp'].map((slug) => ({
      url: absoluteUrl(`/docs/${slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Commerce and legal. /pricing is the URL people type and paste before
    // buying; /licence is what Pro actually sells, so it has to be readable
    // before purchase; the three policy pages are what a payment processor
    // and the GDPR both require to exist at a stable URL.
    { url: absoluteUrl('/pricing'), changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: absoluteUrl('/licence'), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: absoluteUrl('/refunds'), changeFrequency: 'yearly' as const, priority: 0.3 },
    // The design-to-code story, written for designers rather than for
    // developers, and the only page that says the catalog is still growing.
    { url: absoluteUrl('/figma'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: absoluteUrl('/changelog'), changeFrequency: 'weekly' as const, priority: 0.7 },
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

  // Detail pages. These read from the *index* modules rather than the
  // catalogs: the sitemap needs ids and a featured flag, and importing
  // `templates.ts` here would assemble every project's files on every
  // build of this route only to throw all of them away.
  //
  // Templates rank highest of the three tiers above effects: there are a
  // handful of them, they are the deepest pages on the site, and they are
  // what a "nextjs saas starter" search is actually looking for.
  const templateRoutes: MetadataRoute.Sitemap = TEMPLATE_INDEX.map((template) => ({
    url: absoluteUrl(`/template/${template.id}`),
    lastModified: addedAt('template', template.id) ?? now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const pageRoutes: MetadataRoute.Sitemap = PAGE_INDEX.map((page) => ({
    url: absoluteUrl(`/page/${page.id}`),
    lastModified: addedAt('page', page.id) ?? now,
    changeFrequency: 'monthly',
    priority: page.featured ? 0.8 : 0.7,
  }))

  const blockRoutes: MetadataRoute.Sitemap = BLOCK_INDEX.map((block) => ({
    url: absoluteUrl(`/block/${block.id}`),
    lastModified: addedAt('block', block.id) ?? now,
    changeFrequency: 'monthly',
    priority: block.featured ? 0.8 : 0.7,
  }))

  // Every effect detail page — the long tail, and the bulk of the sitemap.
  // Curated (featured) effects rank slightly higher so crawl budget favours
  // the hand-written ones.
  const effectRoutes: MetadataRoute.Sitemap = EFFECTS.map((effect) => ({
    url: absoluteUrl(`/effect/${effect.id}`),
    lastModified: addedAt('effect', effect.id) ?? now,
    changeFrequency: 'monthly',
    priority: effect.featured ? 0.9 : 0.6,
  }))

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...blockCategoryRoutes,
    ...templateRoutes,
    ...pageRoutes,
    ...blockRoutes,
    ...effectRoutes,
  ]
}
