/**
 * The colour table, loaded.
 *
 * Kept apart from `./color` (the extraction maths, which the build script
 * imports) and from `./facets` (which takes its data by injection) so that
 * exactly one module in the app imports `generated-effect-colors.json`, and
 * it is the one /library reaches through a dynamic `import()`. The table is
 * ~30 KB; putting it behind that import is what keeps the colour filter from
 * adding a byte to /library's first load.
 *
 * `/browse` is a server component and imports this statically — there is no
 * bundle to protect there.
 */

import TABLE from '@/lib/generated-effect-colors.json'
import { COLOR_BUCKETS, type ColorBucket } from './color'

interface ColorTable {
  buckets: string[]
  ids: Record<string, string>
}

const table = TABLE as ColorTable

const EMPTY: ReadonlySet<string> = new Set()

let byBucket: Map<ColorBucket, ReadonlySet<string>> | null = null

function load(): Map<ColorBucket, ReadonlySet<string>> {
  if (byBucket) return byBucket
  byBucket = new Map()
  for (const bucket of COLOR_BUCKETS) {
    const raw = table.ids[bucket] ?? ''
    byBucket.set(bucket, raw ? new Set(raw.split(' ')) : EMPTY)
  }
  return byBucket
}

/** Effect ids whose source has this bucket as a main colour. */
export function effectsByColor(bucket: ColorBucket): ReadonlySet<string> {
  return load().get(bucket) ?? EMPTY
}

/** How many effects each bucket holds, for the swatch labels. */
export function colorCounts(): Record<ColorBucket, number> {
  const out = {} as Record<ColorBucket, number>
  for (const bucket of COLOR_BUCKETS) out[bucket] = effectsByColor(bucket).size
  return out
}

/** How many effects carry any colour tag — the honest denominator's other half. */
export function taggedEffectCount(): number {
  const all = new Set<string>()
  for (const bucket of COLOR_BUCKETS) for (const id of effectsByColor(bucket)) all.add(id)
  return all.size
}
