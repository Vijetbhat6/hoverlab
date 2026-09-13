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

/* ------------------------------------------------------------------ *
 *  Takes
 * ------------------------------------------------------------------ */

/** Take 01's id → the takes that name it, in catalog order. */
const TAKES_BY_ORIGIN = PAGE_INDEX.reduce((acc, p) => {
  if (!p.takeOf) return acc
  acc.set(p.takeOf, [...(acc.get(p.takeOf) ?? []), p])
  return acc
}, new Map<string, PageMeta[]>())

/**
 * Every take of the page type `id` belongs to, take 01 first — or an empty
 * array when this page type only has the one layout.
 *
 * Works from either end of the pair: given take 02 it walks up to take 01
 * first, so a caller never has to know which half it is holding. Empty
 * rather than `[self]` for a lone page, because the only question the UI
 * asks is "is there another take?" and a one-element answer would have
 * every caller writing `length > 1`.
 */
export function takesOfPage(id: string): PageMeta[] {
  const page = BY_ID.get(id)
  if (!page) return []

  const originId = page.takeOf ?? page.id
  const origin = BY_ID.get(originId)
  if (!origin) return []

  const siblings = TAKES_BY_ORIGIN.get(originId) ?? []
  return siblings.length > 0 ? [origin, ...siblings] : []
}

/**
 * Which take this page is, 1-based, for the "Take 2 of 2" label.
 *
 * Returns `undefined` for a page type with a single layout — the label is
 * noise when there is nothing to choose between.
 */
export function takeNumber(id: string): { n: number; of: number } | undefined {
  const takes = takesOfPage(id)
  if (takes.length === 0) return undefined

  const n = takes.findIndex((p) => p.id === id)
  return n === -1 ? undefined : { n: n + 1, of: takes.length }
}

/** Curated picks. */
export const FEATURED_PAGES: PageMeta[] = PAGE_INDEX.filter((p) => p.featured)
