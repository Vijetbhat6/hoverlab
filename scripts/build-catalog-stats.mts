/**
 * Emit the catalog's headline numbers as a standalone JSON file.
 *
 * Why this exists
 * ---------------
 * The landing page, the bento grid and the stats band all showed counts —
 * "4,308 effects", "343 Buttons" — and each got them by importing
 * EFFECT_INDEX and calling `.length` / `.filter().length`. That pulled the
 * entire 772 KB metadata index into the browser bundle on `/`, the
 * highest-traffic page in the product, to produce about forty integers.
 *
 * Counting is a build-time question, so it's answered at build time. The
 * output is ~1 KB and has no relationship to catalog size: adding another
 * ten thousand effects changes the numbers in this file, not its weight.
 *
 * Imports EFFECTS rather than reading generated-effects.json directly so
 * the hand-written effects are included and the totals match what the
 * catalog actually serves.
 *
 * Run automatically from `npm run build` via the `prebuild` script, after
 * build-effect-index.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { EFFECTS } from '../src/lib/effects.ts'
import { CATEGORIES, type EffectCategory } from '../src/lib/effect-types.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'lib', 'generated-catalog-stats.json')

const byCategory = {} as Record<EffectCategory, number>
for (const c of CATEGORIES) byCategory[c] = 0

let featured = 0
for (const e of EFFECTS) {
  if (e.featured) featured++
  if (e.category in byCategory) byCategory[e.category as EffectCategory]++
  else console.warn(`[build-catalog-stats] unknown category: ${e.category}`)
}

const empty = CATEGORIES.filter((c) => byCategory[c] === 0)

const stats = { total: EFFECTS.length, featured, byCategory }
writeFileSync(OUT, JSON.stringify(stats, null, 2) + '\n')

const bytes = JSON.stringify(stats).length
console.log(
  `[build-catalog-stats] ${EFFECTS.length} effects, ${CATEGORIES.length} categories -> ${(bytes / 1024).toFixed(1)} KB`,
)

// A declared-but-empty category is a live bug, not a warning: /category/<slug>
// is statically generated for every entry in CATEGORIES and calls notFound()
// when the category has no effects.
if (empty.length) {
  console.error(`[build-catalog-stats] EMPTY categories would 404 their hub page: ${empty.join(', ')}`)
  process.exit(1)
}
