/**
 * Client-safe block metadata.
 *
 * Import this from `'use client'` components instead of `./blocks` — it
 * carries everything needed to list, filter, count and link blocks, and
 * none of the ~53 KB of TSX that only a detail page renders.
 *
 *   ./blocks         53 KB + metadata   full source   (server / build only)
 *   ./block-index     ~6 KB             metadata      (safe on the client)
 *
 * Same split, same reasoning, as `effect-index.ts` vs `effects.ts`.
 */

import { BLOCK_CATALOG } from './catalog'
import LINE_COUNTS from './generated-block-stats.json'
import {
  BLOCK_CATEGORIES,
  BLOCK_GROUPS,
  GROUP_OF,
  type BlockCategory,
  type BlockGroup,
  type BlockMeta,
} from './block-types'

const stats = LINE_COUNTS as Record<string, { lines: number; files: number }>

/** Every block, as metadata, in catalog order. */
export const BLOCK_INDEX: BlockMeta[] = BLOCK_CATALOG.map((b) => ({
  ...b,
  level: 'block' as const,
  lines: stats[b.id]?.lines ?? 0,
}))

/** How many blocks exist. Safe to import anywhere — it is one integer. */
export const BLOCK_COUNT = BLOCK_INDEX.length

const BY_ID = new Map(BLOCK_INDEX.map((b) => [b.id, b]))

/** Look up a single block's metadata by id. */
export function getBlockMeta(id: string): BlockMeta | undefined {
  return BY_ID.get(id)
}

/** Blocks in one category, in catalog order. */
export function blocksInCategory(category: BlockCategory): BlockMeta[] {
  return BLOCK_INDEX.filter((b) => b.category === category)
}

/** How many blocks a category holds. */
export function countInCategory(category: BlockCategory): number {
  return blocksInCategory(category).length
}

/**
 * Categories that actually have blocks in them, in taxonomy order.
 *
 * `BLOCK_CATEGORIES` is the shape of the finished catalog and runs well
 * ahead of what is built — listing all 28 on `/blocks` today would be 21
 * dead ends. The full list still drives ordering and grouping, so a
 * category slots into its intended place the moment its first block lands
 * rather than being appended wherever it happened to be added.
 */
export function populatedBlockCategories(): BlockCategory[] {
  return BLOCK_CATEGORIES.filter((c) => countInCategory(c) > 0)
}

/** Populated categories bucketed by audience, for the `/blocks` rail. */
export function populatedByGroup(): Array<{
  group: BlockGroup
  categories: Array<{ category: BlockCategory; count: number }>
}> {
  const populated = populatedBlockCategories()

  // `BLOCK_GROUPS`, not a literal list. This was a second copy of the group
  // order, and adding a fourth group to the taxonomy silently dropped its
  // categories off the rail — they were populated, grouped, and rendered
  // nowhere.
  return BLOCK_GROUPS
    .map((group) => ({
      group,
      categories: populated
        .filter((c) => GROUP_OF[c] === group)
        .map((category) => ({ category, count: countInCategory(category) })),
    }))
    .filter((g) => g.categories.length > 0)
}

/** Curated picks, for the landing rail. */
export const FEATURED_BLOCKS: BlockMeta[] = BLOCK_INDEX.filter((b) => b.featured)
