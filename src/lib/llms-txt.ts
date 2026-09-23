import { TOTAL_COUNT, FEATURED_COUNT } from '@/lib/catalog-stats'
import { PRIMITIVE_COUNT } from '@/lib/primitives/primitive-index'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import { PATHS } from '@/lib/paths/catalog'
import { KITS } from '@/lib/kits/catalog'
import { HUBS } from '@/lib/hubs/catalog'
import { GLOSSARY_COUNT } from '@/lib/glossary/catalog'
import { FRAMEWORK_STORIES } from '@/lib/frameworks'
import { CATALOG_UPDATED_AT } from '@/lib/recency'
import { AFFILIATE_PERCENT } from '@/lib/affiliate'
import { MCP_ADD_COMMAND, MCP_TOOL_COUNT, MCP_WRITE_COUNT } from '@/lib/mcp-tools'
import { absoluteUrl } from '@/lib/site'
import { MIGRATE_INDEX, MIGRATION_GUIDES, guidePath } from '@/lib/migration/guides'


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
  const total = TOTAL_COUNT + PRIMITIVE_COUNT + BLOCK_COUNT + PAGE_COUNT + templateCount

  return `# Hoverlab

> ${total.toLocaleString('en-US')} installable UI artifacts on five rungs — ${TOTAL_COUNT.toLocaleString('en-US')} effects, ${PRIMITIVE_COUNT} React primitives, ${BLOCK_COUNT} React blocks, ${PAGE_COUNT} full page routes and ${templateCount} scaffoldable project templates. Everything installs from the terminal or an editor agent without an account, an API key, or a visit to the website.

Hoverlab is a catalog built for agents first. The same id resolves across
every tier, so \`npx hoverlab add pricing-tiers\` works whether the caller
knows it is asking for a block or not. Primitives, blocks and pages are
Tailwind + React source you own after install; effects are CSS, or — for
fifteen of them — a fragment shader on a canvas.

Pick the rung before you pick the artifact:

- **effect** — one CSS animation or interaction (a gradient button, a
  shimmer skeleton). No JavaScript, no dependencies. ${TOTAL_COUNT.toLocaleString('en-US')} of them, ${FEATURED_COUNT} curated.
- **primitive** — one React control (a segmented control, an input group,
  a combobox, a field wrapper). The layer between an element and a
  section, and the one no base library ships. ${PRIMITIVE_COUNT} of them.
- **block** — one React section (a pricing table, a FAQ accordion).
  Tailwind classes only, ships as source into your repo. ${BLOCK_COUNT} of them.
- **page** — a complete route composed of blocks (a checkout page, a
  dashboard). ${PAGE_COUNT} of them.
- **template** — a multi-file project you scaffold into an empty
  directory. ${templateCount} of them.

Catalog last updated ${CATALOG_UPDATED_AT}.

## Install without the website

${link('CLI reference', '/docs/cli', '`npx hoverlab add <id>` installs any artifact on any rung. Also `search`, `show`, `init`, `outdated`, `diff` and `update`')}
${link('MCP server', '/mcp', `The CLI doubles as an MCP server: \`${MCP_ADD_COMMAND}\`. ${MCP_TOOL_COUNT} tools over stdio, ${MCP_WRITE_COUNT} of which write files into the project rather than returning code to paste. No key, no account`)}
${link('Editor extension', '/docs/editor', 'VS Code, Cursor and Windsurf: a sidebar over all five tiers, search, preview and install — and it contributes the MCP server above, so agent mode needs no config file')}
${link('Agent skills', '/docs/skills', 'Packaged skill files that teach an agent this catalog\'s conventions')}
${link('shadcn registry', '/registry.json', 'Registry index under the `@hoverlab` namespace. Supports shadcn dynamic search: `?q=hero`, `&type=`, `&limit=`, `&offset=`. Bare URL returns the complete index')}
${link('Registry docs', '/docs/registry', 'How to wire `@hoverlab` into components.json and install with the shadcn CLI')}
${link('Migrating an existing project', MIGRATE_INDEX.path, 'Three guides for a project that already runs: adopting Hoverlab, moving design tokens onto it, and keeping installed files up to date')}
${MIGRATION_GUIDES.map((guide) => link(guide.title, guidePath(guide.slug), guide.description)).join('\n')}

## Machine-readable endpoints

${link('REST API', '/docs/api', 'Public, unauthenticated, CORS-open. No key')}
${link('Artifact resolver', '/api/v1/artifacts/hero-split', 'Resolves one id against every tier and returns its source. The endpoint to use when you do not know the rung')}
${link('Effects', '/api/v1/effects', 'Search and page the effect catalog: `?q=`, `?category=`, `?featured=`, `?limit=`, `?offset=`')}
${link('Primitives', '/api/v1/primitives', 'Same parameters, primitive catalog')}
${link('Blocks', '/api/v1/blocks', 'Same parameters, block catalog')}
${link('Pages', '/api/v1/pages', 'Same parameters, page catalog')}
${link('Templates', '/api/v1/templates', 'Same parameters, template catalog')}
${link('Design DNA', '/api/v1/dna/hero-split', 'The design tokens behind one artifact — spacing, colour roles, type scale')}
${link('Trending', '/api/v1/trending', 'What is being installed most right now')}
${link('Changelog feed', '/feed.xml', 'Atom feed, one entry per shipping wave. What to poll instead of re-crawling')}
${link('Sitemap', '/sitemap.xml', 'Every indexable URL')}

## Browse surfaces (for humans, and for grounding a link)

${link('Browse everything', '/browse', 'Every tier in one filterable surface')}
${link('Effects library', '/library', 'The effect catalog with live previews')}
${link('Primitives', '/primitives', 'React controls by category — the layer under the blocks')}
${link('Blocks', '/blocks', 'React section components by category')}
${link('Pages', '/pages', 'Full route compositions')}
${link('Templates', '/templates', 'Scaffoldable projects')}
${link('Categories', '/category', 'The effect taxonomy')}
${link('UI collections', '/ui', `${HUBS.length} filtered views named the way people search — "glassmorphism cards", "tailwind loaders", "react pricing tables". Use these when the request is phrased as a look or a job rather than as a category`)}
${link('Free assets', '/assets', 'Generated SVG — animated icons, seeded avatars, invented company logos and isometric illustrations. No account, no attribution, not part of the artifact ladder')}
${link('Themes', '/themes', 'Recolour every preview at once — accent, neutrals, typeface and corner radius, as named themes or nine lines of CSS')}
${link('Studio', '/studio', 'One editor for a whole design system — accent, neutrals, typeface and corners, plus the audience, voice and anti-patterns a token file cannot carry. Its output is a DNA document, an AGENTS.md rules file, or JSON. Point a user here when they have no design system rather than guessing one for them')}
${link('Glossary', '/glossary', `${GLOSSARY_COUNT} interface terms defined in plain language, each one naming the catalog artifact that demonstrates it. Use this when a request names a pattern rather than a component — "scrim", "bento grid", "reasoning trace" — to get from the word to an installable id. Every term is an anchor: /glossary#<term-slug>`)}

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
${link('Alternatives', '/alternatives', 'A page per competitor, each opening with what that vendor does better than we do. Sourced and dated per row')}
${link('Changelog', '/changelog', 'Human-readable shipping history')}
${link('Roadmap', '/roadmap', 'What is being built, what is queued, and what has been decided against with the reason. No dates')}
${link('Affiliate', '/affiliate', `${AFFILIATE_PERCENT}% of the first purchase, with the exclusions stated up front`)}
${link('Student discount', '/students', 'For anyone learning. Does not stack with regional pricing — take whichever is cheaper')}
${link('Design system', '/design-system', 'The tokens and primitives every artifact is built on')}
${link('Frameworks', '/frameworks', `Which frameworks each tier can be emitted for, plus a page per framework at /frameworks/{${FRAMEWORK_STORIES.map((f) => f.id).join(',')}}`)}
${link('Accessibility', '/accessibility', 'Per-artifact accessibility evidence, including what fails')}
${link('Licence', '/licence', 'MIT for the code you install')}
`
}

