import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { STRESSES, STRESS_FAMILIES, type StressId } from './conditions'
import { familiesPassed, familyState, summarize, type StoredOutcome, type StoredResult } from './report'

function result(outcomes: Partial<Record<StressId, StoredOutcome>>): StoredResult {
  return { h: 'x', at: '2026-09-21', s: outcomes }
}

/** Every condition passing. */
function allPass(): Partial<Record<StressId, StoredOutcome>> {
  return Object.fromEntries(STRESSES.map((s) => [s.id, 1])) as Partial<Record<StressId, StoredOutcome>>
}

describe('familyState', () => {
  it('passes only when nothing failed and something actually ran', () => {
    assert.equal(familyState(result(allPass()), 'pseudo-locale'), 'pass')
  })

  it('a single failing condition fails the whole family', () => {
    assert.equal(familyState(result({ ...allPass(), cjk: 0 }), 'pseudo-locale'), 'fail')
    // ...and only that family
    assert.equal(familyState(result({ ...allPass(), cjk: 0 }), 'text-scale'), 'pass')
  })

  it('a family whose conditions were all not-applicable is untested, not passed', () => {
    const r = result({ ...allPass(), 'long-names': 2, 'empty-data': 2, 'huge-numbers': 2 })
    assert.equal(familyState(r, 'data-extremes'), 'untested')
  })

  it('not-applicable alongside a real pass still passes', () => {
    const r = result({ ...allPass(), 'long-names': 2, 'empty-data': 2 })
    assert.equal(familyState(r, 'data-extremes'), 'pass')
  })

  it('a condition that could not be measured never counts as a pass', () => {
    const r = result({ ...allPass(), 'forced-colors': 3 })
    assert.equal(familyState(r, 'forced-colors'), 'untested')
  })

  it('no result at all is untested', () => {
    assert.equal(familyState(undefined, 'reduced-motion'), 'untested')
  })
})

describe('summarize', () => {
  const results = {
    'block:a': result(allPass()),
    'block:b': result({ ...allPass(), expand: 0 }),
    'page:c': result({ ...allPass(), expand: 0, dark: 0 }),
  }

  it('counts an artifact as clean only when every family passes', () => {
    assert.equal(familiesPassed(results['block:a']), STRESS_FAMILIES.length)
    assert.equal(summarize(results).cleanAll, 1)
    assert.equal(summarize(results).measured, 3)
  })

  it('tallies each family and ranks conditions by failures', () => {
    const summary = summarize(results)
    const locale = summary.byFamily.find((f) => f.family === 'pseudo-locale')!
    assert.deepEqual([locale.pass, locale.fail, locale.untested], [1, 2, 0])
    assert.equal(summary.byStress[0].stress, 'expand')
    assert.equal(summary.byStress[0].fail, 2)
  })

  it('can be filtered to one level', () => {
    assert.equal(summarize(results, (key) => key.startsWith('block:')).measured, 2)
  })
})
