// Screenshot the effect detail page's new Code-tab sandbox row and the
// Insights tab. Usage: node scripts/shot-detail-insights.mjs [effectId]

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const ID = process.argv[2] ?? 'rose-neon-text-md-2093'
const OUT = 'tool-results/new-categories'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const res = await page.goto(`${BASE}/effect/${ID}`, { waitUntil: 'networkidle' })
console.log(`${res.status()}  /effect/${ID}`)
await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, 'detail-code-tab.png') })

await page.getByRole('tab', { name: /insights/i }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, 'detail-insights-tab.png'), fullPage: true })

await browser.close()
console.log(errors.length ? `Page errors:\n  ${errors.join('\n  ')}` : 'No page errors.')
