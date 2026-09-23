/**
 * Check the static layout-shift classification against a real browser.
 *
 *     BASE=http://localhost:3007 npx tsx scripts/validate-effect-motion.mts
 *
 * `analyzeEffectMotion` says an effect `shifts` when it animates a layout
 * property, and `none` otherwise. That is a claim about what a browser will
 * do, made from source text. This opens each effect's page in Chromium,
 * watches `layout-shift` entries whose source node is INSIDE the preview
 * stage, and compares.
 *
 * WHAT IS MEASURED. For each sampled effect, two phases on the real
 * `/effect/<id>` page, with OS reduced motion set to `no-preference` (the
 * site's own ReducedMotionProvider only zeroes durations when the visitor
 * asks it to, so the preview animates as shipped):
 *
 *   1. Idle: the preview's animations are restarted (so entrance animations
 *      are observed, not missed before the observer attached) and watched for
 *      IDLE_MS. Loops repeat in this window; entrances play once.
 *   2. Interaction: for every `:hover` / `:focus` / `:checked` rule in the
 *      effect's own CSS (at most MAX_TRIGGERS), the element that rule keys on
 *      is hovered / focused / checked and released again. A hover transition
 *      on `width` is a layout shift too, and `hadRecentInput` does not
 *      exclude a plain mouse move or a programmatic focus, so it is counted.
 *      A real click is NOT used: Chromium discards shifts within 500 ms of a
 *      click, so it could not be measured.
 *
 * Only entries whose `sources[].node` is a descendant of `#artifact-frame`
 * are attributed to the effect. Hydration, web fonts and the rest of the
 * page are ignored, which is what makes a per-effect number meaningful.
 *
 * A POSITIVE CONTROL runs first: an element that certainly shifts is
 * injected into the stage. If the observer does not see it, every zero below
 * would be meaningless, and the script aborts instead of writing a file.
 *
 * WHAT THE NUMBER IS NOT. It is the CLS contribution of this preview in this
 * window in this viewport, not a property of the CSS. A looping effect has no
 * "the" CLS; the value grows with the window. It is stored with its window so
 * nobody reads it as an effect-level constant.
 *
 * Writes `src/lib/effect-motion-validation.json`, which the badge reads for
 * the effects in the sample and `check-effect-motion.mts` re-verifies against
 * the current analysis. Needs a running dev server; never starts one.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'

import { EFFECTS } from '../src/lib/effects.ts'
import { analyzeEffectMotion, type EffectMotionProfile } from '../src/lib/effect-motion.ts'
import { isShaderRenderer } from '../src/lib/shaders/shader-types.ts'

const BASE = (process.env.BASE ?? 'http://localhost:3007').replace(/\/$/, '')
const IDLE_MS = 4000
const HOLD_MS = 900
const MAX_TRIGGERS = 4
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'effect-motion-validation.json')

/* ------------------------------------------------------------------ *
 *  Sample
 * ------------------------------------------------------------------ */

const WANT: Array<[EffectMotionProfile['propertyClass'], number]> = [
  ['layout', 16],
  ['paint', 8],
  ['compositor', 8],
  ['none', 2],
]

/**
 * Deterministic, stratified: within a class, effects are grouped by their
 * first offending property and picked round-robin, so 16 layout effects are
 * not sixteen `width` effects. Ties break on id order, so a re-run measures
 * the same effects unless the catalog changed.
 */
/** FNV-1a, for a stable but unordered sort. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickSample(): Array<{ id: string; profile: EffectMotionProfile; effect: (typeof EFFECTS)[number] }> {
  const analysed = EFFECTS.filter((e) => !isShaderRenderer(e.renderer))
    .map((e) => ({ id: e.id, profile: analyzeEffectMotion(e.css, e.html), effect: e }))
    .sort((a, b) => (a.id < b.id ? -1 : 1))

  const out: Array<{ id: string; profile: EffectMotionProfile; effect: (typeof EFFECTS)[number] }> = []
  for (const [cls, n] of WANT) {
    const groups = new Map<string, typeof analysed>()
    for (const a of analysed) {
      if (a.profile.propertyClass !== cls) continue
      const key = a.profile.offending[0] ?? '-'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(a)
    }
    // Hash order, not alphabetical: `ocean-*` sorts together, and a sample
    // of eight effects that are all `ocean-*` is a sample of one template.
    const queues = [...groups.values()].map((q) => [...q].sort((a, b) => hash(a.id) - hash(b.id)))
    let picked = 0
    for (let round = 0; picked < n; round++) {
      let any = false
      for (const q of queues) {
        const item = q[round]
        if (item && picked < n && !out.includes(item)) {
          out.push(item)
          picked++
          any = true
        }
      }
      if (!any) break
    }
  }
  return out
}

/* ------------------------------------------------------------------ *
 *  Triggers
 * ------------------------------------------------------------------ */

interface Trigger {
  kind: 'hover' | 'focus' | 'check'
  /** Selector, relative to the document, of the element the rule keys on. */
  selector: string
}

const STATE_AT = /:(hover|focus-within|focus-visible|focus|checked)(?![\w-])/

/**
 * The elements the effect's own state rules key on. `.fx:hover .child` keys
 * on `.fx`; `.fx .child:hover` keys on `.fx .child`. Rules that key on a
 * pseudo-element or use :not()/:has() around the state are skipped: they
 * cannot be turned into a selector for a real node.
 */
function triggersFor(css: string): Trigger[] {
  const seen = new Set<string>()
  const out: Trigger[] = []
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media \(prefers-reduced-motion[\s\S]*$/, '')
  for (const m of body.matchAll(/([^{}@]+)\{[^{}]*\}/g)) {
    for (const raw of m[1].split(',')) {
      const sel = raw.trim()
      const at = STATE_AT.exec(sel)
      if (!at) continue
      const prefix = sel.slice(0, at.index).replace(/[\s>+~]+$/, '').trim()
      if (!prefix || /::|:not\(|:has\(|:is\(|:where\(/.test(prefix)) continue
      const kind = at[1] === 'hover' ? 'hover' : at[1] === 'checked' ? 'check' : 'focus'
      const key = `${kind}|${prefix}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ kind, selector: prefix })
    }
  }
  // Hover first: it is the trigger a visitor actually performs.
  out.sort((a, b) => (a.kind === 'hover' ? 0 : 1) - (b.kind === 'hover' ? 0 : 1))
  return out.slice(0, MAX_TRIGGERS)
}

/* ------------------------------------------------------------------ *
 *  In-page observer
 * ------------------------------------------------------------------ */

const INSTALL = `(() => {
  const frame = document.getElementById('artifact-frame')
  const state = { inStage: 0, entries: 0, elsewhere: 0 }
  window.__motionCls = state
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue
      const inside = (e.sources || []).some((s) => {
        const n = s.node
        const el = n && (n.nodeType === 1 ? n : n.parentElement)
        return el && el !== frame && frame.contains(el)
      })
      if (inside) { state.inStage += e.value; state.entries += 1 }
      else state.elsewhere += e.value
    }
  }).observe({ type: 'layout-shift', buffered: false })
})()`

/** Snapshot then zero, so the two phases are reported separately. */
const TAKE = `(() => {
  const s = window.__motionCls
  const r = { cls: s.inStage, entries: s.entries, elsewhere: s.elsewhere }
  s.inStage = 0; s.entries = 0; s.elsewhere = 0
  return r
})()`

/**
 * A sibling that follows the effect in flow. The stage holds only the effect,
 * so an effect that grows would push nothing and register nothing, which is
 * not what happens on a real page where content follows it. The witness is
 * that content: visible (it has a border, since an unpainted box is not
 * tracked) and NOT part of the effect, so it moves only if the effect
 * displaces it.
 */
const WITNESS = `(() => {
  const frame = document.getElementById('artifact-frame')
  const w = document.createElement('div')
  w.id = '__witness'
  w.style.cssText = 'width:96px;height:20px;border:1px solid rgba(128,128,128,.4);flex:none'
  frame.append(w)
})()`

/** Cancel and replay every animation in the stage, pseudo-elements included. */
const RESTART = `(() => {
  const frame = document.getElementById('artifact-frame')
  const kids = [...frame.children]
  kids.forEach((k) => { k.style.display = 'none' })
  void frame.offsetHeight
  kids.forEach((k) => { k.style.display = '' })
})()`

async function loadEffect(page: Page, id: string): Promise<void> {
  await page.goto(`${BASE}/effect/${id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForSelector('#artifact-frame', { timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  // Let hydration, fonts and the page's own settling finish before observing.
  await page.waitForTimeout(1800)
}

async function positiveControl(page: Page): Promise<number> {
  await page.evaluate(INSTALL)
  await page.evaluate(`(() => {
    const frame = document.getElementById('artifact-frame')
    const a = document.createElement('div')
    a.id = '__ctl'
    a.style.cssText = 'width:120px;height:60px;background:#f00'
    const b = document.createElement('div')
    b.id = '__ctl2'
    b.style.cssText = 'width:120px;height:60px;background:#00f'
    frame.append(a, b)
  })()`)
  await page.waitForTimeout(300)
  await page.evaluate(`document.getElementById('__ctl').style.height = '140px'`)
  await page.waitForTimeout(600)
  const r = (await page.evaluate(TAKE)) as { cls: number }
  await page.evaluate(`document.getElementById('__ctl')?.remove(); document.getElementById('__ctl2')?.remove()`)
  return r.cls
}

type Outcome = 'done' | 'occluded' | 'missing'

/** Drive one state on the page. `occluded` means something else was on top. */
async function perform(page: Page, t: Trigger): Promise<Outcome> {
  const sel = JSON.stringify(`#artifact-frame ${t.selector}`)
  const rect = (await page.evaluate(`(() => {
    const el = document.querySelector(${sel})
    if (!el) return null
    const r = el.getBoundingClientRect()
    const x = r.x + r.width / 2, y = r.y + r.height / 2
    const hit = document.elementFromPoint(x, y)
    return { x, y, covered: !hit || !document.getElementById('artifact-frame').contains(hit) }
  })()`)) as { x: number; y: number; covered: boolean } | null
  if (!rect) return 'missing'

  if (t.kind === 'hover') {
    if (rect.covered) return 'occluded'
    await page.mouse.move(rect.x, rect.y, { steps: 4 })
    await page.waitForTimeout(HOLD_MS)
    await page.mouse.move(4, 4, { steps: 4 })
    await page.waitForTimeout(HOLD_MS)
    return 'done'
  }

  if (t.kind === 'focus') {
    await page.evaluate(`(() => {
      const el = document.querySelector(${sel})
      const target = el.matches('input,button,a,select,textarea,[tabindex]') ? el : el.querySelector('input,button,a,select,textarea,[tabindex]')
      if (target) target.focus({ focusVisible: true })
    })()`)
    await page.waitForTimeout(HOLD_MS)
    await page.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`)
    await page.waitForTimeout(HOLD_MS)
    return 'done'
  }

  // check: a programmatic click is untrusted, so hadRecentInput stays false.
  const flip = `(() => {
    const el = document.querySelector(${sel})
    const box = el.matches('input') ? el : el.querySelector('input[type=checkbox],input[type=radio]')
    if (box) box.click()
  })()`
  await page.evaluate(flip)
  await page.waitForTimeout(HOLD_MS)
  await page.evaluate(flip)
  await page.waitForTimeout(HOLD_MS)
  return 'done'
}

/* ------------------------------------------------------------------ *
 *  Run
 * ------------------------------------------------------------------ */

interface Row {
  static: 'none' | 'shifts'
  propertyClass: string
  offending: string[]
  measured: { cls: number; entries: number; windowSeconds: number }
  idleCls: number
  hoverCls: number
  /** The states that were actually performed on the page. */
  triggers: string[]
  /** Triggers whose element was under something else and so not performed. */
  occluded: number
  agree: boolean
}

const sample = pickSample()
console.log(`validate-effect-motion: ${sample.length} effects against ${BASE}`)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 1400 },
  reducedMotion: 'no-preference',
})
// The first-visit ladder tour is a modal over the whole page: it would sit on
// top of the stage and swallow every hover. Mark it seen, as a return visitor is.
await context.addInitScript(() => {
  try {
    window.localStorage.setItem('hoverlab:ladder-tour-seen', '1')
  } catch {
    /* private mode: the tour will show, and the occlusion check below will say so */
  }
})
const page = await context.newPage()

const rows: Record<string, Row> = {}
let control = 0

try {
  await loadEffect(page, sample[0].id)
  control = await positiveControl(page)
  console.log(`positive control: ${control.toFixed(4)} ${control > 0 ? '(observer sees shifts)' : '(OBSERVER SAW NOTHING)'}`)
  if (!(control > 0)) {
    console.error('validate-effect-motion: the observer did not see a shift it should have. Aborting; nothing written.')
    process.exit(1)
  }

  for (const { id, profile, effect } of sample) {
    await loadEffect(page, id)
    await page.evaluate(WITNESS)
    await page.waitForTimeout(300)
    await page.evaluate(INSTALL)

    // Phase 1: idle. Restart so entrance animations play inside the window.
    await page.evaluate(RESTART)
    await page.waitForTimeout(IDLE_MS)
    const idle = (await page.evaluate(TAKE)) as { cls: number; entries: number }

    // Phase 2: perform every state the effect's own CSS defines.
    const triggers = triggersFor(effect.css)
    const performed: string[] = []
    let occluded = 0
    for (const t of triggers) {
      const ok = await perform(page, t)
      if (ok === 'occluded') occluded++
      else if (ok === 'done') performed.push(`${t.kind} ${t.selector}`)
    }
    const hover = (await page.evaluate(TAKE)) as { cls: number; entries: number }

    const cls = idle.cls + hover.cls
    const entries = idle.entries + hover.entries
    const staticSays = profile.layoutShift
    const measuredShifts = entries > 0
    const row: Row = {
      static: staticSays,
      propertyClass: profile.propertyClass,
      offending: profile.offending,
      measured: {
        cls: Math.round(cls * 10000) / 10000,
        entries,
        windowSeconds: Math.round((IDLE_MS + performed.length * 2 * HOLD_MS) / 100) / 10,
      },
      idleCls: Math.round(idle.cls * 10000) / 10000,
      hoverCls: Math.round(hover.cls * 10000) / 10000,
      triggers: performed,
      occluded,
      agree: (staticSays === 'shifts') === measuredShifts,
    }
    rows[id] = row
    console.log(
      `${row.agree ? 'ok  ' : 'DIFF'} ${id.padEnd(40)} static=${staticSays.padEnd(6)} ${row.propertyClass.padEnd(10)} measured cls=${row.measured.cls} entries=${entries} (idle ${row.idleCls}, interact ${row.hoverCls}) [${performed.length}/${triggers.length} states${occluded ? `, ${occluded} occluded` : ''}]  ${profile.offending.slice(0, 3).join(',')}`,
    )
  }
} finally {
  await browser.close()
}

/* ------------------------------------------------------------------ *
 *  Summary + write
 * ------------------------------------------------------------------ */

const all = Object.values(rows)
const tp = all.filter((r) => r.static === 'shifts' && r.measured.entries > 0).length
const tn = all.filter((r) => r.static === 'none' && r.measured.entries === 0).length
const fp = all.filter((r) => r.static === 'shifts' && r.measured.entries === 0).length
const fn = all.filter((r) => r.static === 'none' && r.measured.entries > 0).length
const summary = { sample: all.length, agreed: tp + tn, truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn }

console.log(`\nagreement: ${summary.agreed}/${summary.sample}  (TP ${tp}, TN ${tn}, FP ${fp}, FN ${fn})`)
for (const [id, r] of Object.entries(rows)) if (!r.agree) console.log(`  disagrees: ${id} static=${r.static} measured=${r.measured.entries} entries [${r.offending.join(', ')}]`)

writeFileSync(
  OUT,
  JSON.stringify(
    {
      note: 'Written by scripts/validate-effect-motion.mts from Chromium layout-shift entries on the real /effect page. Re-checked against the current analysis by check-effect-motion.mts.',
      generatedAt: new Date().toISOString().slice(0, 10),
      browser: 'chromium (playwright)',
      positiveControl: Math.round(control * 10000) / 10000,
      summary,
      effects: rows,
    },
    null,
    1,
  ) + '\n',
)
console.log(`wrote ${OUT}`)
