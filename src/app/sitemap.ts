import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'

/**
 * XML sitemap covering every indexable URL.
 *
 * That set is now small. The catalog — every effect, block, page, template,
 * their category hubs and the playground — requires a session, so an
 * anonymous crawler gets a 307 to /login on all of them (see the
 * PROTECTED_PREFIXES list in proxy.ts). Listing them here anyway would be
 * worse than listing nothing: a sitemap full of URLs that redirect to a
 * login page is a quality signal against the whole domain, and it burns
 * crawl budget re-discovering the same redirect ~4,300 times.
 *
 * So this file deliberately no longer enumerates the catalog. It is not an
 * oversight and it should not be "fixed" by adding EFFECTS/BLOCK_INDEX back
 * — the gate has to come down first. What remains is what a signed-out
 * visitor can actually load: the landing page, the docs (which sell the CLI
 * to people who don't have an account yet) and the standalone tools.
 *
 * Served at /sitemap.xml and referenced from robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Auth-gated routes (/library, /browse, /effect/*, /blocks, /block/*,
  // /pages, /page/*, /templates, /template/*, /category/*, /paths,
  // /playground, /account) are absent on purpose — see above. /login and
  // /signup are absent because they have nothing to index.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly' as const, priority: 1 },
    // Docs. Indexable on purpose: "hoverlab cli", "install tailwind block"
    // are navigational queries people actually type, and the docs describe
    // the product to visitors who cannot see the catalog yet.
    { url: absoluteUrl('/docs'), changeFrequency: 'weekly' as const, priority: 0.9 },
    ...['cli', 'api', 'mcp'].map((slug) => ({
      url: absoluteUrl(`/docs/${slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // The designer tools are self-contained utilities, not catalog
    // artifacts, so they stay open and stay indexed. With the catalog
    // gated they are the only organic entry point left. Derived from the
    // registry rather than a second list: a hand-kept copy here is how the
    // sitemap once carried a redirecting /tools/fonts and missed new tools.
    { url: absoluteUrl('/tools'), changeFrequency: 'monthly' as const, priority: 0.9 },
    ...DESIGNER_TOOLS.map((tool) => ({
      url: absoluteUrl(tool.href),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ].map((entry) => ({ ...entry, lastModified: now }))

  return staticRoutes
}
