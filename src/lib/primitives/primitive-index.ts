/**
 * Client-safe primitive metadata.
 *
 * Import this from `'use client'` components instead of `./primitives` — it
 * carries everything needed to list, filter, count and link primitives, and
 * none of the ~160 KB of TSX that only a detail page renders.
 *
 *   ./primitives         160 KB + metadata   full source  (server / build)
 *   ./primitive-index      ~7 KB             metadata     (safe on client)
 *
 * Same split, same reasoning, as `block-index.ts` vs `blocks.ts`.
 */

import { PRIMITIVE_CATALOG } from './catalog'
import LINE_COUNTS from './generated-primitive-stats.json'
import {
  PRIMITIVE_CATEGORIES,
  type PrimitiveCategory,
  type PrimitiveMeta,
} from './primitive-types'

const stats = LINE_COUNTS as Record<string, { lines: number; files: number }>

/** Every primitive, as metadata, in catalog order. */
export const PRIMITIVE_INDEX: PrimitiveMeta[] = PRIMITIVE_CATALOG.map((p) => ({
  ...p,
  level: 'primitive' as const,
  lines: stats[p.id]?.lines ?? 0,
}))

/** How many primitives exist. Safe to import anywhere — it is one integer. */
export const PRIMITIVE_COUNT = PRIMITIVE_INDEX.length

const BY_ID = new Map(PRIMITIVE_INDEX.map((p) => [p.id, p]))

/** Look up a single primitive's metadata by id. */
export function getPrimitiveMeta(id: string): PrimitiveMeta | undefined {
  return BY_ID.get(id)
}

/** Primitives in one category, in catalog order. */
export function primitivesInCategory(category: PrimitiveCategory): PrimitiveMeta[] {
  return PRIMITIVE_INDEX.filter((p) => p.category === category)
}

/** How many primitives a category holds. */
export function countInCategory(category: PrimitiveCategory): number {
  return primitivesInCategory(category).length
}

/**
 * Categories that actually have primitives in them, in taxonomy order.
 *
 * Every one of the eight is populated today, unlike the block taxonomy —
 * the category list was written from the set of primitives rather than
 * ahead of it. The filter stays because the alternative is a rail that
 * renders a dead link the first time a category is added before its first
 * primitive.
 */
export function populatedPrimitiveCategories(): PrimitiveCategory[] {
  return PRIMITIVE_CATEGORIES.filter((c) => countInCategory(c) > 0)
}

/** Curated picks, for the landing rail and the "Featured" filter. */
export const FEATURED_PRIMITIVES: PrimitiveMeta[] = PRIMITIVE_INDEX.filter(
  (p) => p.featured,
)

/**
 * How many primitives have no npm dependency at all.
 *
 * A headline number rather than a convenience: the tier's argument is that
 * these paste into any React project, and "N of 27 need nothing but React"
 * is exactly the sort of claim that goes stale the first time somebody adds
 * an icon to one of them. Counted from the catalog so it cannot — and the
 * catalog's own `deps` are checked against the real imports in
 * `primitives.test.ts`, which is what makes this number true rather than
 * merely consistent.
 */
export const ZERO_DEP_COUNT = PRIMITIVE_INDEX.filter((p) => p.deps.length === 0).length
