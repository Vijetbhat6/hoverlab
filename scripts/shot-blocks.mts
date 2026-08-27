// Screenshot block detail pages, light and dark, so a wave can be eyeballed
// before it is committed.
//
// This is the only check that catches what the build cannot: an invalid CSS
// colour (the `hsl(var(--primary))` trap — the tokens are `oklch()`, so the
// declaration is dropped and the component renders invisible), a label
// colliding with its own input, or a demo whose default state makes the
// controls look pointless. `tsc`, eslint, the registry check and the a11y
// audit all pass happily on every one of those.
//
// Both themes on purpose: the token bug above is usually visible in exactly
// one of them.
//
// Usage:
//   npx tsx scripts/shot-blocks.mts <id> [<id> …]     specific blocks
//   npx tsx scripts/shot-blocks.mts --all             every block
//   BASE=http://localhost:3007 OUT=tool-results/blocks npx tsx scripts/…
//
// Must run from the repo root — playwright resolves from ./node_modules.

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const OUT = process.env.OUT ?? 'tool-results/blocks'
// Short blocks (bars, footers) sit higher on the page than sections do.
const SCROLL = Number(process.env.SCROLL ?? 760)

const args = process.argv.slice(2)
const ids = args.includes('--all')
  ? BLOCK_CATALOG.map((b) => b.id)
  : args.filter((a) => !a.startsWith('--'))

if (ids.length === 0) {
  console.error('Usage: npx tsx scripts/shot-blocks.mts <block-id> … | --all')
  process.exit(1)
}

const unknown = ids.filter((id) => !BLOCK_CATALOG.some((b) => b.id === id))
if (unknown.length > 0) {
  console.error(`Not in the catalog: ${unknown.join(', ')}`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const problems: string[] = []

for (const theme of ['light', 'dark'] as const) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } })
  // Both first-visit modals pre-dismissed. Clicking "Skip" works too, but it
  // races the hydration that renders it and fails about one run in five.
  await context.addInitScript(
    ([t]: string[]) => {
      window.localStorage.setItem('theme', t)
      window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
    },
    [theme],
  )

  const page = await context.newPage()
  page.on('pageerror', (e) => problems.push(`[${theme}] pageerror: ${e}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${theme}] console: ${m.text()}`)
  })

  for (const id of ids) {
    const res = await page.goto(`${BASE}/block/${id}`, { waitUntil: 'networkidle' })
    const status = res?.status() ?? 0
    if (status !== 200) {
      // `/block/[slug]` sets dynamicParams = false, so a block added in this
      // session 404s for 30–60s while the route regenerates. Poll rather
      // than concluding the registry is wrong.
      problems.push(`[${theme}] ${id}: HTTP ${status}`)
    }
    // Past the header and the copy bar, onto the live preview.
    await page.evaluate((y: number) => window.scrollBy(0, y), SCROLL)
    await page.waitForTimeout(700)
    await page.screenshot({ path: join(OUT, `${id}.${theme}.png`) })
    console.log(`${theme.padEnd(5)} ${id} ${status}`)
  }

  await context.close()
}

await browser.close()

if (problems.length > 0) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems) console.log(`  ${p}`)
  process.exit(1)
}
console.log(`\n${ids.length} blocks × 2 themes -> ${OUT}`)
