/**
 * Proves the stress detectors can fire.
 *
 * A green harness run only means something if each detector is capable of
 * going red. The first full run of the matrix reported zero failures for
 * reflow, reduced motion and dark, and "zero" is exactly what a detector
 * that cannot fire also reports. So this plants a known defect for each
 * one, in a page this script controls, measures it in a real browser under
 * the real emulation, and asserts the verdict, and also plants the
 * near-miss that must NOT be flagged (an ellipsis, a collapsed accordion, a
 * spinner, a bordered shape).
 *
 * It needs Playwright and a browser but no server: the fixtures are set as
 * page content.
 *
 *     npm run test:stress
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium, type Browser } from 'playwright'

import { STRESS_BY_ID, type StressId } from '../src/lib/stress/conditions.ts'
import { measureStressState, type StressMeasure } from '../src/lib/stress/measure.ts'
import { runAxe } from '../src/lib/stress/run-axe.ts'
import { judge, type Verdict } from '../src/lib/stress/verdict.ts'

interface Config {
  width?: number
  height?: number
  forcedColors?: boolean
  reducedMotion?: boolean
}

const browser: Browser = await chromium.launch()

async function open(html: string, config: Config = {}) {
  const context = await browser.newContext({
    viewport: { width: config.width ?? 1024, height: config.height ?? 768 },
    forcedColors: config.forcedColors ? 'active' : 'none',
    reducedMotion: config.reducedMotion ? 'reduce' : 'no-preference',
    colorScheme: 'light',
  })
  await context.addInitScript('globalThis.__name = globalThis.__name || function (f) { return f }')
  const page = await context.newPage()
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:16px/1.4 sans-serif;background:#fff;color:#111}</style></head><body><main>${html}</main></body></html>`,
  )
  await page.waitForTimeout(150)
  return { page, close: () => context.close() }
}

async function snap(html: string, config: Config = {}): Promise<StressMeasure> {
  const { page, close } = await open(html, config)
  const measure = await page.evaluate(measureStressState)
  await close()
  return measure
}

let passed = 0
const failures: string[] = []

async function check(name: string, run: () => Promise<void>) {
  try {
    await run()
    passed += 1
    console.log(`  ok   ${name}`)
  } catch (error) {
    failures.push(name)
    console.error(`  FAIL ${name}\n       ${(error as Error).message.split('\n')[0]}`)
  }
}

const has = (verdict: Verdict, code: string) => verdict.findings.some((f) => f.code === code)
const stress = (id: StressId) => STRESS_BY_ID[id]

// ── Reflow (WCAG 1.4.10) ────────────────────────────────────────────────

await check('reflow: a 600px element at 320px scrolls sideways', async () => {
  const run = await snap('<div style="width:600px;height:20px;background:#c00"></div>', { width: 320 })
  const verdict = judge({ stress: stress('reflow-400'), base: null, run })
  assert.equal(verdict.outcome, 'fail')
  assert.ok(has(verdict, 'page-overflow'))
})

await check('reflow: a fluid layout at 320px passes', async () => {
  const run = await snap('<div style="max-width:100%"><p>Hello there, this wraps.</p></div>', { width: 320 })
  assert.equal(judge({ stress: stress('reflow-400'), base: null, run }).outcome, 'pass')
})

await check('reflow: a table inside its own scroller is not a page overflow', async () => {
  const run = await snap(
    '<div style="overflow-x:auto"><table style="width:900px"><tr><td>a</td><td>b</td></tr></table></div>',
    { width: 320 },
  )
  assert.equal(judge({ stress: stress('reflow-400'), base: null, run }).outcome, 'pass')
})

// ── Forced colors ───────────────────────────────────────────────────────

const FORCED = `
  <div id="bar" style="width:200px;height:10px;background:#0a0;margin:8px"></div>
  <div id="bordered" style="width:200px;height:10px;background:#0a0;border:2px solid #000;margin:8px"></div>
  <div id="kept" style="width:200px;height:10px;background:#0a0;margin:8px;forced-color-adjust:none"></div>
  <input id="field" style="border:0;background:#eee;padding:6px" aria-label="Name">
  <input id="ok-field" style="border:1px solid #888;padding:6px" aria-label="City">
`

await check('forced colors: a fill-only bar and a borderless field are flagged, the rest are not', async () => {
  const base = await snap(FORCED)
  const run = await snap(FORCED, { forcedColors: true })
  const verdict = judge({ stress: stress('forced-colors'), base, run })
  assert.equal(verdict.outcome, 'fail')
  assert.ok(has(verdict, 'shape-lost'), 'the bar should be reported')
  assert.ok(has(verdict, 'control-boundary'), 'the borderless input should be reported')

  const shape = verdict.findings.find((f) => f.code === 'shape-lost')!.message
  // exactly one shape: the bar. The bordered one and forced-color-adjust:none keep their edge.
  assert.match(shape, /200x10/)
  assert.equal((shape.match(/\d+x\d+/g) ?? []).length, 1, `expected one shape, got: ${shape}`)
  const field = verdict.findings.find((f) => f.code === 'control-boundary')!.message
  assert.match(field, /input/)
})

await check('forced colors: native range/color inputs and a checkbox styled as a switch are not flagged', async () => {
  const NATIVE = `
    <input id="range" type="range" min="0" max="10" aria-label="Volume">
    <input id="color" type="color" value="#336699" aria-label="Accent">
    <input id="switch" type="checkbox" role="switch" aria-label="Notifications">
    <input id="text" style="border:0;background:#eee;padding:6px" aria-label="Name">
  `
  const base = await snap(NATIVE)
  const run = await snap(NATIVE, { forcedColors: true })
  const verdict = judge({ stress: stress('forced-colors'), base, run })
  // Only the genuinely borderless text input is a real defect.
  assert.equal(verdict.outcome, 'fail')
  const field = verdict.findings.find((f) => f.code === 'control-boundary')!.message
  assert.equal((field.match(/input/g) ?? []).length, 1, `expected only the text input, got: ${field}`)
  assert.equal((field.match(/input/g) ?? []).length, 1, 'the bordered input must not be reported')
})

await check('forced colors: a background-less input inside a bordered wrapper pill is not flagged', async () => {
  // The icon-plus-input search-field shape: the visible edge is drawn on
  // the wrapping div, and the input itself is bg-transparent with none of
  // its own. That wrapper border still renders under forced-colors, so the
  // field has a real boundary — just not on the element the naive check
  // was looking at.
  const PILL = `
    <div style="border:1px solid #ccc;padding:6px;display:flex;gap:4px">
      <input id="pill" type="search" style="background:transparent;border:0" aria-label="Filter sources">
    </div>
  `
  const base = await snap(PILL)
  const run = await snap(PILL, { forcedColors: true })
  const verdict = judge({ stress: stress('forced-colors'), base, run })
  assert.equal(verdict.outcome, 'pass')
})

await check('forced colors: a FILLED input inside a bordered wrapper still needs its own edge', async () => {
  // The fix must not become a blanket exemption for anything inside a
  // bordered ancestor: a control with its own real background is a
  // separate shape, and the wrapper's border does not help it.
  const PILL = `
    <div style="border:1px solid #ccc;padding:6px">
      <input id="pill" type="search" style="background:#eee;border:0" aria-label="Filter sources">
    </div>
  `
  const base = await snap(PILL)
  const run = await snap(PILL, { forcedColors: true })
  const verdict = judge({ stress: stress('forced-colors'), base, run })
  assert.equal(verdict.outcome, 'fail')
  assert.ok(has(verdict, 'control-boundary'))
})

// ── Reduced motion ──────────────────────────────────────────────────────

const MOTION = `
  <style>
    @keyframes pulse { to { opacity: .3 } }
    @keyframes spin { to { transform: rotate(360deg) } }
    .a { animation: pulse 1s infinite; width: 100px; height: 20px; background: #c00 }
    .b { animation: pulse 1s infinite; width: 100px; height: 20px; background: #00c }
    @media (prefers-reduced-motion: reduce) { .b { animation: none } }
    .spin { animation: spin 1s linear infinite; width: 16px; height: 16px; background: #000 }
  </style>
  <div class="a">unguarded</div><div class="b">guarded</div><div class="spin"></div>
`

await check('reduced motion: an unguarded endless animation fails; guarded and small spinner pass', async () => {
  const base = await snap(MOTION)
  const run = await snap(MOTION, { reducedMotion: true })
  const verdict = judge({ stress: stress('reduced-motion'), base, run })
  assert.equal(verdict.outcome, 'fail')
  const message = verdict.findings[0].message
  assert.match(message, /pulse/)
  assert.equal((message.match(/pulse/g) ?? []).length, 1, `only .a should be listed: ${message}`)
  assert.ok(!/spin/.test(message), 'a small status spinner is degraded, not stopped')
})

await check('reduced motion: everything guarded passes', async () => {
  const guarded = MOTION.replace('<div class="a">unguarded</div>', '')
  const run = await snap(guarded, { reducedMotion: true })
  assert.equal(judge({ stress: stress('reduced-motion'), base: null, run }).outcome, 'pass')
})

// ── Text: spill, clip, collide, and the near misses ─────────────────────

const CARDS = (word: string) => `
  <div style="display:flex;gap:8px">
    <div style="width:100px;border:1px solid #888"><div id="t1">${word}</div></div>
    <div style="width:100px;border:1px solid #888"><div id="t2">Beta</div></div>
  </div>`

await check('long word: spills out of its card and collides with the next', async () => {
  const base = await snap(CARDS('Alpha'))
  // A single unbreakable word stays on the first line, so it runs across the
  // gutter into the neighbouring card's text. (Appended to a short word it
  // would drop to a second line and collide with nothing.)
  const run = await snap(CARDS('Wolfeschlegelsteinhausenbergerdorff'))
  const verdict = judge({ stress: stress('long-names'), base, run, changed: 1 })
  assert.equal(verdict.outcome, 'fail')
  assert.ok(has(verdict, 'spilled-text'), 'spill')
  assert.ok(has(verdict, 'overlap'), 'collision')
})

await check('long word: wrapping with break-words is not a defect', async () => {
  const wrap = (w: string) => CARDS(w).replace('id="t1"', 'id="t1" style="overflow-wrap:anywhere"')
  const base = await snap(wrap('Alpha'))
  const run = await snap(wrap('Alpha Wolfeschlegelsteinhausenbergerdorff'))
  assert.equal(judge({ stress: stress('long-names'), base, run, changed: 1 }).outcome, 'pass')
})

const CLIP = (text: string) => `<div style="width:120px;height:24px;overflow:hidden;white-space:nowrap">${text}</div>`

await check('clip: text cut by an overflow:hidden box is flagged', async () => {
  const base = await snap(CLIP('Short'))
  const run = await snap(CLIP('A considerably longer label here'))
  const verdict = judge({ stress: stress('expand'), base, run, changed: 1 })
  assert.ok(has(verdict, 'clipped-text'))
})

await check('clip: deliberate ellipsis truncation is not a defect', async () => {
  const ellipsis = (t: string) =>
    `<div style="width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${t}</div>`
  const base = await snap(ellipsis('Short'))
  const run = await snap(ellipsis('A considerably longer label here'))
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip: an ellipsised span inside a big, unrelated outer overflow-hidden card is not flagged', async () => {
  // The shape that broke on the real catalog (found independently by two
  // different agents): the ellipsis box correctly stops itself from being
  // blamed, but `Range.getClientRects()` still reports the leaf's full,
  // PRE-ellipsis glyph width — and if that phantom width happens to reach
  // past a further-out, unrelated `overflow-hidden` ancestor (this site's
  // own rounded preview-chrome card), THAT one gets blamed for a clip that
  // was never visible past the ellipsis in the first place.
  const chrome = (t: string) => `
    <div style="width:300px;height:60px;overflow:hidden;border-radius:12px;padding:8px">
      <div style="width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${t}</div>
    </div>`
  const base = await snap(chrome('Short'))
  const run = await snap(chrome('A considerably longer label that would reach well past the outer card if not for the ellipsis'))
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip: an ellipsised span still catches a real clip from an outer ancestor NARROWER than the ellipsis box itself', async () => {
  // The fix must not become a blanket exemption. Baseline's short text
  // fits inside the 120px ellipsis box without truncating at all, so its
  // narrowed bounds are its own small natural width — well within the
  // 64px-content outer card, no clip. The long run text genuinely fills
  // and truncates the ellipsis box out to its full 120px, which the outer
  // card (narrower than that) really does clip — a new, real defect the
  // narrowing must not hide.
  const tightChrome = (t: string) => `
    <div style="width:80px;height:60px;overflow:hidden;padding:8px">
      <div style="width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${t}</div>
    </div>`
  const base = await snap(tightChrome('Short'))
  const run = await snap(tightChrome('A considerably longer label here'))
  const verdict = judge({ stress: stress('expand'), base, run, changed: 1 })
  assert.ok(has(verdict, 'clipped-text'), 'the outer card genuinely clips the fully-widened ellipsis box')
})

await check('clip: a collapsed accordion body (wholly hidden) is not a defect', async () => {
  const accordion = (t: string) =>
    `<div style="height:0;overflow:hidden"><p>${t}</p></div><p>Visible</p>`
  const base = await snap(accordion('Hidden text'))
  const run = await snap(accordion('Hidden text that has grown a lot longer with expansion applied'))
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip: a screen-reader-only table (sr-only via clip-path: inset(50%)) is not flagged as cut off', async () => {
  // The real Tailwind `.sr-only` in this codebase's version does not shrink
  // the box at all — a table keeps its natural, content-sized layout and
  // is hidden with `clip-path: inset(50%)` instead. `overflow: hidden` is
  // also set but is not what does the hiding here.
  const srOnlyTable = (label: string) => `
    <table style="position:absolute;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0">
      <thead><tr><th>${label}</th></tr></thead>
    </table>
    <p>Visible content</p>`
  const base = await snap(srOnlyTable('Dec'))
  const run = await snap(srOnlyTable('Wolfeschlegelsteinhausenbergerdorff 2026'))
  assert.equal(judge({ stress: stress('long-names'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip/collide: a CLOSED <details> body is not measured, even though it still has real layout', async () => {
  // A closed `<details>` hides its non-<summary> content through an
  // internal `::details-content` pseudo-element that `getComputedStyle`
  // cannot see: the real child still reports `display: block`,
  // `visibility: visible` and a real, non-zero `getBoundingClientRect()`.
  // Two adjacent closed accordion items, each with real body text that
  // would collide with the next item's summary if it were actually
  // measured at its real (invisible) layout position.
  const closedAccordion = (t: string) => `
    <details><summary>First question</summary><p>${t}</p></details>
    <details><summary>Second question</summary><p>Its own answer</p></details>`
  const base = await snap(closedAccordion('A short answer.'))
  const run = await snap(closedAccordion('A considerably longer answer that has grown a lot under expansion, the kind that would collide with the next summary below it if this were actually visible.'))
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip/collide: an OPEN <details> body is measured normally, and a real defect in it still fires', async () => {
  // The fix must not become a blanket exemption for every <details> — only
  // closed ones. An open details with a genuinely too-narrow, clipping
  // body still has to fail.
  const openAccordion = (t: string) =>
    `<details open><summary>Q</summary><div style="width:100px;overflow:hidden;white-space:nowrap">${t}</div></details>`
  const base = await snap(openAccordion('Short'))
  const run = await snap(openAccordion('A considerably longer label here'))
  assert.ok(has(judge({ stress: stress('expand'), base, run, changed: 1 }), 'clipped-text'))
})

await check('clip: an sr-only table stays unflagged even under an outer decorative overflow-hidden wrapper', async () => {
  // The shape that broke on the real catalog: the sr-only table sits
  // inside this site's own rounded preview-chrome wrapper (an unrelated
  // `overflow-hidden` card further out). Once a leaf is established
  // invisible via its own clip-path, no ancestor beyond that can add to
  // the verdict — the walk has to stop, not just skip past the sr-only
  // ancestor and keep going.
  const srOnlyInChrome = (label: string) => `
    <div style="overflow:hidden;border-radius:12px;height:60px">
      <table style="position:absolute;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0">
        <thead><tr><th>${label}</th></tr></thead>
      </table>
      <p>Visible content</p>
    </div>`
  const base = await snap(srOnlyInChrome('Dec'))
  const run = await snap(srOnlyInChrome('Wolfeschlegelsteinhausenbergerdorff 2026'))
  assert.equal(judge({ stress: stress('long-names'), base, run, changed: 1 }).outcome, 'pass')
})

await check('clip: a DECORATIVE clip-path (an angled card corner) still catches a real clip', async () => {
  // The fix must not become a blanket exemption for anything clip-path'd:
  // an angled-corner card is visible, and text cut off by its shape is a
  // real defect.
  const angledCard = (t: string) => `
    <div style="width:160px;overflow:hidden;clip-path:polygon(0 0,100% 0,100% 100%,0 100%);white-space:nowrap">${t}</div>`
  const base = await snap(angledCard('Short'))
  const run = await snap(angledCard('A considerably longer label here'))
  assert.ok(has(judge({ stress: stress('expand'), base, run, changed: 1 }), 'clipped-text'))
})

await check('clip: a table in its own overflow-x-auto scroller, inside a decorative rounded card, is not flagged', async () => {
  // The shape that broke on the real catalog: a block author correctly
  // wraps a wide table in overflow-x-auto, and the site's own preview
  // chrome wraps THAT in an overflow-hidden rounded card for the corner
  // radius. The card's clip is irrelevant — the table is reachable by
  // scrolling its own wrapper — and blaming the card reported a defect
  // that did not exist.
  const scrolledTable = (cols: number) => {
    const cells = Array.from({ length: cols }, (_, i) => `<th style="width:80px">Col ${i}</th>`).join('')
    return `
      <div style="width:300px;overflow:hidden;border-radius:12px">
        <div style="overflow-x:auto">
          <table style="border-collapse:collapse"><thead><tr>${cells}</tr></thead></table>
        </div>
      </div>`
  }
  const base = await snap(scrolledTable(4))
  const run = await snap(scrolledTable(4), { width: 320 })
  const verdict = judge({ stress: stress('reflow-400'), base: null, run: await snap(scrolledTable(4), { width: 320 }) })
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
  assert.equal(verdict.outcome, 'pass')
})

await check('clip: an overflow-hidden ancestor INSIDE a scroller still catches a real clip', async () => {
  // The fix must not become a blanket exemption: an inner clip that sits
  // between the leaf and the scroller is unrelated to the scroller's own
  // affordance and has to keep failing.
  const nested = (t: string) => `
    <div style="width:300px;overflow-x:auto">
      <div style="width:100px;overflow:hidden;white-space:nowrap">${t}</div>
    </div>`
  const base = await snap(nested('Short'))
  const run = await snap(nested('A considerably longer label here'))
  assert.ok(has(judge({ stress: stress('expand'), base, run, changed: 1 }), 'clipped-text'))
})

await check('collide: a line-clamped paragraph does not falsely collide with what comes after it', async () => {
  // `-webkit-line-clamp` lays the full text out before clipping the paint,
  // so Range.getClientRects() reports real line boxes below the clamp's own
  // visible bottom edge — over whatever sits next in the document. Nothing
  // is actually painted there, so that must never count as a collision.
  const clamped = (t: string) => `
    <div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:200px">${t}</div>
    <p id="after">Helpful · 12</p>`
  const short = 'One short line.'
  const long =
    'This paragraph is a great deal longer than the two lines the clamp allows, so several more lines of it are laid out underneath, unpainted, right on top of the element that follows.'
  const base = await snap(clamped(short))
  const run = await snap(clamped(long))
  const verdict = judge({ stress: stress('text-200'), base, run, changed: 1 })
  assert.equal(verdict.outcome, 'pass')
  assert.ok(!has(verdict, 'overlap'), 'no phantom collision from the clamped-away lines')
})

await check('collide: a real overlap still fires even when both elements sit inside a big, unrelated clip box', async () => {
  // The fix must not become a blanket exemption: wrapping the whole scene in
  // an `overflow: hidden` ancestor large enough to clip nothing at all must
  // not make `clipLines` shrink real, fully-visible overlaps away to zero.
  const clippedCards = (word: string) => `<div style="width:400px;height:120px;overflow:hidden">${CARDS(word)}</div>`
  const base = await snap(clippedCards('Alpha'))
  const run = await snap(clippedCards('Wolfeschlegelsteinhausenbergerdorff'))
  assert.ok(has(judge({ stress: stress('long-names'), base, run, changed: 1 }), 'overlap'), 'a real, visible overlap still fires')
})

await check('clip: text inside an endless marquee is not judged', async () => {
  const marquee = (t: string) => `
    <style>@keyframes slide { to { transform: translateX(-50%) } } .m { animation: slide 5s linear infinite; white-space: nowrap; display: inline-block }</style>
    <div style="width:200px;overflow:hidden"><div class="m">${t}</div></div>`
  const base = await snap(marquee('one two three'))
  const run = await snap(marquee('one two three four five six seven eight nine ten eleven'))
  assert.equal(judge({ stress: stress('expand'), base, run, changed: 1 }).outcome, 'pass')
})

// ── Axe: dark theme contrast, only what the stress added ────────────────

const axePath = join('node_modules', 'axe-core', 'axe.min.js')
if (existsSync(axePath)) {
  const axeSource = readFileSync(axePath, 'utf8')
  const contrast = async (html: string) => {
    const { page, close } = await open(html)
    const keys = await runAxe(page, axeSource, ['color-contrast'])
    await close()
    return keys
  }

  await check('dark: a contrast failure the baseline did not have is reported', async () => {
    const good = '<p style="color:#111;background:#fff">Readable text here</p>'
    const bad = '<p style="color:#777;background:#888">Unreadable text here</p>'
    const base = await contrast(good)
    const run = await contrast(bad)
    const verdict = judge({
      stress: stress('dark'),
      base: await snap(good),
      run: await snap(bad),
      axe: { base, run },
    })
    assert.equal(verdict.outcome, 'fail')
    assert.ok(has(verdict, 'new-violation'))
  })

  await check('dark: a contrast failure present in both runs is not blamed on dark', async () => {
    const bad = '<p style="color:#777;background:#888">Unreadable text here</p>'
    const both = await contrast(bad)
    const verdict = judge({
      stress: stress('dark'),
      base: await snap(bad),
      run: await snap(bad),
      axe: { base: both, run: both },
    })
    assert.equal(verdict.outcome, 'pass')
  })
} else {
  console.log('  skip axe checks: axe-core is not installed')
}

// ── Empty data ──────────────────────────────────────────────────────────

await check('empty data: a heading left with no content is reported by axe', async () => {
  if (!existsSync(axePath)) return
  const axeSource = readFileSync(axePath, 'utf8')
  const rules = ['empty-heading', 'link-name', 'button-name']
  const filled = await open('<h3>Ada Lovelace</h3>')
  const before = await runAxe(filled.page, axeSource, rules)
  await filled.close()
  const blank = await open('<h3></h3>')
  const after = await runAxe(blank.page, axeSource, rules)
  await blank.close()
  const verdict = judge({
    stress: stress('empty-data'),
    base: await snap('<h3>Ada Lovelace</h3>'),
    run: await snap('<h3></h3>'),
    changed: 1,
    axe: { base: before, run: after },
  })
  assert.equal(verdict.outcome, 'fail')
})

await browser.close()

console.log(`\ntest-stress: ${passed} passed, ${failures.length} failed.`)
if (failures.length > 0) {
  console.error(`failed: ${failures.join('; ')}`)
  process.exit(1)
}
