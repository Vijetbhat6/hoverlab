// Contact-sheet render harness for a v14 wave module.
//
//   node sheet.mjs <module-path> <exportName> [outDir]
//
// Loads the module with a stub ctx (same cls/mk/add contract as
// scripts/generate-effects.mjs), renders every effect it adds into a
// 300x180 dark cell, screenshots a rest pass and a hover pass, and
// reports geometry defects.
//
// Calibrated against effect-card.tsx: the library grid preview is 160px
// tall with 128px of content and hard-clips, but the DETAIL preview
// (effect-static-card.tsx) is min-h-[180px] and never clips, and 29% of
// the shipped catalog is taller than 128px. So only flag a root above
// ~180px.

import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const [modPath, exportName, outDirArg] = process.argv.slice(2)
if (!modPath || !exportName) {
  console.error('usage: node sheet.mjs <module-path> <exportName> [outDir]')
  process.exit(2)
}
const outDir = outDirArg || path.join(path.dirname(modPath), '_sheet')
fs.mkdirSync(outDir, { recursive: true })

/* ---- stub ctx, mirroring scripts/generate-effects.mjs ---- */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
let _seq = 5000
const seq = () => String(++_seq).padStart(4, '0')
const cls = (s) => `fx-${slug(s)}-${seq()}`
const effects = []
const add = (e) => effects.push(e)
const mk = ({ name, category, description, html, css, tags = [], darkSurface = true, previewClass }) => ({
  id: slug(name) + '-' + seq(), name, category, description, html, css, tags, darkSurface, previewClass, generated: true,
})

const mod = await import(pathToFileURL(path.resolve(modPath)).href)
const fn = mod[exportName]
if (typeof fn !== 'function') {
  console.error(`export ${exportName} not found in ${modPath}; has: ${Object.keys(mod).join(', ')}`)
  process.exit(2)
}
fn({ cls, mk, add })

console.log(`${effects.length} effects from ${exportName}`)

/* ---- static audit (cheap, runs before the browser) ---- */
const staticIssues = []
for (const e of effects) {
  const rootClass = (e.html.match(/class="([^"]+)"/) || [])[1]?.split(/\s+/)[0]
  if (!rootClass) staticIssues.push(`${e.name}: no class on root element`)
  else {
    const rootRule = new RegExp(`\\.${rootClass}\\s*\\{([^}]*)\\}`).exec(e.css)
    if (!rootRule) staticIssues.push(`${e.name}: no CSS rule for root .${rootClass}`)
    else if (/position:\s*absolute|position:\s*fixed/.test(rootRule[1]))
      staticIssues.push(`${e.name}: root is position:absolute/fixed`)
  }
  if (!e.description || e.description.length < 30) staticIssues.push(`${e.name}: description too short`)
  if (!Array.isArray(e.tags) || e.tags.length < 2) staticIssues.push(`${e.name}: needs >= 2 tags`)
  // delayed keyframe copies must be invisible in their base state
  const delayed = [...e.css.matchAll(/animation:[^;]*?\s(\d+(?:\.\d+)?)s\s+(?:[a-z-]+\s+)*?(?:[-\d.]+s)/g)]
  void delayed
}

/* ---- render pass ---- */
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 })

const rows = []
for (const e of effects) {
  await page.setContent(`<!doctype html><html><head><style>
    *,*::before,*::after{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#0b0f19}
    #cell{width:300px;height:180px;display:flex;align-items:center;justify-content:center;
          padding:16px;background:#0f172a;color:#e2e8f0;overflow:visible;
          font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    ${e.css}
  </style></head><body><div id="cell">${e.html}</div></body></html>`)
  // Park the pointer off the cell BEFORE measuring. setContent replaces the
  // DOM but not the pointer position, so without this every effect after the
  // first is measured and screenshotted in its hover state under the "rest"
  // name — which is exactly the state the rest pass exists to check.
  await page.mouse.move(900, 700)
  await page.waitForTimeout(400)

  const root = await page.evaluateHandle(() => document.querySelector('#cell')?.firstElementChild)
  const geo = await page.evaluate(() => {
    const cell = document.getElementById('cell')
    const el = cell.firstElementChild
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cr = cell.getBoundingClientRect()
    const cs = getComputedStyle(el)
    // does anything actually paint? sample the cell for non-background pixels
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      overflowL: Math.round(cr.left - r.left), overflowR: Math.round(r.right - cr.right),
      overflowT: Math.round(cr.top - r.top), overflowB: Math.round(r.bottom - cr.bottom),
      position: cs.position, opacity: cs.opacity, visibility: cs.visibility,
      display: cs.display, tag: el.tagName.toLowerCase(),
      kids: el.childElementCount,
    }
  })
  await root.dispose()

  const safe = slug(e.name)
  const restPath = path.join(outDir, `${safe}-rest.png`)
  await page.locator('#cell').screenshot({ path: restPath })

  // hover pass
  await page.locator('#cell').hover({ position: { x: 150, y: 90 } }).catch(() => {})
  await page.waitForTimeout(500)
  const hoverPath = path.join(outDir, `${safe}-hover.png`)
  await page.locator('#cell').screenshot({ path: hoverPath })

  // is the rest frame just flat background? (nothing painted)
  const flat = await page.evaluate(async () => {
    const cell = document.getElementById('cell')
    const el = cell.firstElementChild
    if (!el) return true
    const r = el.getBoundingClientRect()
    return r.width < 4 || r.height < 4
  })

  const problems = []
  if (!geo) problems.push('no root element rendered')
  else {
    if (geo.w < 4 || geo.h < 4) problems.push(`root is ${geo.w}x${geo.h} — invisible`)
    if (geo.position === 'absolute' || geo.position === 'fixed') problems.push(`root computed position:${geo.position}`)
    if (Number(geo.opacity) < 0.05) problems.push(`root opacity ${geo.opacity} at rest`)
    if (geo.visibility === 'hidden') problems.push('root visibility:hidden at rest')
    if (geo.h > 180) problems.push(`root ${geo.h}px tall — exceeds the 180px detail preview`)
    if (geo.overflowL > 2 || geo.overflowR > 2) problems.push(`overflows cell horizontally (L${geo.overflowL} R${geo.overflowR})`)
    if (geo.overflowT > 2 || geo.overflowB > 2) problems.push(`overflows cell vertically (T${geo.overflowT} B${geo.overflowB})`)
  }
  if (flat) problems.push('nothing painted at rest')

  rows.push({ name: e.name, category: e.category, geo, problems, restPath, hoverPath })
}

await browser.close()

/* ---- report ---- */
const bad = rows.filter((r) => r.problems.length)
console.log('\n--- static ---')
console.log(staticIssues.length ? staticIssues.map((s) => '  ! ' + s).join('\n') : '  clean')
console.log('\n--- render ---')
for (const r of rows) {
  const g = r.geo
  const size = g ? `${g.w}x${g.h}` : '??'
  console.log(`${r.problems.length ? '!' : ' '} ${r.category.padEnd(24)} ${r.name.padEnd(34)} ${size}`)
  for (const p of r.problems) console.log(`    -> ${p}`)
}
console.log(`\n${rows.length} rendered, ${bad.length} with problems, ${staticIssues.length} static issues`)
console.log(`PNGs in ${outDir}`)

// a contact sheet of every rest frame, for eyeballing
const sheet = rows.map((r) => `<figure><img src="${path.basename(r.restPath)}"><img src="${path.basename(r.hoverPath)}"><figcaption>${r.name}${r.problems.length ? ' — ' + r.problems.join('; ') : ''}</figcaption></figure>`).join('\n')
fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html><style>body{background:#0b0f19;color:#e2e8f0;font:13px system-ui;display:flex;flex-wrap:wrap;gap:12px}figure{margin:0}img{display:block;width:300px;border:1px solid #334155}figcaption{max-width:300px}</style>${sheet}`)

process.exit(bad.length || staticIssues.length ? 1 : 0)
