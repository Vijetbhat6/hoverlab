/**
 * Scale inference and drift reporting.
 *
 * The property under test is restraint. Each case that must NOT be reported
 * matters as much as the ones that must: a drift report that cries wolf gets
 * switched off, and these are the ways it would.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  THRESHOLDS,
  collapseProps,
  emptyUsage,
  inferTokens,
  mergeUsage,
  parseShadow,
} from '../src/audit-url/tokens.mjs'

/** `{ '12': 40 }` becomes usage buckets with those counts. */
function bucket(counts, extra = () => ({})) {
  const out = {}
  for (const [key, count] of Object.entries(counts)) {
    out[key] = { count, ex: [{ page: '/', selector: `x-${key}`, detail: key }], ...extra(key) }
  }
  return out
}

const hex = (n) => `#${n.toString(16).padStart(2, '0').repeat(3)}`
const rgba = (n) => [n, n, n, 1]

function usageOf(parts) {
  return { ...emptyUsage(), ...parts }
}

const rules = (result) => result.findings.map((f) => f.rule)

test('spacing: an odd value on a 4px grid is reported with how far off it is', () => {
  const result = inferTokens(usageOf({ spacing: bucket({ 4: 10, 8: 30, 12: 20, 16: 30, 13: 1 }) }))
  assert.equal(result.scales.spacing.grid, 4)
  const [finding] = result.findings
  assert.equal(finding.rule, 'spacing-off-grid')
  assert.equal(finding.count, 1)
  assert.deepEqual(finding.data, { value: 13, nearest: 12, delta: 1, grid: 4 })
  assert.match(finding.message, /13px is off the 4px grid/)
})

test('spacing: half-steps (6, 10, 14) and hairlines are the site scale, not drift', () => {
  const result = inferTokens(usageOf({ spacing: bucket({ 4: 10, 8: 30, 16: 30, 6: 3, 10: 2, 14: 1, 1: 4 }) }))
  assert.equal(result.scales.spacing.grid, 4)
  assert.deepEqual(result.findings, [])
})

test('spacing: an odd value used everywhere is established and left alone', () => {
  const result = inferTokens(usageOf({ spacing: bucket({ 4: 10, 8: 30, 16: 30, 13: 12 }) }))
  assert.deepEqual(result.findings, [])
})

test('spacing: too few declarations to infer anything reports nothing', () => {
  const result = inferTokens(usageOf({ spacing: bucket({ 8: 5, 13: 1 }) }))
  assert.equal(result.scales.spacing.grid, null)
  assert.deepEqual(result.findings, [])
})

test('spacing: a site with no grid gets no spacing findings', () => {
  const result = inferTokens(usageOf({ spacing: bucket({ 7: 10, 9: 10, 11: 10, 13: 10, 5: 10 }) }))
  assert.equal(result.scales.spacing.grid, null)
  assert.deepEqual(result.findings, [])
})

test('spacing: a 4px grid with Tailwind half-steps is still a 4px grid', () => {
  // about 60% on 4, everything else on 2: the shape of a site using p-1.5 and py-2.5 freely.
  const result = inferTokens(usageOf({ spacing: bucket({ 4: 25, 8: 25, 6: 15, 10: 10, 2: 5, 13: 1 }) }))
  assert.equal(result.scales.spacing.grid, 4)
  assert.equal(rules(result).join(), 'spacing-off-grid')
})

test('radius: a rare value one pixel from a dominant one is drift; a distant one is not', () => {
  const near = inferTokens(usageOf({ radius: bucket({ 8: 30, 12: 10, 7: 1 }) }))
  assert.equal(near.findings.length, 1)
  assert.equal(near.findings[0].rule, 'radius-drift')
  assert.equal(near.findings[0].data.value, 7)
  assert.equal(near.findings[0].data.near, 8)

  const far = inferTokens(usageOf({ radius: bucket({ 8: 30, 12: 10, 2: 1 }) }))
  assert.deepEqual(far.findings, [])
})

test('radius: a value used as often as the dominant one is a second step, not drift', () => {
  const result = inferTokens(usageOf({ radius: bucket({ 8: 30, 7: 10 }) }))
  assert.deepEqual(result.findings, [])
})

test('type: 15px among 14 and 16 is reported; 10px beside 12px is a deliberate micro size', () => {
  const drift = inferTokens(usageOf({ font: bucket({ 16: 30, 14: 10, 15: 1 }) }))
  assert.equal(drift.findings.length, 1)
  assert.equal(drift.findings[0].rule, 'type-drift')
  assert.equal(drift.findings[0].data.value, 15)

  const micro = inferTokens(usageOf({ font: bucket({ 12: 27, 14: 10, 16: 20, 10: 3 }) }))
  assert.deepEqual(micro.findings, [])
})

test('colour: a near-duplicate of a dominant colour is reported, with the distance', () => {
  const usage = usageOf({
    color: bucket({ '#f4f4f5': 30, '#f6f6f7': 1, '#222222': 20 }, (key) => ({
      rgba: key === '#f4f4f5' ? [244, 244, 245, 1] : key === '#f6f6f7' ? [246, 246, 247, 1] : [34, 34, 34, 1],
    })),
  })
  const result = inferTokens(usage)
  assert.equal(result.findings.length, 1)
  assert.equal(result.findings[0].rule, 'color-near-duplicate')
  assert.equal(result.findings[0].data.value, '#f6f6f7')
  assert.equal(result.findings[0].data.near, '#f4f4f5')
  assert.ok(result.findings[0].data.deltaE < 1.5)
})

test('colour: pure white next to an off-white is intent, not drift', () => {
  const usage = usageOf({
    color: bucket({ '#f4f4f5': 30, '#ffffff': 1, '#222222': 20 }, (key) => ({
      rgba: key === '#f4f4f5' ? [244, 244, 245, 1] : key === '#ffffff' ? [255, 255, 255, 1] : [34, 34, 34, 1],
    })),
  })
  assert.deepEqual(inferTokens(usage).findings, [])
})

test('colour: fourteen different greys is reported as sprawl; eight is not', () => {
  const make = (n) => {
    const counts = {}
    for (let i = 1; i <= n; i++) counts[hex(i * 16)] = 5
    return usageOf({ color: bucket(counts, (key) => ({ rgba: rgba(parseInt(key.slice(1, 3), 16)) })) })
  }
  const sprawl = inferTokens(make(14))
  assert.ok(rules(sprawl).includes('grey-sprawl'))
  assert.equal(sprawl.findings.find((f) => f.rule === 'grey-sprawl').count, 14)
  assert.ok(!rules(inferTokens(make(8))).includes('grey-sprawl'))
})

test('shadow: parses layers with colours that contain commas', () => {
  const layers = parseShadow('rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px')
  assert.equal(layers.length, 2)
  assert.deepEqual(layers[0].nums, [0, 4, 6, -1])
  assert.equal(layers[0].color, 'rgba(0,0,0,0.1)')
  assert.equal(layers[0].inset, false)
  assert.equal(parseShadow('rgb(0 0 0) 1px 1px 0px 0px inset')[0].inset, true)
})

test('shadow: a rare shadow within 2px of a dominant one is drift', () => {
  const a = 'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px'
  const b = 'rgba(0, 0, 0, 0.1) 0px 5px 6px -1px'
  const far = 'rgba(0, 0, 0, 0.1) 0px 20px 40px 0px'
  const result = inferTokens(usageOf({ shadow: bucket({ [a]: 20, [b]: 1, [far]: 1 }) }))
  assert.equal(result.findings.length, 1)
  assert.equal(result.findings[0].rule, 'shadow-drift')
  assert.equal(result.findings[0].data.value, b)
})

test('merging usages sums counts and keeps at most five examples', () => {
  const a = usageOf({ spacing: bucket({ 8: 3 }) })
  const b = usageOf({ spacing: bucket({ 8: 4, 12: 1 }) })
  a.spacing['8'].ex = ['1', '2', '3', '4']
  b.spacing['8'].ex = ['5', '6', '7']
  mergeUsage(a, b)
  assert.equal(a.spacing['8'].count, 7)
  assert.equal(a.spacing['8'].ex.length, 5)
  assert.equal(a.spacing['12'].count, 1)
})

test('property lists collapse to what a person would write', () => {
  assert.equal(collapseProps(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']), 'padding')
  assert.equal(collapseProps(['margin-bottom']), 'margin-bottom')
  assert.equal(collapseProps(['padding-left', 'padding-right', 'row-gap']), 'padding-left/right, row-gap')
})

test('the thresholds the docs quote are the ones in force', () => {
  assert.equal(THRESHOLDS.spacing.grid, 4)
  assert.ok(THRESHOLDS.color.greySprawl > 11, 'a full 11-step ramp must not count as sprawl')
})
