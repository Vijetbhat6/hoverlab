/**
 * Client-safe page metadata.
 *
 * Import this from `'use client'` components instead of `./pages` — same
 * split, same reasoning, as `block-index.ts` vs `blocks.ts`.
 */

import { PAGE_CATALOG } from './catalog'
import LINE_COUNTS from './generated-page-stats.json'
import {
  PAGE_CATEGORIES,
  type PageCategory,
  type PageMeta,
} from './page-types'

const stats = LINE_COUNTS as Record<string, { lines: number; files: number }>

/** Every page, as metadata, in catalog order. */
export const PAGE_INDEX: PageMeta[] = PAGE_CATALOG.map((p) => ({
  ...p,
  level: 'page' as const,
  lines: stats[p.id]?.lines ?? 0,
}))

/** How many pages exist. Safe to import anywhere — it is one integer. */
export const PAGE_COUNT = PAGE_INDEX.length

const BY_ID = new Map(PAGE_INDEX.map((p) => [p.id, p]))

/** Look up a single page's metadata by id. */
export function getPageMeta(id: string): PageMeta | undefined {
  return BY_ID.get(id)
}

/** Pages in one category, in catalog order. */
export function pagesInCategory(category: PageCategory): PageMeta[] {
  return PAGE_INDEX.filter((p) => p.category === category)
}

/** Categories that actually have pages in them, in taxonomy order. */
export function populatedPageCategories(): PageCategory[] {
  return PAGE_CATEGORIES.filter((c) => pagesInCategory(c).length > 0)
}

/**
 * Pages that render a given block, for the block detail page's "used in"
 * rail — the upward half of the drill-down.
 *
 * The downward half (page → its blocks) is just `page.composedOf`. This is
 * the reverse lookup, and it is what turns a flat catalog into something
 * you can climb: from a pricing table to every page that uses one.
 */
export function pagesUsingBlock(blockId: string): PageMeta[] {
  return PAGE_INDEX.filter((p) => p.composedOf.includes(blockId))
}

/** Curated picks. */
export const FEATURED_PAGES: PageMeta[] = PAGE_INDEX.filter((p) => p.featured)
