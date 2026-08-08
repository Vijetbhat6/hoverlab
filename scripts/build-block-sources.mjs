/**
 * Inline every block's source into JSON at build time.
 *
 * The block sources under src/lib/blocks/sources/ are real components: the
 * preview renders them, so what a visitor sees and what they copy can never
 * drift. But the detail page also has to *show* that source, and reading
 * .tsx files off disk at request time is a bet that the deployment bundler
 * traced them into the serverless function — a bet that fails silently and
 * only on production cold paths.
 *
 * So the text is inlined here instead, the same way the effect catalog is
 * built. Two outputs, mirroring the effects split:
 *
 *   generated-block-sources.json   full text, server-only, grows with catalog
 *   generated-block-stats.json     id -> line count, client-safe, ~1 KB
 *
 * Run via `npm run build:blocks` (wired into prebuild).
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const blocksDir = join(here, '..', 'src', 'lib', 'blocks')
const sourcesDir = join(blocksDir, 'sources')

/* ------------------------------------------------------------------ *
 *  Read the catalog's ids without importing it
 * ------------------------------------------------------------------ *
 * catalog.ts is TypeScript with type-only imports, so this plain-node
 * script cannot require() it. Pulling the ids out with a regex is enough
 * to cross-check the two lists, and keeps the script dependency-free —
 * the alternative is dragging tsx into a step that runs on every build.
 */
const catalogSrc = readFileSync(join(blocksDir, 'catalog.ts'), 'utf8')
const catalogIds = [...catalogSrc.matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1])

if (catalogIds.length === 0) {
  throw new Error('build-block-sources: parsed 0 ids out of catalog.ts — has its shape changed?')
}

/* ------------------------------------------------------------------ *
 *  Pair each id with its source file
 * ------------------------------------------------------------------ */

const sourceFiles = readdirSync(sourcesDir).filter((f) => f.endsWith('.tsx'))
const sourceIds = sourceFiles.map((f) => f.replace(/\.tsx$/, ''))

/*
 * Fail the build on either kind of mismatch. A block whose source is
 * missing renders an empty code panel; a source with no catalog entry is
 * invisible in the grid. Both are the sort of thing that ships unnoticed
 * and is then found by a user, so they are errors, not warnings.
 */
const orphanBlocks = catalogIds.filter((id) => !sourceIds.includes(id))
const orphanSources = sourceIds.filter((id) => !catalogIds.includes(id))

if (orphanBlocks.length || orphanSources.length) {
  const lines = ['build-block-sources: catalog and sources/ are out of sync.']
  if (orphanBlocks.length) {
    lines.push(`  in catalog.ts with no sources/<id>.tsx: ${orphanBlocks.join(', ')}`)
  }
  if (orphanSources.length) {
    lines.push(`  in sources/ with no catalog.ts entry:   ${orphanSources.join(', ')}`)
  }
  throw new Error(lines.join('\n'))
}

/* ------------------------------------------------------------------ *
 *  Emit
 * ------------------------------------------------------------------ */

const sources = {}
const stats = {}

for (const id of catalogIds) {
  const source = readFileSync(join(sourcesDir, `${id}.tsx`), 'utf8')

  sources[id] = [
    {
      // Relative to wherever the user drops it. `components/` is the
      // convention every framework's docs assume, so it is the least
      // surprising default for a copy target.
      path: `components/${id}.tsx`,
      lang: 'tsx',
      source,
    },
  ]

  stats[id] = source.split('\n').length
}

writeFileSync(
  join(blocksDir, 'generated-block-sources.json'),
  `${JSON.stringify(sources, null, 0)}\n`,
)
writeFileSync(
  join(blocksDir, 'generated-block-stats.json'),
  `${JSON.stringify(stats, null, 2)}\n`,
)

const bytes = Object.values(sources).reduce((n, files) => n + files[0].source.length, 0)
console.log(
  `build-block-sources: ${catalogIds.length} blocks, ${(bytes / 1024).toFixed(1)} KB of source inlined`,
)
