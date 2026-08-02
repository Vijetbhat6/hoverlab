// Contact sheet for a generation wave.
//
// Picks ONE effect per generator template (templates are identified by the
// `fx-<template>-<variant>-<seq>` class prefix), lays them out in a grid,
// and screenshots it. Reviewing a wave otherwise means paging through 25
// category hubs and scrolling past the variants of everything already
// shipped.
//
// Usage: node scripts/shot-templates.mjs <prefix,prefix,…> [outName]
//   node scripts/shot-templates.mjs mb,ml,mc,mt,mg,mi,mn,md,mbg  wave3a

import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'tool-results', 'templates')
mkdirSync(OUT, { recursive: true })

const prefixes = (process.argv[2] ?? '').split(',').filter(Boolean)
const outName = process.argv[3] ?? 'contact-sheet'
if (!prefixes.length) {
  console.error('Usage: node scripts/shot-templates.mjs <prefix,prefix,…> [outName]')
  process.exit(1)
}

const effects = JSON.parse(
  readFileSync(join(ROOT, 'src', 'lib', 'generated-effects.json'), 'utf8'),
)

/** `fx-mb-sheen-ocean-0142` -> `mb-sheen`. */
function templateKey(effect) {
  const m = /\.fx-([a-z0-9]+-[a-z0-9]+)/.exec(effect.css)
  return m ? m[1] : null
}

const seen = new Set()
const picks = []
for (const e of effects) {
  const key = templateKey(e)
  if (!key || seen.has(key)) continue
  if (!prefixes.some((p) => key.startsWith(p + '-'))) continue
  seen.add(key)
  picks.push({ ...e, key })
}

if (!picks.length) {
  console.error(`No templates matched: ${prefixes.join(', ')}`)
  process.exit(1)
}

const cells = picks
  .map(
    (e) => `<figure>
  <div class="stage">${e.html}</div>
  <figcaption><b>${e.name}</b><span>${e.category} &middot; ${e.key}</span></figcaption>
</figure>`,
  )
  .join('\n')

const doc = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
* { box-sizing: border-box; }
body {
  margin: 0; padding: 24px; background: #020617;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
figure { margin: 0; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; background: #0b1120; }
.stage { display: grid; place-items: center; min-height: 190px; padding: 22px; overflow: hidden; }
figcaption { padding: 8px 10px; border-top: 1px solid #1e293b; }
figcaption b { display: block; font-size: 12px; color: #e2e8f0; }
figcaption span { font-size: 10px; color: #64748b; }
${picks.map((e) => e.css).join('\n')}
</style></head><body>
${cells}
</body></html>`

const htmlPath = join(OUT, `${outName}.html`)
writeFileSync(htmlPath, doc)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: join(OUT, `${outName}.png`), fullPage: true })
await browser.close()

console.log(`${picks.length} templates -> tool-results/templates/${outName}.png`)
for (const e of picks) console.log(`  ${e.key.padEnd(16)} ${e.category.padEnd(22)} ${e.name}`)
console.log(errors.length ? `Errors: ${errors.join(' | ')}` : 'No page errors.')
