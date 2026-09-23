/**
 * Build the Figma icon sheets: one SVG per Lucide category, in
 * `public/figma/icons/`, plus a manifest the /figma page reads.
 *
 * Unlike the block kit (`build-figma-kit.mts`, a browser crawl run by hand)
 * this is pure geometry-in, SVG-out: no Chromium, no dev server, byte-for-byte
 * deterministic. That is why it lives in `prebuild` and the kit does not — the
 * sheets cannot fall behind, because every build regenerates them.
 *
 * ── THE GATE THAT MATTERS ───────────────────────────────────────────────
 *
 * The category snapshot (`fetch-icon-categories.mjs`) records which installed
 * icons upstream no longer categorises. This script requires the installed
 * set to EQUAL that list. Upgrade lucide-react without refreshing the snapshot
 * and the build stops here, naming the icons — the alternative is a new icon
 * that simply never appears in any sheet, which nobody would ever report.
 */

import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  buildSampleSvg,
  buildSheet,
  categoryLabel,
  orderCategories,
  sheetFileName,
  type IconNode,
  type SheetIcon,
} from '../src/lib/assets/icon-sheets.ts'
import { ICON_GEOMETRY } from '../src/lib/assets/animated-icons.ts'

const require = createRequire(import.meta.url)
const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public', 'figma', 'icons')
const SNAPSHOT = join(ROOT, 'src', 'lib', 'assets', 'lucide-categories.snapshot.json')

const LUCIDE_DIR = dirname(require.resolve('lucide-react/package.json'))
const ICON_DIR = join(LUCIDE_DIR, 'dist', 'esm', 'icons')
const SAMPLE_SIZE = 8

function fail(message: string): never {
  console.error(`build-icon-sheets: ${message}`)
  process.exit(1)
}

interface Snapshot {
  fetchedAt: string
  lucideVersion: string
  excluded: string[]
  categories: Record<string, string[]>
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as Snapshot
const installedVersion = (
  JSON.parse(readFileSync(join(LUCIDE_DIR, 'package.json'), 'utf8')) as { version: string }
).version

if (snapshot.lucideVersion !== installedVersion) {
  fail(
    `the category snapshot is for lucide-react ${snapshot.lucideVersion} but ${installedVersion} is installed.\n` +
      '  Refresh it:  npm run fetch:icon-categories',
  )
}

/** Real icons only: an alias re-exports another file and would be a duplicate drawing. */
const real: string[] = []
for (const file of readdirSync(ICON_DIR)) {
  if (!file.endsWith('.js') || file === 'index.js') continue
  if (readFileSync(join(ICON_DIR, file), 'utf8').includes('createLucideIcon(')) real.push(file.slice(0, -3))
}
real.sort()

// The gate: what is installed and uncategorised must be exactly what was ruled out.
const uncategorised = real.filter((slug) => !(slug in snapshot.categories))
const missing = uncategorised.filter((s) => !snapshot.excluded.includes(s))
const stale = snapshot.excluded.filter((s) => !uncategorised.includes(s))
if (missing.length > 0 || stale.length > 0) {
  fail(
    'the installed icons no longer match the category snapshot.\n' +
      (missing.length ? `  installed but neither categorised nor excluded (${missing.length}): ${missing.slice(0, 12).join(', ')}\n` : '') +
      (stale.length ? `  excluded but no longer uncategorised (${stale.length}): ${stale.slice(0, 12).join(', ')}\n` : '') +
      '  Refresh it:  npm run fetch:icon-categories',
  )
}
for (const slug of Object.keys(snapshot.categories)) {
  if (!real.includes(slug)) fail(`the snapshot lists "${slug}", which lucide-react does not contain`)
}

/** Geometry of one installed icon, read from the package's own module. */
async function loadIcon(slug: string): Promise<SheetIcon> {
  const loaded = (await import(pathToFileURL(join(ICON_DIR, `${slug}.js`)).href)) as {
    __iconNode?: IconNode[]
  }
  if (!Array.isArray(loaded.__iconNode) || loaded.__iconNode.length === 0) {
    fail(`${slug}.js exports no geometry`)
  }
  return { slug, nodes: loaded.__iconNode }
}

const icons = new Map<string, SheetIcon>()
for (const slug of Object.keys(snapshot.categories)) icons.set(slug, await loadIcon(slug))

// Group by category. An icon in several categories appears in each sheet, as it
// does on Lucide's own site.
const byCategory = new Map<string, SheetIcon[]>()
for (const [slug, cats] of Object.entries(snapshot.categories)) {
  for (const cat of cats) {
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(icons.get(slug)!)
  }
}
for (const list of byCategory.values()) list.sort((a, b) => a.slug.localeCompare(b.slug))

const licence = readFileSync(join(LUCIDE_DIR, 'LICENSE'), 'utf8')
// The recognisable icons first: a sample strip of `a-arrow-down, a-large-small…`
// is a poor advertisement for a category, and the curated browser set is
// exactly the list of icons people look for.
const curated = new Set(ICON_GEOMETRY.map((i) => i.slug))

mkdirSync(OUT_DIR, { recursive: true })

const files: {
  category: string
  slug: string
  label: string
  file: string
  icons: number
  bytes: number
  sample: string
}[] = []

const categories = orderCategories([...byCategory.keys()])
for (const category of categories) {
  const list = byCategory.get(category)!
  const label = `Lucide icons / ${categoryLabel(category)}`
  const svg = buildSheet(list, { name: label, license: licence })
  const file = sheetFileName(category)
  writeFileSync(join(OUT_DIR, file), svg)

  const sample = [...list.filter((i) => curated.has(i.slug)), ...list.filter((i) => !curated.has(i.slug))]
    .slice(0, SAMPLE_SIZE)
  files.push({
    category: categoryLabel(category),
    slug: category,
    label,
    file,
    icons: list.length,
    bytes: Buffer.byteLength(svg),
    sample: buildSampleSvg(sample),
  })
}

// A category Lucide dropped must not leave its old sheet behind to be served.
const keep = new Set(files.map((f) => f.file))
for (const name of readdirSync(OUT_DIR)) {
  if (name.startsWith('lucide-') && name.endsWith('.svg') && !keep.has(name)) {
    rmSync(join(OUT_DIR, name))
    console.log(`build-icon-sheets: removed stale ${name}`)
  }
}

// Every categorised icon must be somewhere a designer can find it.
const placed = new Set(files.length ? [...byCategory.values()].flat().map((i) => i.slug) : [])
const lost = [...icons.keys()].filter((s) => !placed.has(s))
if (lost.length > 0) fail(`${lost.length} icons ended up in no sheet: ${lost.slice(0, 8).join(', ')}`)

const placements = files.reduce((n, f) => n + f.icons, 0)
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify(
    {
      generator: 'scripts/build-icon-sheets.mts',
      source: 'lucide-react',
      lucideVersion: installedVersion,
      categoriesFetchedAt: snapshot.fetchedAt,
      license: 'ISC — https://lucide.dev/license',
      icons: icons.size,
      placements,
      excluded: snapshot.excluded.length,
      note:
        'Strokes, not outlined shapes: select icons in Figma and change stroke colour or weight in one go. ' +
        'Each icon is a named group with a transparent 24x24 bounds rectangle. Not components, no variants.',
      files,
    },
    null,
    1,
  ) + '\n',
)
writeFileSync(join(OUT_DIR, 'LICENSE.txt'), licence)

const totalBytes = files.reduce((n, f) => n + f.bytes, 0)
console.log(
  `build-icon-sheets: ${icons.size} icons, ${files.length} categories, ` +
    `${placements} placements, ${(totalBytes / 1024 / 1024).toFixed(2)} MB ` +
    `(${snapshot.excluded.length} deprecated icons left out) -> public/figma/icons/`,
)
if (!existsSync(join(OUT_DIR, 'manifest.json'))) fail('manifest was not written')
