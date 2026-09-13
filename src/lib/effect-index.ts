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
import { SHADER_EFFECTS } from './shaders/shader-effects'
import type { Effect, EffectCategory } from './effect-types'
import type { EffectRenderer } from './shaders/shader-types'

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
  /**
   * How the effect paints itself. Absent means `'css'` — the tuple encoding
   * has no column for it, because 1,047 of 1,062 rows would carry the same
   * value. The fifteen that do not are appended from `SHADER_EFFECTS`,
   * which is a literal, so they can simply say so.
   */
  renderer?: EffectRenderer
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
 * The shader tier, as metadata.
 *
 * A literal rather than a row in the encoded index: the encoding is built
 * from `generated-effects.json`, which these are not in, and fifteen
 * records is not worth a second encoder. They are `featured: false` by
 * default and opt in individually, the same as any other effect — the tier
 * being new is not a reason for all of it to be curated.
 */
const SHADER_META: EffectMeta[] = SHADER_EFFECTS.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description: e.description,
  tags: e.tags ?? [],
  featured: e.featured === true,
  darkSurface: e.darkSurface === true,
  renderer: e.renderer,
  ...(e.previewClass ? { previewClass: e.previewClass } : {}),
}))

/**
 * The full catalog as metadata, in the same order as `EFFECTS` in
 * `@/lib/effects` (hand-crafted, then shaders, then generated). Order
 * matters: the library page's 'default' sort preserves it as a curation
 * choice.
 */
export const EFFECT_INDEX: EffectMeta[] = [
  ...HANDCRAFTED_META,
  ...SHADER_META,
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
 *  Re-exports
 * ------------------------------------------------------------------ */

/**
 * The bundled hand-crafted effects now live in `./bundled-effects`, and
 * the counts in `./catalog-stats`. Both used to be defined here, which
 * meant a component wanting one hand-written effect — or a single integer
 * — imported this module and dragged the 772 KB generated index into its
 * bundle with it.
 *
 * These re-exports keep existing call sites working. Prefer importing
 * from the narrow modules directly: that is the whole point of the split,
 * and an import from here costs the full index no matter what you take.
 */
export { BUNDLED_EFFECTS, getBundledEffect } from './bundled-effects'
export { countByCategory, FEATURED_COUNT } from './catalog-stats'
