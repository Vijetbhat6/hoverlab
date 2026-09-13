/**
 * Compile, run and photograph every shader effect.
 *
 *   npx tsx scripts/shot-shaders.mts            # check + write contact sheets
 *   npx tsx scripts/shot-shaders.mts --check    # check only, for the build
 *
 * WHY THIS EXISTS
 *
 * A GLSL shader has no compile step in this repo. It is a string, and the
 * first thing that ever parses it is a graphics driver on a visitor's
 * machine. `tsc` will happily ship `vec3 x = vec4(1.0);`, every test in
 * `npm test` will pass, and the card will be a gradient rectangle with a
 * warning in a console nobody has open. That is the exact failure mode the
 * fallback was designed to make survivable — which is also what makes it
 * invisible.
 *
 * So the shaders are compiled here, in a real WebGL context, against the
 * real runtime. Not a re-implementation of it: the page is an esbuild
 * bundle of `registry.ts` and `runtime.ts`, so what is tested is the thing
 * that ships, including the prelude, the uniform wiring and the two 2D
 * programs that have no GLSL at all.
 *
 * WHAT IT ASSERTS
 *
 *   1. Every program mounts without the runtime reporting a fallback.
 *   2. Every surface actually paints — measured as pixel variance, because
 *      a shader that compiles and returns a constant is a solid rectangle
 *      and looks exactly like a CSS background nobody needed.
 *   3. Both palettes, separately. A design tuned in dark that turns into a
 *      white square in light has failed the catalog's light/dark rule, and
 *      that is a per-theme render away from being caught.
 *
 * Chromium renders through SwiftShader here, so timing is not a
 * measurement — this says whether a design draws, not how fast.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as esbuild from 'esbuild'
import { chromium } from 'playwright'

import { SHADER_CATALOG } from '../src/lib/shaders/catalog.ts'
import { SHADER_PROGRAMS } from '../src/lib/shaders/registry.ts'
import { fallbackBackground } from '../src/lib/shaders/runtime.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT_DIR = join(ROOT, 'tool-results', 'shaders')

const checkOnly = process.argv.includes('--check')

/** Cell size in the contact sheet. Wide enough that a grid reads as a grid. */
const CELL_W = 320
const CELL_H = 200
const COLS = 4

/**
 * How long a surface is allowed to run before it is judged.
 *
 * Not arbitrary: `lightning-arc` is dark between strikes and `hyperspeed`
 * needs its streaks to travel out of the vanishing point. A tenth of a
 * second would photograph both mid-nothing and call them broken.
 */
const SETTLE_MS = 2600

/* ------------------------------------------------------------------ *
 *  Bundle the real runtime for the browser
 * ------------------------------------------------------------------ */

const entry = `
import { SHADER_PROGRAMS, getShaderProgram } from ${JSON.stringify(join(ROOT, 'src/lib/shaders/registry.ts'))}
import { mountShader } from ${JSON.stringify(join(ROOT, 'src/lib/shaders/runtime.ts'))}
window.HL = { SHADER_PROGRAMS, getShaderProgram, mountShader }
`

const bundle = await esbuild.build({
  stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' },
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  write: false,
  logLevel: 'silent',
  // The designs are .tsx because each one exports its component next to its
  // program; nothing in this harness renders React, but the import graph
  // still has to resolve.
  loader: { '.tsx': 'tsx' },
})

const script = bundle.outputFiles[0].text

/* ------------------------------------------------------------------ *
 *  Render
 * ------------------------------------------------------------------ */

const browser = await chromium.launch({
  args: [
    // Headless Chromium has no GPU. Without this it refuses a WebGL context
    // outright and every design would "fail" for a reason no visitor has.
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
  ],
})

const page = await browser.newPage({
  viewport: { width: COLS * CELL_W, height: Math.ceil(SHADER_CATALOG.length / COLS) * CELL_H },
  deviceScaleFactor: 1,
})

const warnings: string[] = []
page.on('console', (msg) => {
  if (msg.type() === 'warning' || msg.type() === 'error') warnings.push(msg.text())
})
page.on('pageerror', (err) => warnings.push(`pageerror: ${err.message}`))

await page.setContent(`<!doctype html><html><body style="margin:0;background:#111">
<div id="grid" style="display:grid;grid-template-columns:repeat(${COLS},${CELL_W}px)"></div>
</body></html>`)

await page.addScriptTag({ content: script })

interface Result {
  id: string
  state: string
  /** Distinct-ish pixel spread, 0 when the surface is one flat colour. */
  variance: number
}

/**
 * Mount every program into the grid and let it run.
 *
 * Returned per design rather than asserted in the page: a failure is much
 * easier to read as a table in the terminal than as an exception thrown
 * from inside `page.evaluate`.
 */
async function renderAll(dark: boolean): Promise<Result[]> {
  return page.evaluate(
    async ({ dark, ids, fallbacks, cellW, cellH, settle }) => {
      const hl = (window as unknown as {
        HL: {
          getShaderProgram: (id: string) => unknown
          mountShader: (
            canvas: HTMLCanvasElement,
            program: unknown,
            opts: { dark: boolean },
          ) => { destroy: () => void }
        }
      }).HL

      const grid = document.getElementById('grid')!
      grid.innerHTML = ''
      const handles: { destroy: () => void }[] = []
      const canvases: HTMLCanvasElement[] = []

      for (let n = 0; n < ids.length; n++) {
        const id = ids[n]
        const cell = document.createElement('div')
        /*
         * The cell carries the same fallback gradient the catalog's markup
         * paints behind every shader canvas. Without it the sheet showed
         * the two 2D designs and the orb against the harness's own black
         * page, which is a surface no visitor ever sees — and it is the
         * reason a real bug in the 2D backend looked like a harness
         * artefact for one round.
         */
        cell.style.cssText =
          `width:${cellW}px;height:${cellH}px;position:relative;overflow:hidden;` +
          `background:${fallbacks[n]}`
        const canvas = document.createElement('canvas')
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
        cell.appendChild(canvas)
        grid.appendChild(cell)
        canvases.push(canvas)

        const program = hl.getShaderProgram(id)
        if (program) handles.push(hl.mountShader(canvas, program, { dark }))
      }

      await new Promise((r) => setTimeout(r, settle))

      // Read each surface back and measure how much it varies. A shader
      // that compiled but returns a constant is indistinguishable from a
      // solid <div>, and that is a bug worth failing on.
      const results = ids.map((id, i) => {
        const canvas = canvases[i]
        const probe = document.createElement('canvas')
        probe.width = 48
        probe.height = 32
        const ctx = probe.getContext('2d')!
        ctx.drawImage(canvas, 0, 0, 48, 32)
        const { data } = ctx.getImageData(0, 0, 48, 32)

        let min = 255
        let max = 0
        let sum = 0
        for (let p = 0; p < data.length; p += 4) {
          const lum = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) * (data[p + 3] / 255)
          if (lum < min) min = lum
          if (lum > max) max = lum
          sum += lum
        }
        void sum
        return {
          id,
          state: canvas.dataset.shaderState ?? 'never-drawn',
          variance: Math.round(max - min),
        }
      })

      /*
       * Replace each live canvas with a still of itself before the
       * screenshot.
       *
       * Headless Chromium composites a WebGL canvas on a path
       * `page.screenshot` does not read: the contact sheet came back with
       * thirteen black rectangles and two working 2D canvases, while the
       * pixel readback below showed all fifteen painting. Copying through a
       * 2D context — the same route the variance probe takes, and the
       * reason the runtime asks for `preserveDrawingBuffer` — gives a
       * screenshot that shows what a visitor sees.
       */
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i]
        const still = document.createElement('canvas')
        still.width = canvas.width
        still.height = canvas.height
        still.getContext('2d')!.drawImage(canvas, 0, 0)
        const img = new Image()
        img.src = still.toDataURL()
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
        canvas.parentElement!.appendChild(img)
        canvas.style.display = 'none'

        const label = document.createElement('div')
        label.textContent = ids[i]
        label.style.cssText =
          'position:absolute;left:6px;bottom:4px;font:11px ui-monospace,monospace;' +
          'color:#fff;background:rgba(0,0,0,.55);padding:1px 5px;border-radius:3px'
        canvas.parentElement!.appendChild(label)
      }

      for (const h of handles) h.destroy()
      return results
    },
    {
      dark,
      ids: SHADER_CATALOG.map((r) => r.id),
      fallbacks: SHADER_CATALOG.map((r) => {
        const program = SHADER_PROGRAMS.find((p) => p.id === r.id)!
        return fallbackBackground(dark ? program.dark : program.light)
      }),
      cellW: CELL_W,
      cellH: CELL_H,
      settle: SETTLE_MS,
    },
  )
}

mkdirSync(OUT_DIR, { recursive: true })

const failures: string[] = []

for (const dark of [false, true]) {
  const theme = dark ? 'dark' : 'light'

  // Re-mounted per theme rather than toggled, so a design that only ever
  // looks right because it was mounted in the other palette is caught.
  const results = await renderAll(dark)

  if (!checkOnly) {
    const png = await page.locator('#grid').screenshot()
    writeFileSync(join(OUT_DIR, `shaders-${theme}.png`), png)
  }

  for (const r of results) {
    if (r.state !== 'running') {
      failures.push(`${r.id} (${theme}): surface state is "${r.state}", expected "running"`)
    } else if (r.variance < 8) {
      failures.push(
        `${r.id} (${theme}): painted a flat surface (luminance spread ${r.variance}) — it compiled but draws nothing`,
      )
    }
  }

  console.log(
    `\n  ${theme}\n` +
      results
        .map((r) => `    ${r.id.padEnd(18)} ${r.state.padEnd(9)} spread ${String(r.variance).padStart(3)}`)
        .join('\n'),
  )
}

await browser.close()

/* ------------------------------------------------------------------ *
 *  Report
 * ------------------------------------------------------------------ */

// The runtime warns rather than throws when a shader will not compile, so
// the console is the only place a link error is ever mentioned.
const compileWarnings = warnings.filter((w) => w.includes('[hoverlab] shader'))
for (const w of compileWarnings) failures.push(w)

if (!checkOnly) {
  console.log(`\ncontact sheets -> ${OUT_DIR}`)
}

if (failures.length > 0) {
  console.error(`\nshot-shaders: ${failures.length} problem(s)\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`\nshot-shaders: ${SHADER_CATALOG.length} designs compile and paint in both palettes.`)
