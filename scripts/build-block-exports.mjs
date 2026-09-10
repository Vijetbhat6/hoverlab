/**
 * block id -> the symbol its source file actually exports.
 *
 * WHY THIS FILE EXISTS
 *
 * /builder composes chosen blocks into a real page source, and a generated
 * page has to import each block by its true export name:
 *
 *   import { HeroSplit } from '@/components/hero-split'
 *
 * The obvious shortcut is to PascalCase the id, and it is wrong. 249 of the
 * 250 blocks follow that convention and `empty-state-cta` exports
 * `EmptyState`, so the shortcut generates one page in the catalog that does
 * not compile — the single worst failure mode for this feature, because the
 * builder's whole promise is that what it hands you runs.
 *
 * One exception is enough to make the convention a guess rather than a rule,
 * and the next block someone adds could be the second.
 *
 * WHY IT READS registry.tsx
 *
 * `registry.tsx` is already the authority on id -> component: it is what
 * renders every preview in the grid, on the detail page and inside the
 * builder itself. Deriving the export name from anywhere else would create a
 * second mapping that can disagree with the one the user is looking at, and
 * a builder whose preview and whose generated import disagree is worse than
 * one that has neither.
 *
 * Each mapping is then verified against the block's own source, so a symbol
 * that registry.tsx imports but the source does not export fails the build
 * here rather than in the user's project.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const BLOCKS_DIR = join(ROOT, 'src', 'lib', 'blocks')
const REGISTRY = join(BLOCKS_DIR, 'registry.tsx')
const SOURCES = join(BLOCKS_DIR, 'sources')
const OUT = join(BLOCKS_DIR, 'generated-block-exports.json')

const registry = readFileSync(REGISTRY, 'utf8')

/*
 * The import list gives symbol -> file, and the map body gives id -> symbol.
 * Both are parsed because they are the two halves that can drift from each
 * other: an import renamed without its map entry, or the reverse.
 */
const importedFrom = new Map()
for (const m of registry.matchAll(
  /import \{\s*([A-Za-z0-9_]+)\s*\} from '\.\/sources\/([a-z0-9-]+)'/g,
)) {
  importedFrom.set(m[1], m[2])
}

/*
 * Props are captured, not merely tolerated. Seven blocks are registered as
 * `<CartDrawer embedded />` — overlays and drawers that portal or fix
 * themselves to the viewport, handed a prop that renders them in place so a
 * preview card can show one at all.
 *
 * An earlier version of this regex demanded a bare `<Symbol />` and quietly
 * emitted 243 of 250. That is this script's own failure mode one level up:
 * seven blocks missing from the builder, nothing going red. Hence permissive
 * about what sits inside the tag, and strict about the count.
 */
const entries = {}
const previewProps = {}
for (const m of registry.matchAll(/^\s{2}'([a-z0-9-]+)':\s*<([A-Za-z0-9_]+)([^>]*)\/>,$/gm)) {
  const [, id, symbol, props] = m
  entries[id] = symbol
  const trimmed = props.trim()
  if (trimmed) previewProps[id] = trimmed
}

const ids = Object.keys(entries)

if (ids.length === 0) {
  throw new Error(
    'build-block-exports: parsed 0 entries out of blocks/registry.tsx — has its shape changed?',
  )
}

/*
 * Every key in the map body must have produced an entry. A key matching the
 * loose `'id':` shape but not the full element shape is a registry line this
 * script does not understand, and guessing is what it exists to stop.
 */
const allKeys = [...registry.matchAll(/^\s{2}'([a-z0-9-]+)':/gm)].map((m) => m[1])
const unparsed = allKeys.filter((id) => !(id in entries))
if (unparsed.length) {
  throw new Error(
    `build-block-exports: ${unparsed.length} registry entries did not parse: ${unparsed.join(', ')}`,
  )
}

/* ------------------------------------------------------------------ *
 *  Verify every mapping against the file it names
 * ------------------------------------------------------------------ */

const problems = []

for (const [id, symbol] of Object.entries(entries)) {
  const file = importedFrom.get(symbol)

  if (!file) {
    problems.push(`  '${id}' renders <${symbol} />, which registry.tsx never imports`)
    continue
  }

  // A block whose map key and import path disagree would generate an import
  // pointing at the wrong file — it compiles, and renders the wrong section.
  if (file !== id) {
    problems.push(`  '${id}' renders <${symbol} />, imported from './sources/${file}'`)
    continue
  }

  const path = join(SOURCES, `${id}.tsx`)
  if (!existsSync(path)) {
    problems.push(`  '${id}' has no sources/${id}.tsx`)
    continue
  }

  const source = readFileSync(path, 'utf8')
  const exported =
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${symbol}\\b`).test(source) ||
    new RegExp(`export\\s+(?:const|let|class)\\s+${symbol}\\b`).test(source) ||
    new RegExp(`export\\s*\\{[^}]*\\b${symbol}\\b[^}]*\\}`).test(source)

  if (!exported) {
    problems.push(`  '${id}' — sources/${id}.tsx does not export ${symbol}`)
  }
}

if (problems.length) {
  throw new Error(
    ['build-block-exports: registry.tsx and sources/ disagree.', ...problems].join('\n'),
  )
}

writeFileSync(OUT, `${JSON.stringify({ exports: entries, previewProps }, null, 2)}\n`)

const derived = ids.filter(
  (id) => entries[id] === id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
).length

console.log(
  `build-block-exports: ${ids.length} blocks, ${ids.length - derived} that PascalCase would have got wrong, ` +
    `${Object.keys(previewProps).length} previewed with props`,
)
