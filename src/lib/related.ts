/**
 * Where an effect fits, one rung up.
 *
 * The effect page could send you sideways — six more effects in the same
 * category — and nowhere else. That is the whole catalog ladder collapsed
 * into its bottom rung: someone reading about a shimmer has no route to
 * the skeleton *section* that uses one, and blocks are the rung that is
 * actually sold. A page whose only outbound links are to more of the same
 * free thing is a page that cannot sell anything.
 *
 * ── Why a table, when this repo distrusts hand-kept tables ──
 *
 * The obvious derivation was tried first and does not work. Effect tags
 * are shape words — `abacus`, `beads`, `box-shadow`, `violet` — and block
 * tags are section words — `pricing`, `hero`, `checkout`. Overlap across
 * the two vocabularies, measured over the whole catalog, is zero: not
 * sparse, zero. A tag-derived rail would render nothing on every page.
 * Name and description matching lands in the same place for the same
 * reason, and fuzzy matching across two vocabularies that share no words
 * invents a relationship rather than finding one.
 *
 * So the bridge is authored, and the two ways it could rot are both shut:
 *
 *   - The left side cannot go stale. `Record<EffectCategory, …>` is total,
 *     so a new effect category is a type error here until it is mapped.
 *   - The right side cannot go stale either. It is `BlockCategory`, not
 *     `string`, so a renamed or deleted block category is a type error
 *     rather than a rail that silently empties.
 *
 * One gap neither of those closes: `BLOCK_CATEGORIES` is the shape of the
 * finished catalog and runs ahead of what is built, so a mapped category
 * can typecheck and still hold no blocks. `related.test.ts` asserts every
 * mapped category is populated, which is the case the compiler cannot see.
 *
 * ── What the claim is ──
 *
 * "Sections where an element like this usually lives" — a navigational
 * claim about the catalog, not a provenance claim about the code. No block
 * here is built *from* the effect on the page, nothing in the data records
 * such a link, and the UI must not imply one. Several effect categories
 * are decoration rather than component — patterns, blend modes — and those
 * map to the surfaces they decorate, which is the honest answer, not to a
 * padded list.
 */

import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import type { BlockCategory } from '@/lib/blocks/block-types'
import type { EffectCategory } from '@/lib/effect-types'

/**
 * A block, flattened to what a sidebar row shows.
 *
 * Deliberately not `BrowseHit` and deliberately not the block record: this
 * crosses into a client component as props, so it carries the five fields
 * that are rendered and none of the source text behind them.
 */
export interface RelatedBlock {
  id: string
  name: string
  description: string
  category: string
  href: string
}

/**
 * Effect category → the block categories that use that kind of element.
 *
 * Read each row as "a person shipping this element is building one of
 * these". Order matters: the first entry is the most typical home, and the
 * picker takes categories in this order, so a truncated list stays the
 * best part of the list rather than an arbitrary slice of it.
 */
const FITS_IN: Record<EffectCategory, readonly BlockCategory[]> = {
  Buttons: ['CTA Sections', 'Pricing', 'Heroes'],
  Loaders: ['Empty & Error States', 'Agent Reasoning', 'Dashboards'],
  Cards: ['Feature Sections', 'Product Listings', 'Testimonials'],
  Text: ['Heroes', 'Content & Blog', 'Feature Sections'],
  Backgrounds: ['Heroes', 'CTA Sections'],
  'Inputs & Hover': ['Contact & Forms', 'Command & Search', 'Authentication'],
  'Navigation & Menus': ['Navigation', 'Footers', 'Command & Search'],
  'Dividers & Separators': ['Content & Blog', 'Footers'],
  'Badges & Tags': ['Pricing', 'Product Listings', 'Stats'],
  'Toggles & Switches': ['Settings', 'Pricing', 'Billing & Usage'],
  'Tooltips & Popovers': ['Dashboards', 'Data Tables', 'Settings'],
  'Skeletons & Shimmers': ['Empty & Error States', 'Dashboards', 'Product Listings'],
  'Entrance Animations': ['Heroes', 'Feature Sections', 'Modals & Drawers'],
  'Borders & Outlines': ['Pricing', 'Feature Sections', 'Product Detail'],
  'Progress & Meters': ['Billing & Usage', 'Onboarding', 'Stats'],
  'Avatars & Images': ['Testimonials', 'Agent Chat', 'Settings'],
  'Modals & Overlays': ['Modals & Drawers', 'Cart & Checkout', 'Human in the Loop'],
  'Alerts & Toasts': ['Notifications', 'Empty & Error States', 'Human in the Loop'],
  'Accordions & Tabs': ['FAQ', 'Product Detail', 'Settings'],
  // Decoration rather than component, these four. They map to the surfaces
  // they are applied to, which is where someone would actually use one.
  '3D & Perspective': ['Heroes', 'Feature Sections'],
  'Glow & Neon': ['Heroes', 'CTA Sections'],
  'Patterns & Textures': ['Heroes', 'CTA Sections', 'Logo Clouds'],
  'Masks & Clip Paths': ['Heroes', 'Feature Sections'],
  'Charts & Data': ['Charts & Metrics', 'Dashboards', 'Stats'],
  'Timelines & Steps': ['Onboarding', 'Orders & Reviews', 'Agent Reasoning'],
  'Tables & Data Grids': ['Data Tables', 'Orders & Reviews', 'Dashboards'],
  'Forms & Validation': ['Contact & Forms', 'Authentication', 'File Upload'],
  'Scroll & Sticky': ['Navigation', 'Content & Blog', 'Product Detail'],
  'Sliders & Carousels': ['Product Detail', 'Testimonials', 'Logo Clouds'],
  'Icons & Shapes': ['Feature Sections', 'Logo Clouds', 'Stats'],
  'Micro-interactions': ['CTA Sections', 'Inline AI Actions', 'Settings'],
  'Filters & Blend Modes': ['Heroes', 'Product Listings'],
}

/** The block categories mapped to one effect category. Exported for the test. */
export function fitsIn(category: EffectCategory): readonly BlockCategory[] {
  return FITS_IN[category]
}

/** Every block category named anywhere in the bridge, deduplicated. */
export function mappedBlockCategories(): BlockCategory[] {
  return [...new Set(Object.values(FITS_IN).flat())].sort()
}

/**
 * Blocks to show beside an effect, best-fitting category first.
 *
 * Featured blocks lead within a category — they are the hand-picked ones
 * and the likeliest to read well as a thumbnail — and catalog order breaks
 * the remaining ties, which is curated rather than arbitrary.
 *
 * Returns fewer than `limit`, or none at all, rather than reaching for a
 * looser rule when a category is thin. An empty rail is a rail that does
 * not render; a padded one is a wrong recommendation.
 */
export function relatedBlocks(category: EffectCategory, limit = 3): RelatedBlock[] {
  const out: RelatedBlock[] = []

  for (const blockCategory of FITS_IN[category]) {
    const inCategory = BLOCK_INDEX.filter((b) => b.category === blockCategory)
    // Featured first, then catalog order. `sort` on the filtered copy, so
    // the module-level index is never reordered under another caller.
    const ordered = [
      ...inCategory.filter((b) => b.featured),
      ...inCategory.filter((b) => !b.featured),
    ]

    for (const block of ordered) {
      if (out.length >= limit) return out
      if (out.some((r) => r.id === block.id)) continue
      out.push({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        href: `/block/${block.id}`,
      })
      // One per category before taking a second from any of them, so three
      // slots read as three kinds of section rather than three pricing
      // blocks. The outer loop runs again below if slots remain.
      break
    }
  }

  // Second pass fills any remaining slots, now allowing more than one from
  // a category — a mapping with two thin categories should still fill.
  for (const blockCategory of FITS_IN[category]) {
    for (const block of BLOCK_INDEX) {
      if (out.length >= limit) return out
      if (block.category !== blockCategory) continue
      if (out.some((r) => r.id === block.id)) continue
      out.push({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        href: `/block/${block.id}`,
      })
    }
  }

  return out
}
