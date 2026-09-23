/**
 * The effect index, searched.
 *
 * Its own module, and not a slice of the catalog-wide index in `@/lib/browse`,
 * for one reason: bundle weight. `/library` is a client page that already
 * carries the effect metadata and nothing else, and importing `browse.ts`
 * for its search would drag the primitive, block, page and template indexes
 * in behind it — to rank a grid of effects. `/library` is the page this
 * work is not allowed to make heavier, so it gets the engine (a few KB) and
 * the effect metadata it already had.
 *
 * The AI route imports this too, on the server, to pick the candidates it
 * hands the model — see `@/lib/ai/search-request`.
 *
 * Built lazily on the first query rather than at import: a visitor who never
 * types never pays for the index, and the ~1,100-document build is a few
 * milliseconds that belong to the first keystroke, not to page load.
 */

import { EFFECT_INDEX, type EffectMeta } from '@/lib/effect-index'
import {
  createSearchIndex,
  search,
  type SearchDoc,
  type SearchHit,
  type SearchIndex,
  type SearchOptions,
} from './engine'

/** Featured effects break ties. Small: it must never beat a better match. */
export const FEATURED_BOOST = 0.75

type EffectDoc = EffectMeta & SearchDoc

let index: SearchIndex<EffectDoc> | null = null

/** The memoised index over every effect. */
export function getEffectSearchIndex(): SearchIndex<EffectDoc> {
  index ??= createSearchIndex(
    EFFECT_INDEX.map((e) => ({ ...e, boost: e.featured ? FEATURED_BOOST : 0 })),
  )
  return index
}

/** Rank effects against a query. Empty query → no hits. */
export function searchEffects(
  query: string,
  options?: SearchOptions<EffectDoc>,
): SearchHit<EffectDoc>[] {
  return search(getEffectSearchIndex(), query, options)
}
