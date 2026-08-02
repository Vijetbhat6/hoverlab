// Screenshot the new category hubs + the effect detail Insights tab.
// Usage: node scripts/shot-new-categories.mjs [outDir]

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE ?? 'http://localhost:3002'
const OUT = process.argv[2] ?? 'tool-results/new-categories'

mkdirSync(OUT, { recursive: true })

const PAGES = [
  ['category-index', '/category'],
  ['3d-perspective', '/category/3d-perspective'],
  ['glow-neon', '/category/glow-neon'],
  ['charts-data', '/category/charts-data'],
  ['patterns-textures', '/category/patterns-textures'],
  ['progress-meters', '/category/progress-meters'],
  ['borders-outlines', '/category/borders-outlines'],
  ['timelines-steps', '/category/timelines-steps'],
  ['masks-clip-paths', '/category/masks-clip-paths'],
  ['modals-overlays', '/category/modals-overlays'],
  ['avatars-images', '/category/avatars-images'],
  ['alerts-toasts', '/category/alerts-toasts'],
  ['accordions-tabs', '/category/accordions-tabs'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

for (const [name, path] of PAGES) {
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false })
  console.log(`${res.status()}  ${path}`)
}

// Effect detail: open the Insights tab.
await page.goto(`${BASE}/library?filter=Glow%20%26%20Neon`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: join(OUT, 'library-chips.png') })

await browser.close()
if (errors.length) {
  console.log('\nPage errors:')
  for (const e of errors) console.log('  ' + e)
} else {
  console.log('\nNo page errors.')
}
