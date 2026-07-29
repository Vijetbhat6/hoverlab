/**
 * Build the client-safe effect metadata index.
 *
 * Reads src/lib/generated-effects.json (the full 1.6 MB catalog, including
 * every effect's html + css) and writes src/lib/generated-effects-index.json
 * containing metadata ONLY — the fields the browser needs in order to
 * search, filter, sort, and count effects.
 *
 * Why this exists
 * ---------------
 * /library and / were both `'use client'` components importing the full
 * catalog, so Next.js inlined all 1.6 MB of it into a browser chunk. Over
 * the wire that gzips down to ~97 KB, but the browser still had to parse
 * and evaluate 1.6 MB of JavaScript and hold it in memory before the grid
 * could paint — which is what made first render slow on mobile.
 *
 * Encoding
 * --------
 * The index uses a tuple ("columnar") encoding rather than an array of
 * objects, because repeating seven JSON keys 1,600 times is pure overhead:
 *
 *   objects, all fields  ~354 KB
 *   tuples,  all fields  ~255 KB   <- what we emit
 *
 * Category strings are interned into a lookup array and referenced by
 * index, since 1,600 effects share only 13 distinct categories.
 *
 * Tuple layout (see decodeIndex() in src/lib/effect-index.ts):
 *   [ id, name, categoryIndex, description, tagsSpaceJoined,
 *     darkSurface(0|1), previewClass(''|string) ]
 *
 * Run automatically from `npm run build` via the `prebuild` script.
 * Re-run manually after regenerating the catalog:
 *   node scripts/build-effect-index.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'src', 'lib', 'generated-effects.json')
const OUT = join(__dirname, '..', 'src', 'lib', 'generated-effects-index.json')

const raw = readFileSync(SRC, 'utf8')
const effects = JSON.parse(raw)

if (!Array.isArray(effects)) {
  throw new Error(`Expected ${SRC} to contain an array, got ${typeof effects}`)
}

// Intern categories: 1,600 effects share ~13 distinct category strings.
const categories = []
for (const e of effects) {
  if (typeof e.category === 'string' && !categories.includes(e.category)) {
    categories.push(e.category)
  }
}

const rows = effects.map((e) => {
  const catIdx = categories.indexOf(e.category)
  if (catIdx === -1) {
    throw new Error(`Effect ${e.id} has an unknown category: ${e.category}`)
  }
  return [
    e.id,
    e.name ?? '',
    catIdx,
    e.description ?? '',
    // Tags are only ever substring-searched on the client, so a single
    // space-joined string searches identically and costs far less than
    // a nested JSON array per row.
    Array.isArray(e.tags) ? e.tags.join(' ') : '',
    e.darkSurface ? 1 : 0,
    typeof e.previewClass === 'string' ? e.previewClass : '',
  ]
})

const payload = { c: categories, e: rows }
const json = JSON.stringify(payload)

writeFileSync(OUT, json)

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
console.log(
  [
    `[build-effect-index] ${rows.length} effects, ${categories.length} categories`,
    `  full catalog : ${kb(raw.length)} raw / ${kb(gzipSync(raw).length)} gzip`,
    `  metadata idx : ${kb(json.length)} raw / ${kb(gzipSync(json).length)} gzip`,
    `  -> ${(100 - (json.length / raw.length) * 100).toFixed(1)}% less JavaScript for the browser to parse`,
  ].join('\n'),
)
