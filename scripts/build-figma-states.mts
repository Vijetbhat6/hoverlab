/**
 * The Figma states kit: every primitive, in every state, as variant-READY frames.
 *
 * ── WHAT ARRIVES, PLAINLY ───────────────────────────────────────────────
 *
 * `build-figma-kit.mts --primitives` traces each primitive in its DEFAULT
 * state only. This crawls the other eight (hover, focus, active, disabled,
 * loading, error, empty, long text) and lays each primitive out as ONE ROW:
 * states across, primitives down, every frame named `State=Hover` and so on.
 *
 * Those are variant-READY frames, not variants. Figma builds a variant from a
 * component whose name is `Property=Value`; an SVG import cannot create
 * components. So the designer converts each frame to a component, selects the
 * row, and runs Combine as Variants. The names do the rest.
 *
 * ── HOW A STATE IS FORCED, AND HOW COVERAGE IS DECIDED ──────────────────
 *
 * See `src/lib/states/force.ts`, proven on fixtures by
 * `scripts/test-figma-states.mts` before any real page was crawled. In short:
 * hover, focus and active go through the DevTools Protocol
 * (`CSS.forcePseudoState`); disabled, loading and error set the attributes a
 * component's CSS keys on; empty and long-text rewrite the data. The verdict
 * comes from COMPUTED STYLES of every interactive element, never from the SVG,
 * because the tracer can ignore a box-shadow ring that the browser paints.
 *
 * ── WHAT THIS DOES NOT DO ───────────────────────────────────────────────
 *
 * - Every control is forced at once, so a primitive with three buttons shows
 *   all three hovered in the one frame.
 * - JS-driven states do not fire: `mouseenter` handlers, tooltips that open on
 *   pointer events, and a `loading` PROP (only `aria-busy` / `data-loading`
 *   are set, so a primitive that needs the prop reads not-styled, honestly).
 * - The tracer's own limits carry over: single-line text can sit offset, and
 *   lucide icons are not traced.
 *
 * Not in `prebuild`: it needs a running dev server and a real browser.
 *
 *   npm run dev
 *   npx tsx scripts/build-figma-states.mts                     # all primitives
 *   npx tsx scripts/build-figma-states.mts --only button,switch
 *   npx tsx scripts/build-figma-states.mts --limit 5 --out <dir>
 *
 * One worker: the dev server is shared, and a parallel crawl would only make
 * each trace slower and the traces flakier.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, type BrowserContext, type Page } from 'playwright'

import { applyState, measureState, prepare, toControlCensus, type StateResult } from '../src/lib/states/force.ts'
import { PRIMITIVE_INDEX } from '../src/lib/primitives/primitive-index.ts'
import { primitiveCategorySlug, type PrimitiveCategory } from '../src/lib/primitives/primitive-types.ts'
import {
  NON_DEFAULT_STATES,
  STATES,
  STATE_BY_ID,
  focusDefects,
  verdictOf,
  type StateId,
  type Verdict,
} from '../src/lib/states/states.ts'

void applyState

const BASE = process.env.BASE ?? 'http://localhost:3007'
const SCOPE = '#artifact-frame'

const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(name)
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const ONLY = opt('--only')?.split(',').map((s) => s.trim()).filter(Boolean)
const LIMIT = opt('--limit') ? Number(opt('--limit')) : Infinity
const OUT_OVERRIDE = opt('--out')
const DELIBERATE_PARTIAL = flag('--allow-partial') || Boolean(ONLY) || Number.isFinite(LIMIT)

const OUT_DIR = OUT_OVERRIDE ? resolve(OUT_OVERRIDE) : join(process.cwd(), 'public', 'figma', 'states')
const COVERAGE_FILE = OUT_OVERRIDE
  ? join(OUT_DIR, 'state-coverage.json')
  : join(process.cwd(), 'src', 'lib', 'generated-state-coverage.json')

const MARGIN = 64
const FRAME_GAP = 64
const ROW_GAP = 120
const TITLE_HEIGHT = 56
const LABEL_HEIGHT = 28

interface Frame {
  width: number
  height: number
  body: string
}

interface Row {
  id: string
  name: string
  category: string
  frames: Partial<Record<StateId, Frame>>
  verdicts: Record<StateId, Verdict>
  notes: Partial<Record<StateId, string>>
  defects: string[]
}

// ── Copied helpers (build-figma-kit.mts is edited by a peer: never imported) ──

function innerOf(svg: string): string {
  const open = svg.indexOf('>')
  const close = svg.lastIndexOf('</svg>')
  if (open === -1 || close === -1) return ''
  return svg.slice(open + 1, close).trim()
}

function attr(svg: string, name: string): number {
  const m = svg.match(new RegExp(`${name}="([0-9.]+)"`))
  return m ? Number(m[1]) : 0
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function indent(body: string, by: string): string {
  return body
    .split('\n')
    .map((line) => `${by}${line}`)
    .join('\n')
}

/** A real pointer press closes popovers; element.click() fires only the click. */
async function press(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: /figma/i }).first()
  await button.evaluate((el) => (el as HTMLElement).click())
}

// ── Browser ────────────────────────────────────────────────────────────────

const browser = await chromium.launch()
const ctx: BrowserContext = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  permissions: ['clipboard-read', 'clipboard-write'],
  colorScheme: 'light',
})
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem('theme', 'light')
    window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
  } catch {
    /* private mode: the defaults are close enough */
  }
})
await ctx.addInitScript('globalThis.__name = globalThis.__name || function (f) { return f }')

/** Press "Copy for Figma" and read the SVG off the clipboard. */
async function copyFrame(page: Page): Promise<Frame> {
  await press(page)
  let svg = ''
  for (let attempt = 0; attempt < 150; attempt++) {
    svg = await page.evaluate(() => navigator.clipboard.readText())
    if (svg.startsWith('<svg')) break
    // The button is server-rendered before hydration: one re-click at 5s.
    if (attempt === 50) await press(page)
    await page.waitForTimeout(100)
  }
  if (!svg.startsWith('<svg')) throw new Error('clipboard held no SVG after 15s')
  await page.evaluate(() => navigator.clipboard.writeText(''))
  return { width: attr(svg, 'width'), height: attr(svg, 'height'), body: innerOf(svg) }
}

/** One fresh page load, one state. Returns the verdict inputs and the traced frame. */
async function runState(id: string, state: StateId): Promise<{ result: StateResult; frame?: Frame }> {
  const page = await ctx.newPage()
  try {
    await page.goto(`${BASE}/primitive/${id}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const button = page.getByRole('button', { name: /figma/i }).first()
    await button.waitFor({ state: 'visible', timeout: 45_000 })
    await page.locator(SCOPE).waitFor({ state: 'attached', timeout: 45_000 })
    // Layout has to settle before the walker measures anything.
    await page.waitForTimeout(500)
    const cdp = await ctx.newCDPSession(page)
    const p = await prepare(page, cdp, SCOPE)
    let frame: Frame | undefined
    const result = await measureState(p, state, async () => {
      frame = await copyFrame(page)
    })
    await cdp.detach().catch(() => undefined)
    return { result, frame }
  } finally {
    await page.close().catch(() => undefined)
  }
}

async function runStateRetry(id: string, state: StateId) {
  try {
    return await runState(id, state)
  } catch (first) {
    try {
      return await runState(id, state)
    } catch (second) {
      throw new Error(
        `${state}: ${(second as Error).message.split('\n')[0]} (first attempt: ${(first as Error).message.split('\n')[0]})`,
      )
    }
  }
}

// ── Crawl ──────────────────────────────────────────────────────────────────

let targets = PRIMITIVE_INDEX.filter((p) => !ONLY || ONLY.includes(p.id))
targets = targets.slice(0, LIMIT)
if (ONLY) {
  const unknown = ONLY.filter((id) => !PRIMITIVE_INDEX.some((p) => p.id === id))
  if (unknown.length) throw new Error(`build-figma-states: unknown primitive id: ${unknown.join(', ')}`)
}

const rows: Row[] = []
const failed: string[] = []
const started = Date.now()

for (const [i, prim] of targets.entries()) {
  const t0 = Date.now()
  try {
    const row: Row = {
      id: prim.id,
      name: prim.name,
      category: prim.category,
      frames: {},
      verdicts: {} as Record<StateId, Verdict>,
      notes: {},
      defects: [],
    }
    const results: Partial<Record<StateId, StateResult>> = {}

    const base = await runStateRetry(prim.id, 'default')
    if (base.frame) row.frames.default = base.frame
    row.verdicts.default = 'n/a'
    const g = base.result.geometry

    for (const s of NON_DEFAULT_STATES) {
      // Cheap prefilter from the default page: nothing to force it on.
      const impossible =
        (['hover', 'focus', 'active', 'disabled', 'loading'].includes(s.id) && g.controls === 0) ||
        (s.id === 'error' && g.formControls === 0) ||
        ((s.id === 'empty' || s.id === 'long-text') && g.textNodes === 0 && g.textInputs === 0)
      if (impossible) {
        row.verdicts[s.id] = 'n/a'
        row.notes[s.id] = s.needs === 'controls' ? 'no interactive element' : s.needs === 'inputs' ? 'no form control' : 'no text or input'
        continue
      }
      const r = await runStateRetry(prim.id, s.id)
      results[s.id] = r.result
      row.verdicts[s.id] = verdictOf(r.result.styled, r.result.applicable)
      if (!r.result.applicable) row.notes[s.id] = r.result.note ?? 'nothing to force it on'
      else if (r.frame) row.frames[s.id] = r.frame
    }

    const f = results.focus
    if (f && f.applicable) {
      const census = toControlCensus(f.controls, results.hover?.controls ?? [], results.active?.controls ?? [], f.rows)
      row.defects = focusDefects({ [prim.id]: census }).map((d) => d.control)
    }
    rows.push(row)
  } catch (e) {
    failed.push(`${prim.id}: ${(e as Error).message.split('\n')[0]}`)
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`build-figma-states: ${i + 1}/${targets.length} ${prim.id} (${secs}s)`)
}

await browser.close()

if (failed.length) {
  console.log(`build-figma-states: ${failed.length} did not complete:`)
  for (const f of failed.slice(0, 20)) console.log(`  ${f}`)
}
if (rows.length === 0) {
  throw new Error(`build-figma-states: traced nothing out of ${targets.length}. Is the dev server up at ${BASE}?`)
}

/*
 * A PARTIAL RUN MUST NOT OVERWRITE A COMPLETE OUTPUT (same rule and same
 * reason as build-figma-kit): a network blip that loses six primitives would
 * otherwise replace a good kit with a short one and exit 0.
 */
const partial = failed.length > 0 || rows.length < targets.length
if (partial && !DELIBERATE_PARTIAL) {
  throw new Error(
    `build-figma-states: ${rows.length} of ${targets.length} primitives completed, refusing to write ` +
      `output that is missing ${targets.length - rows.length}. The existing output is untouched. ` +
      `To write it anyway: --allow-partial`,
  )
}

// ── Emit ───────────────────────────────────────────────────────────────────

function stitch(category: string, list: Row[]): string {
  let rowWidthMax = 0
  const parts: string[] = []
  let y = MARGIN

  for (const row of list) {
    const frameTop = y + TITLE_HEIGHT + LABEL_HEIGHT
    parts.push(
      `  <text id="${escapeXml(row.name)} title" x="${MARGIN}" y="${y + 22}" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#0a0a0a">${escapeXml(row.name)}</text>`,
      `  <text id="${escapeXml(row.id)} id" x="${MARGIN}" y="${y + 40}" font-family="ui-monospace, monospace" font-size="12" fill="#737373">${escapeXml(row.id)}</text>`,
    )
    let x = MARGIN
    let tallest = 0
    const fallbackWidth = row.frames.default?.width ?? 240
    for (const s of STATES) {
      const frame = row.frames[s.id]
      const w = frame?.width ?? Math.min(fallbackWidth, 320)
      parts.push(
        `  <text id="${escapeXml(s.figmaName)} label ${escapeXml(row.id)}" x="${x}" y="${frameTop - 10}" font-family="ui-monospace, monospace" font-size="13" font-weight="600" fill="#0a0a0a">${escapeXml(s.figmaName)}</text>`,
      )
      if (frame) {
        parts.push(
          `  <g id="${escapeXml(s.figmaName)}" transform="translate(${x}, ${frameTop})">\n${indent(frame.body, '    ')}\n  </g>`,
        )
        tallest = Math.max(tallest, frame.height)
      } else {
        parts.push(
          `  <text id="${escapeXml(s.figmaName)} note ${escapeXml(row.id)}" x="${x}" y="${frameTop + 16}" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#737373">n/a: ${escapeXml(row.notes[s.id] ?? 'nothing to force')}</text>`,
        )
        tallest = Math.max(tallest, 24)
      }
      x += w + FRAME_GAP
    }
    rowWidthMax = Math.max(rowWidthMax, x - FRAME_GAP)
    y = frameTop + tallest + ROW_GAP
  }

  const width = Math.round(rowWidthMax + MARGIN)
  const height = Math.round(y - ROW_GAP + MARGIN)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" id="Hoverlab states - ${escapeXml(category)}">`,
    `  <!--`,
    `    Hoverlab primitive states - ${category}. ${list.length} primitives, one row each,`,
    `    states across, traced from the rendered catalog.`,
    ``,
    `    These are variant-READY frames named Property=Value (State=Hover, State=Focus ...).`,
    `    They are NOT variants: an SVG import cannot create components. To get variants,`,
    `    in Figma convert each frame to a component, select the row of components, and`,
    `    choose Combine as Variants. Figma reads the State=... names into a State property.`,
    ``,
    `    Hover, focus and active are forced on every control at once. Loading is only`,
    `    shown where a component's CSS keys on aria-busy or data-loading. Slots marked`,
    `    n/a had nothing to force the state on. Tracer limits carry over: single-line`,
    `    text can sit offset and lucide icons are not traced.`,
    ``,
    `    Every primitive here is free to copy as code at https://hoverlab.dev/primitives`,
    `  -->`,
    `  <rect id="Background" x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />`,
    ...parts,
    '</svg>',
    '',
  ].join('\n')
}

mkdirSync(OUT_DIR, { recursive: true })

const byCategory = new Map<string, Row[]>()
for (const r of rows) {
  const list = byCategory.get(r.category) ?? []
  list.push(r)
  byCategory.set(r.category, list)
}

const files: { category: string; slug: string; file: string; primitives: number; bytes: number; ids: string[] }[] = []
for (const [category, list] of byCategory) {
  const slug = primitiveCategorySlug(category as PrimitiveCategory)
  const svg = stitch(category, list)
  const file = `primitives-states-${slug}.svg`
  writeFileSync(join(OUT_DIR, file), svg)
  files.push({ category, slug, file, primitives: list.length, bytes: svg.length, ids: list.map((r) => r.id) })
}
files.sort((a, b) => a.category.localeCompare(b.category))

const today = new Date().toISOString().slice(0, 10)

writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  `${JSON.stringify(
    {
      generatedAt: today,
      primitives: rows.length,
      states: STATES.map((s) => ({ id: s.id, figmaName: s.figmaName })),
      note:
        'Variant-READY frames named Property=Value, not variants. Convert each frame to a component, select the row, Combine as Variants.',
      files,
    },
    null,
    2,
  )}\n`,
)

// Coverage: a subset run merges into what is already there rather than replacing it.
let coverage: Record<string, Record<string, Verdict>> = {}
let defects: Record<string, string[]> = {}
if (DELIBERATE_PARTIAL && existsSync(COVERAGE_FILE)) {
  try {
    const prev = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'))
    coverage = prev.coverage ?? {}
    defects = prev.focusDefects ?? {}
  } catch {
    /* unreadable: start clean */
  }
}
for (const r of rows) {
  const v: Record<string, Verdict> = {}
  for (const s of NON_DEFAULT_STATES) v[s.id] = r.verdicts[s.id]
  coverage[r.id] = v
  if (r.defects.length) defects[r.id] = r.defects
  else delete defects[r.id]
}
const sortKeys = <T,>(o: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))

writeFileSync(
  COVERAGE_FILE,
  `${JSON.stringify(
    {
      generatedAt: today,
      states: NON_DEFAULT_STATES.map((s) => s.id),
      primitives: Object.keys(coverage).length,
      coverage: sortKeys(coverage),
      focusDefects: sortKeys(defects),
    },
    null,
    2,
  )}\n`,
)

// Summary
const tally = (s: StateId, v: Verdict) => rows.filter((r) => r.verdicts[s] === v).length
console.log(`\nbuild-figma-states: ${rows.length} primitives in ${files.length} files -> ${OUT_DIR}`)
for (const s of NON_DEFAULT_STATES) {
  console.log(
    `  ${STATE_BY_ID[s.id].figmaName.padEnd(18)} styled ${String(tally(s.id, 'styled')).padStart(2)}  not-styled ${String(tally(s.id, 'not-styled')).padStart(2)}  n/a ${String(tally(s.id, 'n/a')).padStart(2)}`,
  )
}
console.log(`  focus defects: ${rows.filter((r) => r.defects.length).length} primitives`)
console.log(`  took ${((Date.now() - started) / 1000).toFixed(0)}s`)
