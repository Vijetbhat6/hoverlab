/**
 * Where each designer tool sends you next.
 *
 * ── THE PROBLEM ─────────────────────────────────────────────────────────
 *
 * 37 tools, and on the traffic numbers they are the largest acquisition
 * surface this site has — "css grid generator", "clip path generator",
 * "contrast checker" are searches with real volume that we answer well and
 * for free. They also, until now, led nowhere near the product.
 *
 * `tool-presets.ts` fixed half of it: a free account keeps your presets
 * across machines, which turns an anonymous visitor into a known one. Its
 * own docblock says where the other half was meant to go — *"the ask comes
 * later, from the catalog"* — and that ask was never built. Someone who
 * spent twenty minutes on a gradient had no idea 973 effects existed.
 *
 * ── WHY A PER-TOOL DESTINATION AND NOT A BANNER ─────────────────────────
 *
 * Because "check out our catalog" under a shadow generator is an
 * advertisement, and "the catalog has 40 shadow effects you can install
 * with one command" is a useful next step for the person who just made a
 * shadow. The whole value of this surface is intent: the visitor has told
 * us what they are working on by choosing a tool.
 *
 * So every tool names a real destination — a level and a category that
 * exist in the catalog, or a query that returns something. A tool pointed
 * at a category with nothing in it would be worse than no funnel at all,
 * which is what `check-tool-funnel` in the tests guards.
 *
 * ── WHAT IT MUST NOT BECOME ─────────────────────────────────────────────
 *
 * A gate. Nothing here withholds a tool's output, asks for an email before
 * a copy, or interrupts. It is a section at the bottom of a page that has
 * already done its job for free. `tool-presets.ts` argues this out: a
 * funnel with a gate in it is a wall.
 */

import { CATEGORIES, categorySlug, type EffectCategory } from './effect-types'

export interface ToolFunnel {
  /** Tool route this describes. Must match a `DesignerTool.href`. */
  href: string
  /**
   * The catalog level to send them to.
   *
   * `effect` for the tools that make a visual treatment, `block` for the
   * ones that make a piece of a page.
   */
  level: 'effect' | 'block'
  /**
   * Category within that level, or null to search instead.
   *
   * A category is a browse filter and is much stronger than a query when
   * one fits — it lands on a curated set rather than on whatever the
   * ranker liked.
   *
   * Typed as a plain string rather than `EffectCategory` on purpose: the
   * `block` entries carry no category at all, and a union across two
   * taxonomies would make every entry here need a cast. The guard below is
   * what actually enforces it, at module load, where a typo cannot ship.
   */
  category: string | null
  /** Free-text query, when no category is a good fit. */
  query?: string
  /**
   * The sentence. Written as the next step for the thing they just made,
   * never as a description of the catalog.
   *
   * Ends without a full stop where the link continues the sentence.
   */
  pitch: string
}

/**
 * One entry per tool. Every `category` here is checked against the real
 * taxonomy at module load — see below — because a typo produces a link to
 * an empty browse page and nothing else would catch it.
 *
 * THE SAME TRAP, ONE STEP FURTHER OUT: a `query` is not checked by
 * anything at load, and a query matching nothing is just as dead as a
 * misspelled category — the browse page returns 200 and says "no results".
 * Two of these shipped that way in the first draft. `grid layout` matched
 * nothing because the search is per-term against names and tags rather
 * than a phrase matcher, and `tailwind` matched nothing because every
 * block IS Tailwind, so no description ever says the word. Both were
 * invisible until the queries were run. `tool-funnel.test.ts` runs all of
 * them now; do not add an entry without letting it.
 */
export const TOOL_FUNNELS: readonly ToolFunnel[] = [
  { href: '/tools/grid', level: 'block', category: null, query: 'grid', pitch: 'Skip the layout entirely — the catalog has whole sections already built on grid' },
  { href: '/tools/flexbox', level: 'block', category: null, query: 'layout', pitch: 'Or start a rung up: complete sections with the layout already solved' },
  { href: '/tools/tokens', level: 'effect', category: 'Backgrounds', pitch: 'Your tokens, applied — every effect in the catalog is written against these variables' },
  { href: '/tools/icons', level: 'effect', category: 'Icons & Shapes', pitch: 'Icons that do something: hover, spin, morph' },
  { href: '/tools/motion', level: 'effect', category: 'Micro-interactions', pitch: 'The same easing, already wired into something' },
  { href: '/tools/placeholders', level: 'effect', category: 'Skeletons & Shimmers', pitch: 'Loading states that are not grey rectangles' },
  { href: '/tools/favicon', level: 'block', category: null, query: 'header', pitch: 'The rest of the site chrome, already built' },
  { href: '/tools/meta', level: 'block', category: null, query: 'hero', pitch: 'The page those tags describe — heroes, landings, whole routes' },
  { href: '/tools/email', level: 'block', category: null, query: 'newsletter', pitch: 'The signup section that feeds it' },
  { href: '/tools/palette', level: 'effect', category: 'Backgrounds', pitch: 'Put that palette on something — gradients, meshes, patterns' },
  { href: '/tools/color', level: 'effect', category: 'Glow & Neon', pitch: 'Colour doing work: glows, neon, gradient text' },
  { href: '/tools/gradient', level: 'effect', category: 'Backgrounds', pitch: 'Gradients already animated, masked and layered' },
  { href: '/tools/shadow', level: 'effect', category: 'Cards', pitch: 'Cards that use shadow the way you just tuned it' },
  { href: '/tools/contrast', level: 'effect', category: 'Buttons', pitch: 'Every button in the catalog is checked against the same criteria' },
  { href: '/tools/units', level: 'effect', category: 'Text', pitch: 'Type effects built on a fluid scale' },
  { href: '/tools/typography', level: 'effect', category: 'Text', pitch: 'That scale, in use — headlines, reveals, gradient text' },
  { href: '/tools/spacing', level: 'block', category: null, query: 'section', pitch: 'Sections already spaced on a scale like this one' },
  { href: '/tools/border-radius', level: 'effect', category: 'Borders & Outlines', pitch: 'Borders that animate, glow and gradient' },
  { href: '/tools/clip-path', level: 'effect', category: 'Masks & Clip Paths', pitch: 'The same technique, already animated' },
  { href: '/tools/easing', level: 'effect', category: 'Entrance Animations', pitch: 'Entrances built on curves like this one' },
  { href: '/tools/glassmorphism', level: 'effect', category: 'Cards', pitch: 'Glass cards, panels and overlays you can install' },
  { href: '/tools/noise', level: 'effect', category: 'Patterns & Textures', pitch: 'Textures and patterns as installable CSS' },
  { href: '/tools/keyframes', level: 'effect', category: 'Entrance Animations', pitch: 'Keyframes already attached to something worth animating' },
  { href: '/tools/divider', level: 'effect', category: 'Dividers & Separators', pitch: 'Dividers with motion, gradients and shapes' },
  { href: '/tools/mesh', level: 'effect', category: 'Backgrounds', pitch: 'Mesh and gradient backgrounds, ready to drop in' },
  { href: '/tools/filter', level: 'effect', category: 'Filters & Blend Modes', pitch: 'Filters and blend modes, already composed' },
  { href: '/tools/transform', level: 'effect', category: '3D & Perspective', pitch: '3D and perspective effects built on transforms' },
  { href: '/tools/scrollbar', level: 'effect', category: 'Scroll & Sticky', pitch: 'Scroll-driven effects to go with it' },
  { href: '/tools/colorblind', level: 'effect', category: 'Charts & Data', pitch: 'Data components checked against the same simulations' },
  { href: '/tools/tailwind', level: 'block', category: null, query: 'section', pitch: 'Every block in the catalog is Tailwind you can paste — here are whole sections of it' },
  { href: '/tools/svg', level: 'effect', category: 'Icons & Shapes', pitch: 'Shapes and icons already animated in CSS' },
  { href: '/tools/palette-preview', level: 'block', category: null, query: 'landing', pitch: 'See a palette on a real page, not swatches' },
  { href: '/tools/loader', level: 'effect', category: 'Loaders', pitch: 'Ninety-odd loaders you can install instead of building' },
  { href: '/tools/convert', level: 'effect', category: 'Backgrounds', pitch: 'Colour in context — every effect uses the same variables' },
  { href: '/tools/shadcn', level: 'block', category: null, query: 'pricing', pitch: 'Your theme on real sections — install one and see it' },
  { href: '/tools/code-image', level: 'effect', category: 'Cards', pitch: 'Card treatments for the post that image is going in' },
]

/*
 * Every category named above must exist.
 *
 * A misspelled category is a link to a browse page with nothing on it, and
 * nothing else in the build would notice: the URL is well-formed, the page
 * renders, and it says "no results". Failing at module load means the tool
 * pages cannot render with a dead funnel on them.
 */
const KNOWN = new Set<string>(CATEGORIES)
const BAD = TOOL_FUNNELS.filter((f) => f.category !== null && !KNOWN.has(f.category))

if (BAD.length > 0) {
  throw new Error(
    `tool-funnel: unknown effect categories — ${BAD.map((f) => `${f.href} → "${f.category}"`).join(', ')}`,
  )
}

const BY_HREF = new Map(TOOL_FUNNELS.map((funnel) => [funnel.href, funnel]))

export function funnelFor(href: string): ToolFunnel | undefined {
  return BY_HREF.get(href)
}

/**
 * The browse URL for a funnel.
 *
 * `/category/{slug}` for a categorised effect, matching what the rest of
 * the site links to — `/browse?category=` is a filter on a document rather
 * than a document, and the canonical URL comment in `browse/page.tsx` says
 * so. Everything else goes through `/browse` with a query.
 */
export function funnelHref(funnel: ToolFunnel): string {
  if (funnel.level === 'effect' && funnel.category) {
    // Safe: the guard at module load has already rejected any category
    // that is not in CATEGORIES, so this narrowing cannot be wrong.
    return `/category/${categorySlug(funnel.category as EffectCategory)}`
  }

  const params = new URLSearchParams()
  if (funnel.query) params.set('q', funnel.query)
  params.set('level', funnel.level)
  return `/browse?${params.toString()}`
}
