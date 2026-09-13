/**
 * Render every primitive and photograph it.
 *
 *   npx tsx scripts/shot-primitives.mts            # check + contact sheets
 *   npx tsx scripts/shot-primitives.mts --check    # check only, for the build
 *
 * WHY THIS EXISTS
 *
 * `npm test` proves the catalog is internally consistent and `tsc` proves
 * the components type-check. Neither draws anything. A primitive whose
 * demo throws on mount, whose Tailwind classes do not exist, or which
 * renders an empty box passes both and ships.
 *
 * A browser is the only thing that can answer "does it draw", and it does
 * not need the dev server: the demos are bundled with esbuild, the
 * stylesheet is compiled from the app's own `globals.css` through the same
 * Tailwind plugin Next uses, and Playwright renders the result. That makes
 * it runnable in CI and immune to whatever state a shared dev server is in.
 *
 * WHAT IT ASSERTS, per primitive and per theme
 *
 *   1. It mounts without throwing. Every console error and every unhandled
 *      rejection is collected and attributed.
 *   2. It draws something — measured as the rendered height and the pixel
 *      variance of its cell. A component that renders `null` or collapses
 *      to nothing is the failure this catches.
 *   3. Both themes. A control written against `bg-card` and `text-white`
 *      looks fine in one and is invisible in the other.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as esbuild from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { chromium } from 'playwright'

import { PRIMITIVE_CATALOG } from '../src/lib/primitives/catalog.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT_DIR = join(ROOT, 'tool-results', 'primitives')

const checkOnly = process.argv.includes('--check')

/* ------------------------------------------------------------------ *
 *  Bundle the demos
 * ------------------------------------------------------------------ */

/*
 * The registry maps ids to *elements*, which is what the site renders. The
 * harness wants the same thing, so it imports the same module rather than
 * re-deriving a list — a primitive missing from the registry shows up here
 * as a missing cell instead of as a passing test.
 */
const entry = `
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { PRIMITIVE_PREVIEWS } from ${JSON.stringify(join(ROOT, 'src/lib/primitives/registry.tsx'))}

window.HL = {
  render(id, host) {
    createRoot(host).render(React.createElement(React.StrictMode, null, PRIMITIVE_PREVIEWS[id] ?? null))
  },
  ids: Object.keys(PRIMITIVE_PREVIEWS),
}
`

const bundle = await esbuild.build({
  stdin: { contents: entry, resolveDir: ROOT, loader: 'tsx' },
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  write: false,
  logLevel: 'silent',
  // The demos and the sources are authored for Next, which resolves `@/`
  // from tsconfig. esbuild needs telling.
  alias: { '@': join(ROOT, 'src') },
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.tsx': 'tsx' },
})

const script = bundle.outputFiles[0].text

/* ------------------------------------------------------------------ *
 *  Compile the stylesheet
 * ------------------------------------------------------------------ */

/*
 * The app's real `globals.css`, through the real Tailwind plugin. A
 * hand-written subset would test classes this harness knows about rather
 * than the ones the components use, which is the opposite of the point —
 * a typo'd `bg-mutes/30` has to come back as an unstyled element.
 */
const globals = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8')
const compiled = await postcss([tailwind()]).process(globals, {
  from: join(ROOT, 'src/app/globals.css'),
})
const css = compiled.css

/* ------------------------------------------------------------------ *
 *  Render
 * ------------------------------------------------------------------ */

const CELL_W = 420
const COLS = 3

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: COLS * CELL_W, height: 1200 },
  deviceScaleFactor: 1,
})

const problems: string[] = []
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console: ${msg.text()}`)
})
page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))

interface Result {
  id: string
  height: number
  /** Luminance spread across the cell. Zero means a blank rectangle. */
  variance: number
}

async function renderAll(dark: boolean): Promise<Result[]> {
  await page.setContent(
    `<!doctype html><html class="${dark ? 'dark' : ''}"><head><meta charset="utf-8"></head>
     <body class="bg-background text-foreground">
       <div id="grid" style="display:grid;grid-template-columns:repeat(${COLS},${CELL_W}px)"></div>
     </body></html>`,
  )
  await page.addStyleTag({ content: css })
  await page.addScriptTag({ content: script })

  const results = await page.evaluate(
    async ({ ids, labels, cellW }) => {
      const hl = (window as unknown as {
        HL: { render: (id: string, host: HTMLElement) => void }
      }).HL

      const grid = document.getElementById('grid')!
      grid.innerHTML = ''

      for (let i = 0; i < ids.length; i++) {
        const cell = document.createElement('div')
        cell.style.cssText = `width:${cellW}px;border:1px solid rgba(128,128,128,.35);position:relative`
        const host = document.createElement('div')
        cell.appendChild(host)

        const label = document.createElement('div')
        label.textContent = labels[i]
        label.style.cssText =
          'position:absolute;left:6px;top:4px;font:10px ui-monospace,monospace;opacity:.55'
        cell.appendChild(label)

        grid.appendChild(cell)
        hl.render(ids[i], host)
      }

      // Two frames plus a beat: React commits, effects run, and the
      // components that read the DOM on mount (Kbd's platform check, the
      // combobox's measurement) have settled.
      await new Promise((r) => setTimeout(r, 400))

      return ids.map((id, i) => {
        const cell = grid.children[i] as HTMLElement
        return { id, height: Math.round(cell.getBoundingClientRect().height) }
      })
    },
    {
      ids: PRIMITIVE_CATALOG.map((p) => p.id),
      labels: PRIMITIVE_CATALOG.map((p) => p.id),
      cellW: CELL_W,
    },
  )

  /*
   * Variance is measured from the screenshot rather than in the page: a
   * DOM that exists but paints nothing — a white control on a white card —
   * has a height and no appearance, and the pixels are the only thing that
   * can tell the difference.
   */
  const shots = await Promise.all(
    PRIMITIVE_CATALOG.map(async (_, i) => {
      const box = page.locator('#grid > div').nth(i)
      return box.screenshot()
    }),
  )

  return results.map((r, i) => ({ ...r, variance: spread(shots[i]) }))
}

/**
 * Luminance spread of a PNG, without decoding it.
 *
 * A PNG of one flat colour compresses to almost nothing, and one with a
 * control drawn on it does not. Comparing compressed size against the
 * cell's area separates "drew something" from "drew a rectangle" well
 * enough for a smoke test, and avoids a decoder dependency for a number
 * that is only ever compared to a threshold.
 */
function spread(png: Buffer): number {
  return png.length
}

mkdirSync(OUT_DIR, { recursive: true })

const failures: string[] = []

for (const dark of [false, true]) {
  const theme = dark ? 'dark' : 'light'
  const before = problems.length
  const results = await renderAll(dark)

  if (!checkOnly) {
    const png = await page.locator('#grid').screenshot()
    writeFileSync(join(OUT_DIR, `primitives-${theme}.png`), png)
  }

  for (const r of results) {
    if (r.height < 40) {
      failures.push(`${r.id} (${theme}): rendered ${r.height}px tall — it draws nothing`)
    }
    // A flat cell of this size compresses to about 1 KB; anything with a
    // control on it lands well above that.
    if (r.variance < 1800) {
      failures.push(
        `${r.id} (${theme}): the cell is blank (${r.variance} bytes of PNG for ${CELL_W}x${r.height})`,
      )
    }
  }

  const newProblems = problems.slice(before)
  for (const p of newProblems) failures.push(`${theme}: ${p}`)

  console.log(
    `\n  ${theme}\n` +
      results
        .map((r) => `    ${r.id.padEnd(24)} ${String(r.height).padStart(4)}px  ${r.variance}b`)
        .join('\n'),
  )
}

await browser.close()

if (!checkOnly) console.log(`\ncontact sheets -> ${OUT_DIR}`)

if (failures.length > 0) {
  console.error(`\nshot-primitives: ${failures.length} problem(s)\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(
  `\nshot-primitives: ${PRIMITIVE_CATALOG.length} primitives render in both themes, no console errors.`,
)
