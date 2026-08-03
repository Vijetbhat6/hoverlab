/**
 * Client-safe effect metadata index.
 *
 * This is what `'use client'` components should import instead of
 * `@/lib/effects`. It carries everything needed to search, filter, sort,
 * paginate, and count the catalog — but NOT the `html` / `css` payloads,
 * which are 87% of the catalog's weight and are only needed for the
 * handful of effects actually on screen.
 *
 *   @/lib/effects        1.6 MB   full catalog   (server / build only)
 *   @/lib/effect-index   259 KB   metadata only  (safe on the client)
 *
 * Hand-crafted effects are the exception: all ~64 of them are bundled in
 * full (~64 KB), because they're the featured set that the landing
 * showcase and the "Featured" filter render immediately. Bundling them
 * means those paths never wait on a network round-trip. Everything
 * generated resolves its markup + CSS lazily via `useEffectDetails()`.
 */

import GENERATED_INDEX from './generated-effects-index.json'
import { HANDCRAFTED } from './effects-handcrafted'
import { withMotionGuard } from './effect-insights'
import type { Effect, EffectCategory } from './effect-types'

export type { Effect, EffectCategory } from './effect-types'
export { CATEGORIES } from './effect-types'

/**
 * An effect stripped of its `html` / `css`. Field names deliberately match
 * `Effect` so existing filter/sort/search code works unchanged.
 */
export interface EffectMeta {
  id: string
  name: string
  category: EffectCategory
  description: string
  tags: string[]
  featured: boolean
  darkSurface: boolean
  previewClass?: string
}

/** Shape emitted by scripts/build-effect-index.mjs. */
interface EncodedIndex {
  c: string[]
  e: [string, string, number, string, string, number, string][]
}

const encoded = GENERATED_INDEX as EncodedIndex

/**
 * Expand the tuple encoding back into objects. Runs once at module load.
 * Decoding 1,616 rows is ~1 ms — far cheaper than parsing the 1.6 MB of
 * CSS text this encoding lets us leave on the server.
 */
function decodeIndex(): EffectMeta[] {
  const cats = encoded.c
  return encoded.e.map(
    ([id, name, catIdx, description, tags, darkSurface, previewClass]) => ({
      id,
      name,
      category: cats[catIdx] as EffectCategory,
      description,
      tags: tags ? tags.split(' ') : [],
      featured: false,
      darkSurface: darkSurface === 1,
      ...(previewClass ? { previewClass } : {}),
    }),
  )
}

/**
 * Hand-crafted effects, as metadata. These are `featured: true` — matching
 * how `@/lib/effects` marks them — so the "Featured" filter behaves
 * identically whether the caller reads the index or the full catalog.
 */
const HANDCRAFTED_META: EffectMeta[] = HANDCRAFTED.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description: e.description,
  tags: e.tags ?? [],
  featured: true,
  darkSurface: e.darkSurface === true,
  ...(e.previewClass ? { previewClass: e.previewClass } : {}),
}))

/**
 * The full catalog as metadata, in the same order as `EFFECTS` in
 * `@/lib/effects` (hand-crafted first, then generated). Order matters:
 * the library page's 'default' sort preserves it as a curation choice.
 */
export const EFFECT_INDEX: EffectMeta[] = [
  ...HANDCRAFTED_META,
  ...decodeIndex(),
]

/** Total effect count, exposed for the hero badge and stats band. */
export const TOTAL_COUNT = EFFECT_INDEX.length

const META_BY_ID = new Map(EFFECT_INDEX.map((e) => [e.id, e]))

/** Look up a single effect's metadata by id. */
export function getEffectMeta(id: string): EffectMeta | undefined {
  return META_BY_ID.get(id)
}

/* ------------------------------------------------------------------ *
 *  Bundled full effects (hand-crafted only)
 * ------------------------------------------------------------------ */

/**
 * Hand-crafted effects with their markup + CSS, available synchronously
 * on the client. `useEffectDetails()` checks this first and only hits the
 * network for ids that aren't here.
 */
export const BUNDLED_EFFECTS: Effect[] = HANDCRAFTED.map((e) => ({
  ...e,
  // Same motion guard the server-side catalog applies, so a bundled
  // effect rendered straight from the client matches what /api/effects
  // would have returned for it. See `withMotionGuard`.
  css: withMotionGuard(e.css),
  featured: true,
}))

const BUNDLED_BY_ID = new Map(BUNDLED_EFFECTS.map((e) => [e.id, e]))

/**
 * Get a full effect synchronously, if it happens to be one of the bundled
 * hand-crafted ones. Returns undefined for generated effects — those must
 * go through `useEffectDetails()` / `/api/effects/batch`.
 */
export function getBundledEffect(id: string): Effect | undefined {
  return BUNDLED_BY_ID.get(id)
}

/**
 * Count effects per category. Used by the landing bento grid and stats
 * band, which previously imported the whole catalog just to call
 * `.filter().length`.
 */
export function countByCategory(category: EffectCategory): number {
  let n = 0
  for (const e of EFFECT_INDEX) if (e.category === category) n++
  return n
}
