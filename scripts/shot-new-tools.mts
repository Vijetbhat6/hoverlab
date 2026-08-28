// Screenshot the three tools added in this wave, in both themes.
//
// The tools are the site's acquisition surface and every one of them is a
// live preview, so "it returns 200" is not evidence that it works — a
// spinner that does not spin, a palette that repaints nothing and an SVG
// preview that renders blank all serve a perfectly healthy page.
//
// Console errors and page errors are collected as well as pixels: a
// dangerouslySetInnerHTML preview fails silently in the DOM and loudly in
// the console.
//
// Usage: BASE=http://localhost:3007 npx tsx scripts/shot-new-tools.mts [outDir]

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE ?? 'http://localhost:3002'
const OUT = process.argv[2] ?? 'tool-results/new-tools'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const problems: string[] = []

for (const theme of ['light', 'dark'] as const) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
    colorScheme: theme,
  })
  // The first-visit ladder tour opens a dialog over whichever tool loads
  // first, and its backdrop dims the top 1600px of a full-page shot — which
  // reads as a rendering bug in the review rather than as a modal.
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
    } catch {
      /* private mode — the tour will open and the shot will show it */
    }
  })

  const page = await context.newPage()
  page.on('pageerror', (e) => problems.push(`[${theme}] pageerror: ${e}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${theme}] console: ${m.text()}`)
  })

  for (const path of ['/tools/svg', '/tools/palette-preview', '/tools/loader']) {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    const label = path.split('/').pop()
    await page.screenshot({
      path: join(OUT, `${label}-${theme}.png`),
      fullPage: true,
    })
    console.log(`${path} [${theme}] → ${res?.status()}`)
  }

  await context.close()
}

await browser.close()

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`)
  for (const problem of problems) console.log('  ' + problem)
  process.exitCode = 1
} else {
  console.log('\nNo console or page errors.')
}
