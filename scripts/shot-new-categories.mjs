// Screenshot every category hub so new templates can be eyeballed.
// Usage: node scripts/shot-new-categories.mjs [outDir]
//
// The hubs interleave by generator template, so one instance of every
// template in a category lands in the first rows — which makes this the
// cheapest way to review a whole generation wave.

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE ?? 'http://localhost:3002'
const OUT = process.argv[2] ?? 'tool-results/new-categories'

mkdirSync(OUT, { recursive: true })

const SLUGS = [
  'buttons', 'loaders', 'cards', 'text', 'backgrounds',
  'inputs-hover', 'navigation-menus', 'dividers-separators', 'badges-tags',
  'toggles-switches', 'tooltips-popovers', 'skeletons-shimmers',
  'entrance-animations', 'borders-outlines', 'progress-meters',
  'avatars-images', 'modals-overlays', 'alerts-toasts', 'accordions-tabs',
  '3d-perspective', 'glow-neon', 'patterns-textures', 'masks-clip-paths',
  'charts-data', 'timelines-steps',
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

const res0 = await page.goto(`${BASE}/category`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, 'category-index.png') })
console.log(`${res0.status()}  /category`)

for (const slug of SLUGS) {
  const res = await page.goto(`${BASE}/category/${slug}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(650)
  await page.screenshot({ path: join(OUT, `${slug}.png`) })
  console.log(`${res.status()}  /category/${slug}`)
}

await browser.close()
console.log(errors.length ? `\nErrors:\n  ${errors.join('\n  ')}` : '\nNo page errors.')
