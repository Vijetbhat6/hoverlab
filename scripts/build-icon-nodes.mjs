/**
 * Icon geometry for the animated-icon set.
 *
 * `/tools/icons` is a React grid: it imports 180 Lucide *components* and
 * renders them. That is the right shape for a browser and the wrong shape
 * for `/assets/animated-icons`, which has to emit a standalone `.svg` file,
 * a JSX component and a stylesheet — all of which need the icon's actual
 * geometry as data, on the server, with no React in the loop.
 *
 * So this script reads the geometry out of the installed package and writes
 * it next to the generator. Two decisions worth keeping:
 *
 * 1. **The icon list is parsed out of the tool page, not re-typed here.**
 *    The whole claim of the animated set is that it is the icon browser
 *    crossed with the motion families — a second hand-kept list of 180 names
 *    would make that false within one edit. The page is the source; this
 *    follows it.
 *
 * 2. **Export names are resolved through Lucide's own barrel**, not by
 *    kebab-casing the component name. `BarChart3` is `bar-chart-3.js`,
 *    `Grid3x3` is `grid3x3.js` and `LinkIcon` is `link.js` — three different
 *    rules, and every naive transform gets at least one of them wrong. The
 *    barrel states the mapping outright, so it is read rather than guessed.
 *
 * Lucide is ISC-licensed, which permits redistribution with the notice. The
 * notice travels in the generated file and is rendered on the family page.
 */

import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = process.cwd()
const TOOL_PAGE = path.join(ROOT, 'src/app/tools/icons/page.tsx')
const OUT = path.join(ROOT, 'src/lib/assets/generated-icon-nodes.json')

const LUCIDE_DIR = path.dirname(require.resolve('lucide-react/package.json'))
const BARREL = path.join(LUCIDE_DIR, 'dist/esm/lucide-react.js')

function fail(message) {
  console.error(`build-icon-nodes: ${message}`)
  process.exit(1)
}

/** `{ name: 'Bell', Icon: Bell, keywords: 'alert' }` → `{ name, keywords }`. */
function parseToolPage(source) {
  const start = source.indexOf('const ICONS: Entry[] = [')
  if (start === -1) fail('no `const ICONS: Entry[] = [` in the icons tool page')
  const body = source.slice(start)
  const entries = []
  const re = /\{\s*name:\s*'([^']+)',\s*Icon:\s*[A-Za-z0-9_]+\s*(?:,\s*keywords:\s*'([^']*)')?\s*\}/g
  let m
  while ((m = re.exec(body))) entries.push({ name: m[1], keywords: m[2] ?? '' })
  return entries
}

/** Lucide's barrel: `export { default as Bell, ... } from './icons/bell.js'`. */
function parseBarrel(source) {
  const map = new Map()
  const re = /export\s*\{([^}]*)\}\s*from\s*'\.\/icons\/([a-z0-9-]+)\.js'/g
  let m
  while ((m = re.exec(source))) {
    const file = m[2]
    for (const clause of m[1].split(',')) {
      const as = clause.split(/\s+as\s+/)
      const exported = (as[1] ?? as[0]).trim()
      if (exported) map.set(exported, file)
    }
  }
  return map
}

const [toolSource, barrelSource, pkg] = await Promise.all([
  readFile(TOOL_PAGE, 'utf8'),
  readFile(BARREL, 'utf8'),
  readFile(path.join(LUCIDE_DIR, 'package.json'), 'utf8'),
])

const entries = parseToolPage(toolSource)
if (entries.length < 100) fail(`parsed only ${entries.length} icons from the tool page — the array shape changed`)

const files = parseBarrel(barrelSource)
if (files.size < 1000) fail(`parsed only ${files.size} exports from lucide's barrel — its shape changed`)

const icons = []
const missing = []

for (const entry of entries) {
  const file = files.get(entry.name)
  if (!file) {
    missing.push(entry.name)
    continue
  }
  const mod = await import(pathToFileURL(path.join(LUCIDE_DIR, 'dist/esm/icons', `${file}.js`)).href)
  const node = mod.__iconNode
  if (!Array.isArray(node) || node.length === 0) {
    missing.push(`${entry.name} (no __iconNode)`)
    continue
  }
  icons.push({
    name: entry.name,
    /** The Lucide file stem — also the stable slug, since it is Lucide's own. */
    slug: file,
    keywords: entry.keywords,
    // `key` is React bookkeeping from Lucide's own renderer and means nothing
    // in a serialised file. Dropping it here keeps the emitters from having to
    // filter it out in four places.
    nodes: node.map(([tag, attrs]) => {
      const rest = { ...attrs }
      delete rest.key
      return [tag, rest]
    }),
  })
}

if (missing.length) fail(`could not resolve geometry for: ${missing.join(', ')}`)

const payload = {
  generatedAt: new Date().toISOString(),
  generator: 'scripts/build-icon-nodes.mjs',
  source: 'src/app/tools/icons/page.tsx',
  license: 'Lucide icons — ISC. https://lucide.dev/license',
  lucideVersion: JSON.parse(pkg).version,
  count: icons.length,
  icons,
}

await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`build-icon-nodes: wrote ${icons.length} icons from lucide-react@${payload.lucideVersion}`)
