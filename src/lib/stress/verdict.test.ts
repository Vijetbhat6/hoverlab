import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { STRESS_BY_ID, STRESSES, STRESS_FAMILIES, stressesInFamily } from './conditions'
import type { StressMeasure } from './measure'
import { judge } from './verdict'

function measure(overrides: Partial<StressMeasure> = {}): StressMeasure {
  return {
    viewportWidth: 1024,
    scrollWidth: 1024,
    overflowX: 0,
    wide: [],
    clipped: [],
    spilled: [],
    overlaps: [],
    paint: [],
    controls: [],
    animations: [],
    textLength: 100,
    elementCount: 30,
    ...overrides,
  }
}

const ref = (key: string, label = key) => ({ key, label })

describe('conditions', () => {
  it('has six families and every condition belongs to one', () => {
    assert.equal(STRESS_FAMILIES.length, 6)
    for (const stress of STRESSES) {
      assert.ok(STRESS_FAMILIES.some((f) => f.id === stress.family), stress.id)
    }
    for (const family of STRESS_FAMILIES) {
      assert.ok(stressesInFamily(family.id).length > 0, family.id)
    }
  })

  it('only offers a live frame for what a page can actually switch on', () => {
    assert.equal(STRESS_BY_ID['forced-colors'].live, false)
    assert.equal(STRESS_BY_ID['reduced-motion'].live, false)
    assert.equal(STRESS_BY_ID.expand.live, true)
  })
})

describe('judge: relative to the baseline', () => {
  const stress = STRESS_BY_ID.expand

  it('passes when nothing was added, even if the baseline already had problems', () => {
    const base = measure({ clipped: [{ ...ref('a:1'), by: 40, axis: 'x' }] })
    const run = measure({ clipped: [{ ...ref('a:1'), by: 40, axis: 'x' }] })
    assert.equal(judge({ stress, base, run, changed: 12 }).outcome, 'pass')
  })

  it('fails on a page that starts scrolling sideways', () => {
    const run = measure({ overflowX: 180, scrollWidth: 1204, wide: [{ ...ref('div:1', 'div "Plan"'), reach: 180 }] })
    const verdict = judge({ stress, base: measure(), run, changed: 5 })
    assert.equal(verdict.outcome, 'fail')
    assert.equal(verdict.findings[0].code, 'page-overflow')
    assert.match(verdict.findings[0].message, /180px/)
  })

  it('ignores one pixel of layout rounding', () => {
    const verdict = judge({ stress, base: measure(), run: measure({ overflowX: 1 }), changed: 5 })
    assert.equal(verdict.outcome, 'pass')
  })

  it('fails on newly clipped text and on clipping that grows a lot', () => {
    const base = measure({ clipped: [{ ...ref('a:1'), by: 4, axis: 'y' }] })
    const grown = measure({ clipped: [{ ...ref('a:1'), by: 40, axis: 'y' }] })
    assert.equal(judge({ stress, base, run: grown, changed: 5 }).outcome, 'fail')

    const fresh = measure({ clipped: [{ ...ref('b:2', 'h3 "Wolfe"'), by: 30, axis: 'x' }] })
    const verdict = judge({ stress, base: measure(), run: fresh, changed: 5 })
    assert.equal(verdict.outcome, 'fail')
    assert.match(verdict.findings[0].message, /Wolfe/)
  })

  it('does not fail on clipping that grew by less than the threshold', () => {
    const base = measure({ clipped: [{ ...ref('a:1'), by: 4, axis: 'y' }] })
    const run = measure({ clipped: [{ ...ref('a:1'), by: 10, axis: 'y' }] })
    assert.equal(judge({ stress, base, run, changed: 5 }).outcome, 'pass')
  })

  it('fails on new text collisions only', () => {
    const pair = { key: 'p:1|p:2', a: 'p "A"', b: 'p "B"', area: 300 }
    assert.equal(judge({ stress, base: measure({ overlaps: [pair] }), run: measure({ overlaps: [pair] }), changed: 5 }).outcome, 'pass')
    assert.equal(judge({ stress, base: measure(), run: measure({ overlaps: [pair] }), changed: 5 }).outcome, 'fail')
  })

  it('is not applicable when the transform had nothing to act on', () => {
    const verdict = judge({ stress: STRESS_BY_ID['huge-numbers'], base: measure(), run: measure(), changed: 0 })
    assert.equal(verdict.outcome, 'na')
  })
})

describe('judge: spilled text', () => {
  it('fails a word that runs out of its own box, and only a new one', () => {
    const spill = { ...ref('div:1', 'div "Wolfe"'), by: 60 }
    const stress = STRESS_BY_ID['long-names']
    assert.equal(judge({ stress, base: measure(), run: measure({ spilled: [spill] }), changed: 4 }).outcome, 'fail')
    assert.equal(
      judge({ stress, base: measure({ spilled: [spill] }), run: measure({ spilled: [spill] }), changed: 4 }).outcome,
      'pass',
    )
  })
})

describe('judge: reflow is absolute', () => {
  const stress = STRESS_BY_ID['reflow-400']

  it('fails on any sideways scroll at 320px, with nothing to compare against', () => {
    const run = measure({ viewportWidth: 320, overflowX: 96, wide: [{ ...ref('table:1', 'table'), reach: 96 }] })
    const verdict = judge({ stress, base: null, run })
    assert.equal(verdict.outcome, 'fail')
    assert.match(verdict.findings[0].message, /96px at 320px/)
  })

  it('passes when the page fits', () => {
    assert.equal(judge({ stress, base: null, run: measure({ viewportWidth: 320 }) }).outcome, 'pass')
  })
})

describe('judge: forced colors', () => {
  const stress = STRESS_BY_ID['forced-colors']
  const fill = { ...ref('div:2>div:1', 'div'), bg: 'oklch(0.6 0.2 150)', parentBg: 'oklch(0.9 0 0)', width: 120, height: 8, hasEdge: false }

  it('fails a progress bar that is only a background colour', () => {
    const run = measure({ paint: [{ ...fill, bg: 'rgb(255, 255, 255)', parentBg: 'rgb(255, 255, 255)' }] })
    const verdict = judge({ stress, base: measure({ paint: [fill] }), run })
    assert.equal(verdict.outcome, 'fail')
    assert.equal(verdict.findings[0].code, 'shape-lost')
  })

  it('fails when the fill vanishes from the measurement entirely', () => {
    assert.equal(judge({ stress, base: measure({ paint: [fill] }), run: measure() }).outcome, 'fail')
  })

  it('passes a shape that has its own border', () => {
    const bordered = { ...fill, hasEdge: true }
    assert.equal(judge({ stress, base: measure({ paint: [bordered] }), run: measure() }).outcome, 'pass')
  })

  it('ignores hairline dividers', () => {
    const divider = { ...fill, height: 1 }
    assert.equal(judge({ stress, base: measure({ paint: [divider] }), run: measure() }).outcome, 'pass')
  })

  it('fails a form field with no border and no outline', () => {
    const run = measure({ controls: [{ ...ref('input:1', 'input'), hasBorder: false, hasOutline: false }] })
    const verdict = judge({ stress, base: measure(), run })
    assert.equal(verdict.outcome, 'fail')
    assert.equal(verdict.findings[0].code, 'control-boundary')
  })
})

describe('judge: reduced motion', () => {
  const stress = STRESS_BY_ID['reduced-motion']
  const marquee = { ...ref('div:1', 'div "Logos"'), name: 'marquee', duration: 30000, width: 1200, height: 40 }
  const spinner = { ...ref('svg:1', 'svg'), name: 'spin', duration: 1000, width: 20, height: 20 }

  it('fails an endless decorative animation', () => {
    const verdict = judge({ stress, base: measure(), run: measure({ animations: [marquee] }) })
    assert.equal(verdict.outcome, 'fail')
    assert.match(verdict.findings[0].message, /marquee/)
  })

  it('allows a small status spinner, which is degraded rather than stopped', () => {
    assert.equal(judge({ stress, base: measure(), run: measure({ animations: [spinner] }) }).outcome, 'pass')
  })

  it('does not excuse a big spinner-named animation', () => {
    const big = { ...spinner, width: 400, height: 400 }
    assert.equal(judge({ stress, base: measure(), run: measure({ animations: [big] }) }).outcome, 'fail')
  })
})

describe('judge: axe', () => {
  it('fails only on violations the baseline did not have', () => {
    const stress = STRESS_BY_ID.dark
    const same = judge({ stress, base: measure(), run: measure(), axe: { base: ['color-contrast::.a'], run: ['color-contrast::.a'] } })
    assert.equal(same.outcome, 'pass')

    const added = judge({ stress, base: measure(), run: measure(), axe: { base: [], run: ['color-contrast::.b'] } })
    assert.equal(added.outcome, 'fail')
    assert.match(added.findings[0].message, /color-contrast on \.b/)
  })
})

describe('judge: long lists are summarised', () => {
  it('names three and counts the rest', () => {
    const clipped = Array.from({ length: 6 }, (_, i) => ({ ...ref(`x:${i}`, `h${i}`), by: 30, axis: 'x' as const }))
    const verdict = judge({ stress: STRESS_BY_ID.expand, base: measure(), run: measure({ clipped }), changed: 3 })
    assert.match(verdict.findings[0].message, /and 3 more/)
  })
})
