import { TOTAL_COUNT, FEATURED_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import { PATHS } from '@/lib/paths/catalog'
import { KITS } from '@/lib/kits/catalog'
import { CATALOG_UPDATED_AT } from '@/lib/recency'
import { absoluteUrl } from '@/lib/site'


/**
 * The body of /llms.txt — the llmstxt.org discovery document.
 *
 * The convention is a single markdown file at the site root that tells a
 * language model what a site is and where its machine-readable surfaces
 * are, so the model does not have to infer either from rendered HTML. It
 * is the agent-facing counterpart to robots.txt and sitemap.xml, and this
 * site is the wrong one to be missing it: the whole distribution bet here
 * is that agents install from the CLI, the MCP server and the registry
 * rather than that humans browse a grid.
 *
 * WHAT THIS FILE IS FOR, AND WHAT IT IS NOT
 *
 * It is a map, not the territory. An agent that reads it should come away
 * knowing three things it cannot get from any single page:
 *
 *   1. Installing does not require the website. `npx hoverlab add <id>`
 *      and the MCP server both resolve an id against every tier, so an
 *      agent never has to guess which tier a name belongs to.
 *   2. Where the enumerable surfaces are — /registry.json and /api/v1 —
 *      because listing 1,000+ artifacts inline would be a worse version
 *      of two endpoints that already page and search properly.
 *   3. What the four tiers mean. "Effect", "block", "page" and "template"
 *      are a ladder, and an agent that picks the wrong rung installs 40
 *      lines of CSS when it wanted a whole route.
 *
 * There is deliberately no /llms-full.txt. That variant is meant to inline
 * a site's full prose so a model needs no further fetches; here the
 * "content" is 1,000+ artifacts of source code, and the honest full dump
 * is /registry.json (metadata) plus /api/v1/artifacts/{id} (source). A
 * multi-megabyte text file that goes stale between deploys would be a
 * worse answer to the same question.
 *
 * COUNTS ARE COMPUTED, NEVER TYPED
 *
 * Every number below is derived from the catalog modules at request time.
 * Hand-typed counts in this repo have a long history of surviving several
 * waves past the moment they stopped being true, and a wrong count in the
 * one file agents read first would propagate into their answers about us.
 * The same rule is why `check:counts` exists.
 *
 * URLS ARE ABSOLUTE
 *
 * `absoluteUrl` rather than site-relative paths: this file is read by
 * clients that fetched it out of band and have no base to resolve against.
 * It follows NEXT_PUBLIC_SITE_URL, so it names the production domain the
 * day that variable does.
 */

/** One markdown link line in an llms.txt section. */
function link(name: string, path: string, note: string): string {
  return `- [${name}](${absoluteUrl(path)}): ${note}`
}

export function buildLlmsTxt(): string {
  const templateCount = TEMPLATE_INDEX.length
  const total = TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + templateCount

  return `# Hoverlab

> ${total.toLocaleString('en-US')} installable UI artifacts on four rungs — ${TOTAL_COUNT.toLocaleString('en-US')} CSS effects, ${BLOCK_COUNT} React blocks, ${PAGE_COUNT} full page routes and ${templateCount} scaffoldable project templates. Everything installs from the terminal or an editor agent without an account, an API key, or a visit to the website.

Hoverlab is a catalog built for agents first. The same id resolves across
every tier, so \`npx hoverlab add pricing-tiers\` works whether the caller
knows it is asking for a block or not. Blocks and pages are Tailwind +
React source you own after install; effects are plain CSS with no runtime.

Pick the rung before you pick the artifact:

- **effect** — one CSS animation or interaction (a gradient button, a
  shimmer skeleton). No JavaScript, no dependencies. ${TOTAL_COUNT.toLocaleString('en-US')} of them, ${FEATURED_COUNT} curated.
- **block** — one React section (a pricing table, a FAQ accordion).
  Tailwind classes only, ships as source into your repo. ${BLOCK_COUNT} of them.
- **page** — a complete route composed of blocks (a checkout page, a
  dashboard). ${PAGE_COUNT} of them.
- **template** — a multi-file project you scaffold into an empty
  directory. ${templateCount} of them.

Catalog last updated ${CATALOG_UPDATED_AT}.

## Install without the website

${link('CLI reference', '/docs/cli', '`npx hoverlab add <id>` installs any artifact on any rung. Also `search`, `show`, `init`, `outdated`, `diff` and `update`')}
${link('MCP server', '/docs/mcp', 'The CLI doubles as an MCP server: `claude mcp add hoverlab -- npx -y hoverlab mcp`. Gives an editor agent search and install as tools')}
${link('Agent skills', '/docs/skills', 'Packaged skill files that teach an agent this catalog\'s conventions')}
${link('shadcn registry', '/registry.json', 'Registry index under the `@hoverlab` namespace. Supports shadcn dynamic search: `?q=hero`, `&type=`, `&limit=`, `&offset=`. Bare URL returns the complete index')}
${link('Registry docs', '/docs/registry', 'How to wire `@hoverlab` into components.json and install with the shadcn CLI')}

## Machine-readable endpoints

${link('REST API', '/docs/api', 'Public, unauthenticated, CORS-open. No key')}
${link('Artifact resolver', '/api/v1/artifacts/hero-split', 'Resolves one id against all four tiers and returns its source. The endpoint to use when you do not know the rung')}
${link('Effects', '/api/v1/effects', 'Search and page the effect catalog: `?q=`, `?category=`, `?featured=`, `?limit=`, `?offset=`')}
${link('Blocks', '/api/v1/blocks', 'Same parameters, block catalog')}
${link('Pages', '/api/v1/pages', 'Same parameters, page catalog')}
${link('Templates', '/api/v1/templates', 'Same parameters, template catalog')}
${link('Design DNA', '/api/v1/dna/hero-split', 'The design tokens behind one artifact — spacing, colour roles, type scale')}
${link('Trending', '/api/v1/trending', 'What is being installed most right now')}
${link('Changelog feed', '/feed.xml', 'Atom feed, one entry per shipping wave. What to poll instead of re-crawling')}
${link('Sitemap', '/sitemap.xml', 'Every indexable URL')}

## Browse surfaces (for humans, and for grounding a link)

${link('Browse everything', '/browse', 'All four tiers in one filterable surface')}
${link('Effects library', '/library', 'The effect catalog with live previews')}
${link('Blocks', '/blocks', 'React section components by category')}
${link('Pages', '/pages', 'Full route compositions')}
${link('Templates', '/templates', 'Scaffoldable projects')}
${link('Categories', '/category', 'The effect taxonomy')}

## Guided paths

Task-shaped routes through the catalog — each names the exact artifacts to
install, in order, to build one thing.

${PATHS.map((p) => link(p.title, `/paths/${p.slug}`, `${p.tagline} ${p.duration}`)).join('\n')}

## Kits

Pre-assembled bundles that install as a set.

${KITS.map((k) => link(k.name, `/kits/${k.slug}`, k.tagline)).join('\n')}

## Optional

${link('Pricing', '/pricing', 'Everything installs free. Pro sells a commercial licence, not access')}
${link('Compare', '/compare', 'How this catalog differs from the alternatives, including where they win')}
${link('Changelog', '/changelog', 'Human-readable shipping history')}
${link('Design system', '/design-system', 'The tokens and primitives every artifact is built on')}
${link('Frameworks', '/frameworks', 'Which frameworks each tier can be emitted for')}
${link('Accessibility', '/accessibility', 'Per-artifact accessibility evidence, including what fails')}
${link('Licence', '/licence', 'MIT for the code you install')}
`
}

