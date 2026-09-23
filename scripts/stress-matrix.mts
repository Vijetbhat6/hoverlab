/**
 * The stress-test matrix harness.
 *
 * Loads every primitive, block and page under each stress condition in a
 * real browser, measures the layout, judges the difference from an
 * untouched baseline run, and writes the verdicts to
 * `src/lib/generated-stress-report.json`.
 *
 *     npm run stress                          everything, report only
 *     npm run stress -- --write               and update the committed report
 *     npm run stress -- --level block --only hero-split,pricing-tiers
 *     npm run stress -- --stress expand,rtl --limit 20 --verbose
 *     npm run stress -- --shots all           keep a screenshot of every cell
 *
 *     BASE=http://localhost:3007 npm run stress
 *
 * ── WHAT IT DOES NOT DO ─────────────────────────────────────────────────
 *
 * It does not start a server. The frame it loads is `/preview/<level>/<id>`
 * with `?stress=<id>`, which is the same URL the matrix page embeds, so a
 * cell that fails here can be opened by hand and looked at.
 *
 * It is not in `prebuild`. It needs a browser and a running server and it
 * takes a long time. `scripts/check-stress.mts` is the build-time half: it
 * reads the report this writes and fails on a report that is stale or
 * missing coverage, which is all a build without a browser can honestly say.
 *
 * ── WHAT THE SITE'S OWN PROVIDER MASKS ──────────────────────────────────
 *
 * `<ReducedMotionProvider>` injects a rule that zeroes every animation when
 * reduced motion is on, so a preview of an unguarded block would pass. The
 * harness sets its stored preference to `off` so the provider stands down
 * and the artifact's own handling is what runs. What ships to a customer is
 * the artifact, not the provider.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { PRIMITIVE_CATALOG } from '../src/lib/primitives/catalog.ts'
import {
  BASELINE_VIEWPORT,
  STRESSES,
  STRESS_BY_ID,
  STRESS_VERSION,
  artifactKey,
  framePath,
  type BaselineId,
  type FrameStress,
  type Stress,
  type StressId,
  type StressLevel,
} from '../src/lib/stress/conditions.ts'
import { measureStressState, type StressMeasure } from '../src/lib/stress/measure.ts'
import { runAxe } from '../src/lib/stress/run-axe.ts'
import { sourceHash } from '../src/lib/stress/source-hash.ts'
import { judge, type Outcome } from '../src/lib/stress/verdict.ts'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const REPORT_PATH = join('src', 'lib', 'generated-stress-report.json')
const SHOT_DIR = join('.stress', 'shots')

// ── Arguments ───────────────────────────────────────────────────────────

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
const has = (name: string) => process.argv.includes(`--${name}`)

const levelArg = flag('level') ?? 'all'
const onlyArg = flag('only')?.split(',').filter(Boolean)
const stressArg = flag('stress')?.split(',').filter(Boolean)
const limit = flag('limit') ? Number(flag('limit')) : Number.POSITIVE_INFINITY
const workers = Math.max(1, Number(flag('workers') ?? 3))
const shotsMode = flag('shots') ?? 'failures'
const write = has('write')
const verbose = has('verbose')

const selected: Stress[] = stressArg
  ? stressArg.map((id) => {
      const stress = STRESS_BY_ID[id as StressId]
      if (!stress) {
        console.error(`stress-matrix: unknown stress "${id}". Known: ${STRESSES.map((s) => s.id).join(', ')}`)
        process.exit(2)
      }
      return stress
    })
  : [...STRESSES]

// ── What to run against ─────────────────────────────────────────────────

interface Job {
  level: StressLevel
  id: string
}

const catalogs: Record<StressLevel, string[]> = {
  primitive: PRIMITIVE_CATALOG.map((p) => p.id),
  block: BLOCK_CATALOG.map((b) => b.id),
  page: PAGE_CATALOG.map((p) => p.id),
}

const levels: StressLevel[] = levelArg === 'all' ? ['primitive', 'block', 'page'] : [levelArg as StressLevel]
let jobs: Job[] = levels.flatMap((level) => catalogs[level].map((id) => ({ level, id })))
if (onlyArg) jobs = jobs.filter((job) => onlyArg.includes(job.id))
jobs = jobs.slice(0, limit)

if (jobs.length === 0) {
  console.error('stress-matrix: nothing to run. Check --level and --only.')
  process.exit(2)
}

// ── Axe ─────────────────────────────────────────────────────────────────

/** The axe rules each condition is judged on. Everything else is ignored for it. */
const AXE_RULES: Partial<Record<StressId, string[]>> = {
  dark: ['color-contrast'],
  'empty-data': ['link-name', 'button-name', 'empty-heading', 'label', 'select-name'],
}
const axeStresses = selected.filter((stress) => AXE_RULES[stress.id])
const axeRules = [...new Set(axeStresses.flatMap((stress) => AXE_RULES[stress.id] ?? []))]
const axePath = join('node_modules', 'axe-core', 'axe.min.js')
const axeSource = axeRules.length > 0 && existsSync(axePath) ? readFileSync(axePath, 'utf8') : ''
if (axeRules.length > 0 && !axeSource) {
  console.error(`stress-matrix: axe-core not found at ${axePath}; skipping axe-backed conditions.`)
}

// ── Browser plumbing ────────────────────────────────────────────────────

interface RunConfig {
  key: string
  width: number
  height: number
  forcedColors: boolean
  reducedMotion: boolean
}

function configFor(id: FrameStress): RunConfig {
  const stress = STRESS_BY_ID[id as StressId] as Stress | undefined
  const viewport = stress ? stress.viewport : BASELINE_VIEWPORT[id as BaselineId]
  const forcedColors = !!stress?.forcedColors
  const reducedMotion = !!stress?.reducedMotion
  return {
    key: `${viewport.width}x${viewport.height}|fc=${forcedColors}|rm=${reducedMotion}`,
    width: viewport.width,
    height: viewport.height,
    forcedColors,
    reducedMotion,
  }
}

/**
 * Esbuild inserts `__name(fn, "name")` calls around named functions when it
 * transpiles the measurer, and Playwright ships the transpiled text into a
 * page where `__name` does not exist. A no-op shim is the standard fix.
 */
const INIT = `
  globalThis.__name = globalThis.__name || function (f) { return f };
  try {
    localStorage.setItem('hoverlab:reduced-motion', 'off');
    localStorage.setItem('hoverlab:ladder-tour-seen', '1');
  } catch (e) {}
`

class Worker {
  private contexts = new Map<string, { context: BrowserContext; page: Page }>()

  constructor(private readonly browser: Browser) {}

  async page(config: RunConfig): Promise<Page> {
    const existing = this.contexts.get(config.key)
    if (existing) return existing.page
    const context = await this.browser.newContext({
      viewport: { width: config.width, height: config.height },
      colorScheme: 'light',
      forcedColors: config.forcedColors ? 'active' : 'none',
      reducedMotion: config.reducedMotion ? 'reduce' : 'no-preference',
      bypassCSP: true,
    })
    await context.addInitScript(INIT)
    const page = await context.newPage()
    this.contexts.set(config.key, { context, page })
    return page
  }

  async close() {
    for (const { context } of this.contexts.values()) await context.close()
  }
}

interface Capture {
  measure: StressMeasure
  changed: number
  axe: string[]
  page: Page
}

/**
 * One retry. A dev server compiles a route on its first request, and under a
 * crawl that can outlast a navigation timeout for reasons that have nothing
 * to do with the artifact; the first full run recorded a run of "could not
 * measure" cells that a single re-attempt cleared.
 */
async function capture(worker: Worker, job: Job, id: FrameStress, wantAxe: boolean): Promise<Capture> {
  try {
    return await captureOnce(worker, job, id, wantAxe)
  } catch {
    return await captureOnce(worker, job, id, wantAxe)
  }
}

async function captureOnce(worker: Worker, job: Job, id: FrameStress, wantAxe: boolean): Promise<Capture> {
  const config = configFor(id)
  const page = await worker.page(config)
  const response = await page.goto(`${BASE}${framePath(job.level, job.id, id)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  })
  if (!response || response.status() !== 200) {
    throw new Error(`HTTP ${response?.status() ?? 'no response'}`)
  }
  await page.waitForSelector('html[data-stress-applied]', { state: 'attached', timeout: 45_000 })
  // Let entrance animations start and layout settle before measuring.
  await page.waitForTimeout(200)

  const changed = Number(await page.evaluate(() => document.documentElement.dataset.stressChanged ?? '0'))
  const measure = await page.evaluate(measureStressState)

  let axe: string[] = []
  if (wantAxe && axeSource) {
    axe = await runAxe(page, axeSource, axeRules)
  }

  return { measure, changed, axe, page }
}

// ── One artifact ────────────────────────────────────────────────────────

const OUTCOME_CODE: Record<Outcome | 'error', 0 | 1 | 2 | 3> = { fail: 0, pass: 1, na: 2, error: 3 }

interface Row {
  job: Job
  s: Partial<Record<StressId, 0 | 1 | 2 | 3>>
  f: Partial<Record<StressId, string[]>>
}

async function runJob(worker: Worker, job: Job): Promise<Row> {
  const row: Row = { job, s: {}, f: {} }
  const baselines = new Map<BaselineId, Capture | Error>()

  const baselineIds = [...new Set(selected.map((s) => s.baseline).filter((b): b is BaselineId => b !== null))]
  for (const id of baselineIds) {
    try {
      baselines.set(id, await capture(worker, job, id, axeRules.length > 0))
    } catch (error) {
      baselines.set(id, error as Error)
    }
  }

  for (const stress of selected) {
    try {
      const base = stress.baseline ? baselines.get(stress.baseline) : null
      if (base instanceof Error) throw new Error(`baseline failed: ${base.message}`)

      const wantAxe = !!AXE_RULES[stress.id]
      const run = await capture(worker, job, stress.id, wantAxe)

      const rules = AXE_RULES[stress.id]
      const ruleFilter = (keys: string[]) => keys.filter((key) => rules?.includes(key.split('::')[0]))

      const verdict = judge({
        stress,
        base: base ? base.measure : null,
        run: run.measure,
        changed: stress.transform ? run.changed : undefined,
        axe: wantAxe && base && axeSource ? { base: ruleFilter(base.axe), run: ruleFilter(run.axe) } : undefined,
      })

      row.s[stress.id] = OUTCOME_CODE[verdict.outcome]
      if (verdict.outcome === 'fail') {
        row.f[stress.id] = verdict.findings.map((finding) => finding.message)
        if (shotsMode !== 'none') await shoot(run.page, job, stress.id)
      } else if (shotsMode === 'all') {
        await shoot(run.page, job, stress.id)
      }
    } catch (error) {
      row.s[stress.id] = OUTCOME_CODE.error
      row.f[stress.id] = [(error as Error).message.split('\n')[0]]
    }
  }

  return row
}

async function shoot(page: Page, job: Job, id: StressId) {
  const dir = join(SHOT_DIR, job.level, job.id)
  mkdirSync(dir, { recursive: true })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const width = await page.evaluate(() => window.innerWidth)
  await page.screenshot({
    path: join(dir, `${id}.png`),
    fullPage: true,
    clip: { x: 0, y: 0, width, height: Math.min(height, 4000) },
  })
}

// ── Run ─────────────────────────────────────────────────────────────────

const browser = await chromium.launch()
const started = Date.now()
const rows: Row[] = []
let cursor = 0

async function drain(worker: Worker) {
  while (cursor < jobs.length) {
    const job = jobs[cursor++]
    const row = await runJob(worker, job)
    rows.push(row)
    const bad = Object.values(row.s).filter((v) => v === 0).length
    const err = Object.values(row.s).filter((v) => v === 3).length
    process.stdout.write(
      `  [${rows.length}/${jobs.length}] ${job.level}:${job.id} ${bad === 0 && err === 0 ? 'ok' : `${bad} failed${err ? `, ${err} errored` : ''}`}\n`,
    )
  }
}

const pool = Array.from({ length: Math.min(workers, jobs.length) }, () => new Worker(browser))
await Promise.all(pool.map(drain))
await Promise.all(pool.map((worker) => worker.close()))
await browser.close()

// ── Report ──────────────────────────────────────────────────────────────

const seconds = Math.round((Date.now() - started) / 1000)
console.log(`\nstress-matrix: ${rows.length} artifacts x ${selected.length} conditions in ${seconds}s.\n`)

const failByStress = new Map<StressId, number>()
for (const stress of selected) failByStress.set(stress.id, 0)
let errors = 0
for (const row of rows) {
  for (const [id, code] of Object.entries(row.s)) {
    if (code === 0) failByStress.set(id as StressId, (failByStress.get(id as StressId) ?? 0) + 1)
    if (code === 3) errors += 1
  }
}

for (const stress of selected) {
  const failed = failByStress.get(stress.id) ?? 0
  console.log(`  ${String(failed).padStart(4)} fail  ${stress.id.padEnd(15)} ${stress.label}`)
}
if (errors > 0) console.log(`  ${String(errors).padStart(4)} could not be measured (see --verbose)`)

if (verbose) {
  console.log('')
  for (const row of rows) {
    for (const [id, messages] of Object.entries(row.f)) {
      console.log(`  ${row.job.level}:${row.job.id} [${id}]`)
      for (const message of messages ?? []) console.log(`      ${message}`)
    }
  }
}

if (write) {
  const existing = JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as {
    version: number
    results: Record<string, { h: string; at: string; s: Row['s']; f?: Row['f'] }>
  }
  // A report written under older definitions is not evidence about these.
  const results = existing.version === STRESS_VERSION ? existing.results : {}
  const today = new Date().toISOString().slice(0, 10)

  for (const row of rows) {
    const key = artifactKey(row.job.level, row.job.id)
    const hash = sourceHash(row.job.level, row.job.id)
    const previous = results[key]
    // A partial run (--stress) refines an entry rather than replacing it,
    // but only if the source has not changed since; otherwise the old
    // conditions describe a different artifact.
    const merged = previous && previous.h === hash ? { ...previous.s } : {}
    const findings = previous && previous.h === hash ? { ...(previous.f ?? {}) } : {}
    for (const stress of selected) {
      delete findings[stress.id]
    }
    Object.assign(merged, row.s)
    Object.assign(findings, row.f)
    results[key] = {
      h: hash,
      at: today,
      s: merged,
      ...(Object.keys(findings).length > 0 ? { f: findings } : {}),
    }
  }

  const sorted = Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(REPORT_PATH, JSON.stringify({ version: STRESS_VERSION, results: sorted }) + '\n')
  console.log(`\nstress-matrix: wrote ${Object.keys(sorted).length} artifacts to ${REPORT_PATH}`)
} else {
  console.log('\nstress-matrix: report not written (pass --write to update it).')
}

const totalFail = [...failByStress.values()].reduce((a, b) => a + b, 0)
process.exit(totalFail > 0 || errors > 0 ? 1 : 0)
