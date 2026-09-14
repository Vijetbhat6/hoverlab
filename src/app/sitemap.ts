import type { MetadataRoute } from 'next'
import { EFFECTS, CATEGORIES } from '@/lib/effects'
import { categorySlug } from '@/lib/effect-types'
import { absoluteUrl } from '@/lib/site'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { CURATED_PERMALINK_HREFS } from '@/lib/tools/permalinks'
import { ASSET_FAMILIES } from '@/lib/assets/asset-types'
import {
  PRIMITIVE_INDEX,
  populatedPrimitiveCategories,
} from '@/lib/primitives/primitive-index'
import { primitiveCategorySlug } from '@/lib/primitives/primitive-types'
import { BLOCK_INDEX, populatedBlockCategories } from '@/lib/blocks/block-index'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import { PATHS } from '@/lib/paths/catalog'
import { KITS } from '@/lib/kits/catalog'
import { HUBS } from '@/lib/hubs/catalog'
import { FRAMEWORK_STORIES } from '@/lib/frameworks'
import { addedAt } from '@/lib/recency'
import { COMPETITORS } from '@/lib/compare'

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
    // The four tiers above effects. Each is a static, server-rendered hub
    // with real links out to its catalog, so a crawler that lands on one
    // can reach every artifact under it.
    { url: absoluteUrl('/primitives'), changeFrequency: 'weekly' as const, priority: 0.9 },
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
    // The glossary. One URL rather than sixty: every term is an anchor on
    // this page, and sixty two-paragraph documents would be exactly the thin
    // set of near-duplicate pages the hubs are checked against. Monthly —
    // the terms change when the catalog grows a family, which is rare.
    { url: absoluteUrl('/glossary'), changeFrequency: 'monthly' as const, priority: 0.8 },
    // Kits — the cross-rung sets. "react ui kit", "saas starter kit" and
    // "ecommerce ui kit" are the category's head terms, and until these
    // pages existed the site had nothing shaped like an answer to them:
    // every hub was one rung, and a kit is the whole job.
    { url: absoluteUrl('/kits'), changeFrequency: 'weekly' as const, priority: 0.8 },
    // "shadcn theme", "tailwind theme generator" and "design tokens" are
    // head terms this site had nothing shaped like an answer to, despite
    // having carried the tokens for a year. Monthly rather than weekly: the
    // page changes when a preset is added, which is rare on purpose.
    { url: absoluteUrl('/themes'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: absoluteUrl('/studio'), changeFrequency: 'monthly' as const, priority: 0.9 },
    ...KITS.map((kit) => ({
      url: absoluteUrl(`/kits/${kit.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    /*
     * Intent hubs. The phrases people actually type — "glassmorphism
     * cards", "tailwind loaders", "react pricing tables" — each a filtered
     * view over the same catalog with its own editorial copy.
     *
     * These sit at the same priority as the category hubs and above the
     * individual artifacts, because they are the pages written *for* these
     * queries: /category/glow-neon is our taxonomy, /ui/neon-glow-effects
     * is the search. Weekly, since what they contain changes whenever the
     * catalog does — the grid is resolved at build time, not hand-listed.
     *
     * Derived from HUBS rather than typed out, for the reason the designer
     * tools below are: a hand-kept copy is how a sitemap ends up missing
     * the pages added last week.
     */
    { url: absoluteUrl('/ui'), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...HUBS.map((hub) => ({
      url: absoluteUrl(`/ui/${hub.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Docs. Indexable on purpose: "hoverlab cli", "install tailwind block"
    // are navigational queries people actually type.
    { url: absoluteUrl('/docs'), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...['cli', 'editor', 'api', 'registry', 'dna', 'skills'].map((slug) => ({
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
    // Agent access, which used to be /docs/mcp and is now a page of its
    // own. Priority 0.9 rather than the 0.8 the docs pages get: it is the
    // one claim in the catalog no competitor matches, and "mcp server
    // components" is a query with intent behind it rather than a
    // navigational lookup.
    { url: absoluteUrl('/mcp'), changeFrequency: 'weekly' as const, priority: 0.9 },
    // The design-to-code story, written for designers rather than for
    // developers, and the only page that says the catalog is still growing.
    { url: absoluteUrl('/figma'), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: absoluteUrl('/changelog'), changeFrequency: 'weekly' as const, priority: 0.7 },
    // The brand-token editor that repaints the whole catalog. It was
    // missing here for the same reason it was missing from the footer:
    // nothing linked it except three deep links, so nothing found it.
    { url: absoluteUrl('/design-system'), changeFrequency: 'monthly' as const, priority: 0.7 },
    // Written for one segment rather than for search: people who used to
    // sell on a marketplace. It is the first thing here aimed at building
    // the direct traffic that is the only funnel agents cannot re-rank.
    { url: absoluteUrl('/for-authors'), changeFrequency: 'monthly' as const, priority: 0.7 },
    // Unlike /for-authors this one IS written for search: "react bits
    // alternative" and "tailwind plus alternative" are queries a buyer types
    // with a card already out. Monthly, because the prices on it are other
    // people's and they move.
    { url: absoluteUrl('/compare'), changeFrequency: 'monthly' as const, priority: 0.8 },
    // One page per competitor, generated from the same sourced data as
    // /compare. These are the URLs that answer the query people actually
    // type — "react bits alternative" — which no single comparison page can
    // rank for nine times over. Derived from COMPETITORS rather than listed
    // by hand, for the reason the designer tools below are.
    { url: absoluteUrl('/alternatives'), changeFrequency: 'monthly' as const, priority: 0.8 },
    ...COMPETITORS.map((competitor) => ({
      url: absoluteUrl(`/alternatives/${competitor.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // What ships next, publicly. Monthly rather than weekly: a roadmap that
    // changed every week would be telling on itself.
    { url: absoluteUrl('/roadmap'), changeFrequency: 'monthly' as const, priority: 0.7 },
    // The commerce surfaces aimed at a specific person rather than at a
    // query. Both resolve to a real, complete page on any deployment — they
    // explain the terms and say plainly when the door is not yet open,
    // rather than 404ing or rendering a dead button.
    { url: absoluteUrl('/affiliate'), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: absoluteUrl('/students'), changeFrequency: 'monthly' as const, priority: 0.6 },
    /*
     * The three community surfaces, which ship with empty lists on purpose.
     *
     * Listed anyway, and that is a considered exception to this file's own
     * rule about only listing what an anonymous visitor can usefully load.
     * The rule is there to keep thin and dead-ending pages out of the index;
     * each of these renders a complete document that explains what it is
     * for and how to get on it, which is exactly what somebody searching
     * "hoverlab showcase" wants to find. Low priority, because until they
     * have entries they are invitations rather than content.
     */
    { url: absoluteUrl('/showcase'), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: absoluteUrl('/wall'), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: absoluteUrl('/labs'), changeFrequency: 'monthly' as const, priority: 0.5 },
    // The page builder. Indexed bare, with no composition: "landing page
    // builder" and "tailwind page builder" are the queries, and every
    // composition is a query string over this one URL — so there is exactly
    // one page here to submit, and an infinite number of states of it that
    // a crawler has no reason to enumerate.
    { url: absoluteUrl('/builder'), changeFrequency: 'monthly' as const, priority: 0.8 },
    // Written for search in the same way /compare is: "vue tailwind
    // components", "svelte ui components" and "astro components" are
    // queries we ship an answer to and had no page for. Monthly — the
    // support matrix moves when a converter does, which is rarely.
    { url: absoluteUrl('/frameworks'), changeFrequency: 'monthly' as const, priority: 0.8 },
    // One page per framework, and they are submitted at the same priority
    // as the hub rather than below it. The hub ranks for "multi framework
    // component library", which nobody types; these rank for "vue tailwind
    // components" and "svelte ui components", which are the queries. Derived
    // from FRAMEWORK_STORIES so adding a converter cannot leave its page
    // out of the index.
    ...FRAMEWORK_STORIES.map((framework) => ({
      url: absoluteUrl(`/frameworks/${framework.id}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Per-artifact WCAG evidence. Weekly, because the numbers on it move
    // with the catalog — it is regenerated on every build — and because a
    // buyer doing vendor diligence under the EAA wants the current one.
    { url: absoluteUrl('/accessibility'), changeFrequency: 'weekly' as const, priority: 0.7 },
    // Response targets by plan. Low frequency because the commitments are
    // meant to be stable — a support page that changed weekly would be
    // telling on itself — but it belongs in the index because "does this
    // vendor answer email" is a question buyers search before they buy.
    { url: absoluteUrl('/support'), changeFrequency: 'monthly' as const, priority: 0.6 },
    // The designer tools are self-contained utilities, not catalog
    // artifacts. Derived from the registry rather than a second list: a
    // hand-kept copy here is how the sitemap once carried a redirecting
    // /tools/fonts and missed new tools.
    // The free-asset families. The hub and the four family pages only —
    // there is deliberately no per-asset route (2,194 of them would be
    // prerendered for content a browser generates in microseconds), so the
    // selection lives in a query string and the sitemap stops here.
    { url: absoluteUrl('/assets'), changeFrequency: 'monthly' as const, priority: 0.8 },
    ...ASSET_FAMILIES.map((family) => ({
      url: absoluteUrl(`/assets/${family}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: absoluteUrl('/tools'), changeFrequency: 'monthly' as const, priority: 0.9 },
    ...DESIGNER_TOOLS.map((tool) => ({
      url: absoluteUrl(tool.href),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    /*
      Tool permalinks — the curated ones only.

      Six tools now carry their state in a readable query string rather than
      an invisible `#s=` fragment, which makes a tuned palette or a contrast
      pair a real URL. The query space over those parameters is infinite, so
      listing all of it would build a crawl trap rather than a hundred
      ranking pages — thousands of near-identical documents competing with
      each other and with the tool itself.

      So only the hand-picked entries are here: eight to twelve per tool,
      each answering a query somebody actually types ("white on blue
      contrast", "golden ratio type scale", "neumorphic box shadow"), each
      self-canonical, and each linked from its tool page so a crawler that
      arrives has somewhere to go. Every OTHER permalink works identically
      and canonicalises back to the bare tool — the treatment `/browse`
      already gives its filters. The rule is written down once, in
      `lib/tools/tool-page-metadata.ts`.

      Priority 0.6, under the tools' own 0.8: these are answers to narrow
      questions, and the tool is the page that should win the broad one.
    */
    ...CURATED_PERMALINK_HREFS.map((href) => ({
      url: absoluteUrl(href),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
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
  /*
   * Primitive category hubs. "react segmented control" and "tailwind input
   * group" are head terms with no good answer anywhere — every result is a
   * blog post or a library's docs page — so these are the highest-intent
   * category pages on the site despite being the newest.
   */
  const primitiveCategoryRoutes: MetadataRoute.Sitemap =
    populatedPrimitiveCategories().map((category) => ({
      url: absoluteUrl(`/primitives/${primitiveCategorySlug(category)}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  const primitiveRoutes: MetadataRoute.Sitemap = PRIMITIVE_INDEX.map((primitive) => ({
    url: absoluteUrl(`/primitive/${primitive.id}`),
    lastModified: addedAt('primitive', primitive.id) ?? now,
    changeFrequency: 'monthly',
    priority: primitive.featured ? 0.8 : 0.7,
  }))

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
    ...primitiveCategoryRoutes,
    ...blockCategoryRoutes,
    ...templateRoutes,
    ...pageRoutes,
    ...blockRoutes,
    ...primitiveRoutes,
    ...effectRoutes,
  ]
}
