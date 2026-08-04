// Screenshot every category hub so a generation wave can be eyeballed.
//
// Slugs are derived from CATEGORIES, not listed here. The previous version
// hardcoded 25 of them and silently skipped the seven categories added
// after it was written — the same staleness bug the motion test had, and
// the reason both now read the catalog instead of a maintained list.
//
// The hubs interleave by generator template, so one instance of every
// template in a category lands in the first rows. That makes this the
// cheapest way to review a whole wave.
//
// Usage: npx tsx scripts/shot-categories.mts [outDir]

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORIES, categorySlug } from '../src/lib/effect-types.ts'

const BASE = process.env.BASE ?? 'http://localhost:3002'
const OUT = process.argv[2] ?? 'tool-results/categories'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } })
const problems: string[] = []
page.on('pageerror', (e) => problems.push(`pageerror: ${e}`))
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console: ${m.text()}`)
})

const targets = [
  { label: 'category-index', path: '/category' },
  ...CATEGORIES.map((c) => ({ label: categorySlug(c), path: `/category/${categorySlug(c)}` })),
]

for (const { label, path } of targets) {
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' })
  const status = res?.status() ?? 0
  await page.waitForTimeout(650)
  await page.screenshot({ path: join(OUT, `${label}.png`) })
  if (status !== 200) problems.push(`${status} ${path}`)
  console.log(`${status}  ${path}`)
}

await browser.close()
console.log(
  problems.length ? `\nProblems:\n  ${problems.join('\n  ')}` : `\n${targets.length} pages, no errors.`,
)
if (problems.length) process.exit(1)
