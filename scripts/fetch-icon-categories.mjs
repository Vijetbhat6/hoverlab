/**
 * Snapshot Lucide's own icon categories.
 *
 * `lucide-react` ships geometry but no taxonomy. The categories live in
 * Lucide's repository and are served from lucide.dev, so the Figma icon sheets
 * (`build-icon-sheets.mts`) use THEIR grouping rather than a hand-sorted one:
 * sorting 1,500 icons by eye produces 1,500 opinions, and the sheets are only
 * worth having if "Arrows" means what Lucide's own site means by it.
 *
 * ── WHY IT IS A SNAPSHOT AND NOT A BUILD STEP ───────────────────────────
 *
 * A deploy must not depend on lucide.dev being up, and a category moving
 * upstream must not silently reshuffle a shipped file. So this runs by hand
 * (`npm run fetch:icon-categories`) and the result is committed.
 *
 * ── WHAT IS LEFT OUT, AND WHY IT IS RECORDED ────────────────────────────
 *
 * The live API describes a newer Lucide than the one installed. Some icons
 * that are still in `node_modules` have been deprecated upstream and no longer
 * carry a category: the brand marks (github, twitter, chrome, slack…), which
 * Lucide removed, and icons it renamed (`trash-2` → `trash`, `align-left` →
 * `text-align-start`). They are not duplicates — the drawings differ — but the
 * current name for each is in the categorised set, and redistributing
 * trademarks as a free asset is not something to do by accident.
 *
 * Those slugs are stored as `excluded`. The sheet builder requires the
 * installed uncategorised set to EQUAL this list, so upgrading lucide-react
 * without refreshing the snapshot fails the build instead of quietly dropping
 * new icons. Aliases (`alert-circle` re-exporting `circle-alert`) are skipped
 * outright: a designer should not get one drawing under two names.
 */

import { createRequire } from 'node:module'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'src/lib/assets/lucide-categories.snapshot.json')
const SOURCE = 'https://lucide.dev/api/categories'

const LUCIDE_DIR = path.dirname(require.resolve('lucide-react/package.json'))
const ICON_DIR = path.join(LUCIDE_DIR, 'dist/esm/icons')
const { version } = JSON.parse(await readFile(path.join(LUCIDE_DIR, 'package.json'), 'utf8'))

function fail(message) {
  console.error(`fetch-icon-categories: ${message}`)
  process.exit(1)
}

/** Slugs of icons that carry their own drawing, as opposed to re-exporting one. */
async function installedRealIcons() {
  const files = (await readdir(ICON_DIR)).filter((f) => f.endsWith('.js') && f !== 'index.js')
  const real = []
  for (const file of files) {
    const source = await readFile(path.join(ICON_DIR, file), 'utf8')
    if (source.includes('createLucideIcon(')) real.push(file.slice(0, -3))
  }
  return real.sort()
}

const response = await fetch(SOURCE)
if (!response.ok) fail(`${SOURCE} answered ${response.status}`)
const upstream = await response.json()
if (typeof upstream !== 'object' || upstream === null || Array.isArray(upstream)) {
  fail('the categories endpoint did not return a slug → categories object')
}

const real = await installedRealIcons()
const categories = {}
const excluded = []
for (const slug of real) {
  const list = upstream[slug]
  if (Array.isArray(list) && list.length > 0) categories[slug] = [...list].sort()
  else excluded.push(slug)
}

if (Object.keys(categories).length < 1000) {
  fail(`only ${Object.keys(categories).length} icons matched — the endpoint's shape has probably changed`)
}

const snapshot = {
  source: SOURCE,
  fetchedAt: new Date().toISOString().slice(0, 10),
  lucideVersion: version,
  note: 'Lucide categories for the icons installed at lucideVersion. `excluded` are real icons upstream no longer categorises (deprecated brand marks and renamed icons); the sheet builder requires it to match the installed set exactly.',
  excluded,
  categories,
}

await writeFile(OUT, JSON.stringify(snapshot, null, 1) + '\n')
console.log(
  `fetch-icon-categories: ${Object.keys(categories).length} icons, ` +
    `${new Set(Object.values(categories).flat()).size} categories, ` +
    `${excluded.length} excluded -> ${path.relative(ROOT, OUT)}`,
)
