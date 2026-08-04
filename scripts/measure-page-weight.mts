// Measure the JavaScript each page actually downloads, from a production
// build. `next build` reports bundle sizes but not what a given route
// pulls in transitively, which is the number that matters when one shared
// component drags a 772 KB data module into 4,000 pages.
//
// Usage: npx next start -p 3005 &  npx tsx scripts/measure-page-weight.mts

import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3005'

const PAGES: Array<[string, string]> = [
  ['landing            /', '/'],
  ['category index     /category', '/category'],
  ['category hub       /category/buttons', '/category/buttons'],
  ['effect detail      /effect/btn-neon', '/effect/btn-neon'],
  ['library            /library', '/library'],
]

const browser = await chromium.launch()
const rows: Array<{ page: string; js: number; total: number; files: number }> = []

for (const [label, path] of PAGES) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  let js = 0
  let total = 0
  let files = 0
  page.on('response', async (res) => {
    try {
      const url = res.url()
      const buf = await res.body().catch(() => null)
      if (!buf) return
      total += buf.length
      if (/\.js(\?|$)/.test(url) || res.headers()['content-type']?.includes('javascript')) {
        js += buf.length
        files++
      }
    } catch {
      /* response body unavailable (redirect, cached) — ignore */
    }
  })

  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  rows.push({ page: label, js, total, files })
  await ctx.close()
}

await browser.close()

const kb = (n: number) => (n / 1024).toFixed(0).padStart(6) + ' KB'
console.log('page                                     JS      total   files')
for (const r of rows) {
  console.log(`${r.page.padEnd(38)} ${kb(r.js)} ${kb(r.total)}  ${String(r.files).padStart(4)}`)
}
