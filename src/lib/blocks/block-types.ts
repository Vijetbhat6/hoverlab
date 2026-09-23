/**
 * Block taxonomy and types — Tier 2 of the ladder in `artifact-types.ts`.
 *
 * A block is one complete section of a real interface: a pricing table, an
 * auth card, a dashboard shell. Where an effect answers "how do I make this
 * button glow", a block answers "how do I build the thing I was actually
 * hired to build".
 *
 * DATA-FREE, like `effect-types.ts` — the taxonomy and the types travel to
 * the client without the sources coming with them.
 *
 * The category list below is deliberately larger than what is populated
 * today. It is the shape of the finished catalog, so the order and grouping
 * stay fixed as blocks land rather than being reshuffled every release; the
 * index only surfaces categories that actually have blocks in them (see
 * `populatedBlockCategories`).
 */

import type { Artifact, ArtifactFile } from '../artifact-types'
import { toSlug } from '../artifact-types'

/* ------------------------------------------------------------------ *
 *  Categories
 * ------------------------------------------------------------------ */

export type BlockCategory =
  /* -- Marketing: what a visitor needs to launch a site ------------- */
  | 'Heroes'
  | 'Feature Sections'
  | 'Pricing'
  | 'Testimonials'
  | 'Logo Clouds'
  | 'FAQ'
  | 'CTA Sections'
  | 'Stats'
  | 'Navigation'
  | 'Footers'
  | 'Content & Blog'
  | 'Contact & Forms'
  /* HTML email — nested tables and inline styles, not flexbox, because it
   * is read by a rendering engine (Outlook via Word, Gmail's stripped
   * <style>) that the rest of this catalog never has to answer to. Its own
   * category rather than a corner of Content & Blog, because the markup
   * discipline and the CAN-SPAM/GDPR footer obligations are unique to this
   * one artifact shape and would be a surprising exception buried in a
   * category about web pages. /tools/email covers the four TRANSACTIONAL
   * sends (welcome, verify, reset, receipt); these are the ones sent to a
   * whole list on purpose. */
  | 'Email Templates'
  /* -- Product: what a visitor needs to build an app ---------------- */
  | 'Authentication'
  | 'Dashboards'
  /* App navigation as its own surface: grouped, collapsible, nested,
   * resizable. Kept apart from Dashboards because the shell around a sidebar
   * is the easy part; collapse state, roving focus in a tree and a drag
   * handle a keyboard can move are problems a dashboard never has. */
  | 'Sidebars'
  | 'Data Tables'
  /* The create/read/update/delete family, in all three surfaces. Its own
   * category rather than a corner of Data Tables or Modals & Drawers,
   * because the interesting question about a CRUD screen is which of the
   * four verbs it serves and on which surface — and a visitor building an
   * internal tool wants to see the whole matrix at once. */
  | 'CRUD'
  | 'Charts & Metrics'
  | 'Settings'
  | 'Empty & Error States'
  | 'Modals & Drawers'
  | 'Onboarding'
  | 'Notifications'
  /* Human-to-human messaging: threads, bubbles, inboxes, calls. Kept apart
   * from Agent Chat on purpose — a delivery receipt, a mute state and an
   * active speaker are problems an assistant thread does not have. */
  | 'Communication'
  | 'Command & Search'
  | 'File Upload'
  | 'Billing & Usage'
  /* Anything whose subject is a date or a time: month and week views,
   * availability grids, slot pickers, timezone strips, recurrence editors.
   * Its own category rather than a corner of Dashboards, because the hard
   * part of a scheduling screen is never the shell it sits in — it is the
   * overflow on a busy day, the zone the slot is quoted in, and the keyboard
   * model for a grid of dates, and none of those are Dashboard problems. */
  | 'Scheduling & Calendar'
  /* -- AI: the surfaces an agent product is assembled from ---------- *
   * Separate from Product on purpose. These are not "a dashboard with
   * a chatbot bolted on" — a thread, a reasoning trace and an approval
   * card are their own layout problems, with their own live-region and
   * focus rules, and grouping them under Product would bury them in a
   * rail a visitor scans for CRUD. */
  | 'Agent Chat'
  | 'Agent Reasoning'
  | 'Human in the Loop'
  | 'Retrieval & Context'
  | 'Inline AI Actions'
  /* -- Commerce ----------------------------------------------------- */
  | 'Product Listings'
  | 'Product Detail'
  | 'Cart & Checkout'
  | 'Orders & Reviews'
  /* Everything after the money has changed hands: warranties, refunds,
   * returns, repairs. Nobody builds these until the complaints start, which
   * is exactly why they belong in a catalog. */
  | 'After-Sale Service'

export const BLOCK_CATEGORIES: BlockCategory[] = [
  'Heroes',
  'Feature Sections',
  'Pricing',
  'Testimonials',
  'Logo Clouds',
  'FAQ',
  'CTA Sections',
  'Stats',
  'Navigation',
  'Footers',
  'Content & Blog',
  'Contact & Forms',
  'Email Templates',
  'Authentication',
  'Dashboards',
  'Sidebars',
  'Data Tables',
  'CRUD',
  'Charts & Metrics',
  'Settings',
  'Empty & Error States',
  'Modals & Drawers',
  'Onboarding',
  'Notifications',
  'Communication',
  'Command & Search',
  'File Upload',
  'Billing & Usage',
  'Scheduling & Calendar',
  'Agent Chat',
  'Agent Reasoning',
  'Human in the Loop',
  'Retrieval & Context',
  'Inline AI Actions',
  'Product Listings',
  'Product Detail',
  'Cart & Checkout',
  'Orders & Reviews',
  'After-Sale Service',
]

/**
 * The audiences the taxonomy serves, used to group the category rail on
 * `/blocks`. A flat list of thirty-odd categories is a wall; four groups of
 * roughly ten is a menu.
 */
export type BlockGroup = 'Marketing' | 'Product' | 'AI Interfaces' | 'Commerce'

export const BLOCK_GROUPS: BlockGroup[] = [
  'Marketing',
  'Product',
  'AI Interfaces',
  'Commerce',
]

export const GROUP_OF: Record<BlockCategory, BlockGroup> = {
  Heroes: 'Marketing',
  'Feature Sections': 'Marketing',
  Pricing: 'Marketing',
  Testimonials: 'Marketing',
  'Logo Clouds': 'Marketing',
  FAQ: 'Marketing',
  'CTA Sections': 'Marketing',
  Stats: 'Marketing',
  Navigation: 'Marketing',
  Footers: 'Marketing',
  'Content & Blog': 'Marketing',
  'Contact & Forms': 'Marketing',
  'Email Templates': 'Marketing',
  Authentication: 'Product',
  Dashboards: 'Product',
  Sidebars: 'Product',
  'Data Tables': 'Product',
  CRUD: 'Product',
  'Charts & Metrics': 'Product',
  Settings: 'Product',
  'Empty & Error States': 'Product',
  'Modals & Drawers': 'Product',
  Onboarding: 'Product',
  Notifications: 'Product',
  Communication: 'Product',
  'Command & Search': 'Product',
  'File Upload': 'Product',
  'Billing & Usage': 'Product',
  'Scheduling & Calendar': 'Product',
  'Agent Chat': 'AI Interfaces',
  'Agent Reasoning': 'AI Interfaces',
  'Human in the Loop': 'AI Interfaces',
  'Retrieval & Context': 'AI Interfaces',
  'Inline AI Actions': 'AI Interfaces',
  'Product Listings': 'Commerce',
  'Product Detail': 'Commerce',
  'Cart & Checkout': 'Commerce',
  'Orders & Reviews': 'Commerce',
  'After-Sale Service': 'Commerce',
}

/* ------------------------------------------------------------------ *
 *  The Block type
 * ------------------------------------------------------------------ */

/**
 * A block is an `Artifact` that previews as a real React render.
 *
 * `previewComponent` and `files` are both required, and `html` / `css` are
 * forbidden. That is the whole difference from an effect, and it is worth
 * enforcing in the type: a section rebuilt as a string of markup would
 * preview something subtly different from the source the user copies, and
 * the drift would only ever be caught by eye.
 */
export interface Block
  extends Omit<
    Artifact,
    'level' | 'category' | 'html' | 'css' | 'files' | 'tags' | 'deps'
  > {
  level: 'block'
  category: BlockCategory
  previewComponent: string
  files: ArtifactFile[]
  /**
   * Required, unlike on the base. Every block is authored by hand in
   * `catalog.ts`, so an empty list is a real answer ("no dependencies") and
   * an absent one is an oversight — worth the type distinguishing, since
   * the card renders "No deps" as a selling point.
   */
  tags: string[]
  deps: string[]
  /**
   * Tailwind height class for this block's card thumbnail, overriding the
   * default crop.
   *
   * Almost every block is a section tall enough to fill the default box.
   * Navbars and footers are not — a 64px bar rendered at the thumbnail's
   * half scale leaves most of the card empty, which reads as a broken
   * preview rather than a short component. Kept as data on the block
   * because the exception is per-block, not per-category: a mega-menu navbar
   * and a minimal footer are different heights.
   */
  thumbHeight?: string
  html?: never
  css?: never
}

/**
 * A block without its `files` — what the client-side index carries.
 *
 * Same split, and same reason, as `EffectMeta`: the grid needs names,
 * categories and tags to filter on; it does not need several hundred
 * kilobytes of TSX that only the detail page will ever show.
 */
export interface BlockMeta
  extends Omit<Block, 'files' | 'frameworks' | 'html' | 'css'> {
  /** Line count of the block's primary file, shown on the card. */
  lines: number
}

/* ------------------------------------------------------------------ *
 *  Slugs
 * ------------------------------------------------------------------ */

/** `"Empty & Error States"` → `"empty-error-states"`. */
export function blockCategorySlug(category: BlockCategory): string {
  return toSlug(category)
}

const BY_SLUG = new Map<string, BlockCategory>(
  BLOCK_CATEGORIES.map((c) => [blockCategorySlug(c), c]),
)

/** Resolve a URL slug back to its block category, or undefined if unknown. */
export function blockCategoryFromSlug(slug: string): BlockCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase())
}
