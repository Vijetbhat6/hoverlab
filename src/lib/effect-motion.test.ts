/**
 * The motion-safety profile: what it claims, and that the claims cannot
 * quietly drift.
 *
 * Two kinds of test. The synthetic ones pin the rules with small CSS
 * strings, including the failure and caution paths — nothing in the current
 * catalog exceeds 3 flashes a second, so without them the `fail` branch would
 * be untested code that has never once returned. The catalog ones check the
 * whole shipped set against the generated file.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { EFFECTS } from './effects'
import { analyzeEffect, withMotionGuard } from './effect-insights'
import {
  FLASH_LIMIT_HZ,
  SHADER_MOTION,
  analyzeEffectMotion,
  classifyProperty,
  compactMotion,
  expandMotion,
  sameMotion,
  type CompactMotion,
} from './effect-motion'
import { getEffectMotion } from './effect-motion-data'
import MOTION from './generated-effect-motion.json'
import { isShaderRenderer } from './shaders/shader-types'

/** CSS for a looping animation, as the catalog writes them. */
function loop(keyframes: string, animation: string, extra = ''): string {
  return `.fx-t { width: 100px; height: 100px; ${extra} animation: fx-t-k ${animation}; }\n@keyframes fx-t-k { ${keyframes} }`
}

/* ---------------- property class ---------------- */

test('a transform + opacity animation is compositor-only', () => {
  const p = analyzeEffectMotion(loop('from { transform: scale(1); opacity: 1 } to { transform: scale(1.1); opacity: .6 }', '2s ease infinite alternate'))
  assert.equal(p.propertyClass, 'compositor')
  assert.deepEqual(p.offending, [])
  assert.equal(p.layoutShift, 'none')
})

test('a paint property makes it paint, and is listed', () => {
  const p = analyzeEffectMotion(loop('0% { box-shadow: 0 0 4px red; transform: none } 100% { box-shadow: 0 0 20px red; transform: none }', '2s ease infinite'))
  assert.equal(p.propertyClass, 'paint')
  assert.deepEqual(p.offending, ['box-shadow'])
  assert.equal(p.layoutShift, 'none')
})

test('layout beats paint beats compositor, and layout properties are listed first', () => {
  const p = analyzeEffectMotion(loop('0% { transform: none; color: red; width: 10px } 100% { transform: none; color: blue; width: 90px }', '2s linear infinite'))
  assert.equal(p.propertyClass, 'layout')
  assert.deepEqual(p.offending, ['width', 'color'])
  assert.equal(p.layoutShift, 'shifts')
})

test('a transition counts only the properties its state rules actually change', () => {
  const css = `.fx-t { transition: transform .3s ease, box-shadow .3s ease, width .3s ease; }
.fx-t:hover { transform: translateY(-2px); }`
  const p = analyzeEffectMotion(css)
  // box-shadow and width are listed but never move, so nothing there transitions.
  assert.equal(p.propertyClass, 'compositor')
  assert.deepEqual(p.offending, [])
})

test('transition: all is read through the state rules', () => {
  const p = analyzeEffectMotion('.fx-t { transition: all .3s; } .fx-t:hover { width: 200px; }')
  assert.equal(p.propertyClass, 'layout')
  assert.deepEqual(p.offending, ['width'])
})

test('a transition with no state rule is trusted as listed', () => {
  const p = analyzeEffectMotion('.fx-t { transition: height .3s; }')
  assert.equal(p.propertyClass, 'layout')
})

test('nothing animated is class none', () => {
  const p = analyzeEffectMotion('.fx-t { color: red; }')
  assert.equal(p.propertyClass, 'none')
  assert.equal(p.reducedMotion, 'none')
  assert.equal(p.animates, false)
})

test('an unknown property is counted as paint but reported', () => {
  const p = analyzeEffectMotion(loop('from { made-up-thing: 1 } to { made-up-thing: 2 }', '1s linear infinite'))
  assert.equal(p.propertyClass, 'paint')
  assert.deepEqual(p.unclassified, ['made-up-thing'])
})

test('property rulings', () => {
  assert.equal(classifyProperty('transform'), 'compositor')
  assert.equal(classifyProperty('filter'), 'compositor')
  assert.equal(classifyProperty('background-position'), 'paint')
  assert.equal(classifyProperty('margin-left'), 'layout')
  assert.equal(classifyProperty('--angle'), 'custom')
  assert.equal(classifyProperty('nonsense'), 'unknown')
})

/* ---------------- reduced motion: one definition ---------------- */

test('reduced-motion state is analyzeEffect().respectsReducedMotion, not a second rule', () => {
  const looping = '.fx-t { animation: fx-t-k 1s linear infinite; }\n@keyframes fx-t-k { to { transform: rotate(1turn) } }'
  const raw = analyzeEffectMotion(looping)
  assert.equal(raw.reducedMotion, 'unguarded')
  assert.equal(analyzeEffect(looping).respectsReducedMotion, false)

  const shipped = withMotionGuard(looping)
  const guarded = analyzeEffectMotion(shipped)
  assert.equal(guarded.reducedMotion, 'guarded')
  assert.equal(analyzeEffect(shipped).respectsReducedMotion, true)
  // The guard block is the fix, not motion: it must not change the class.
  assert.equal(guarded.propertyClass, 'compositor')
})

test('a brief animation is `brief`, matching the catalog policy of guarding only loops', () => {
  const p = analyzeEffectMotion(loop('from { opacity: 0 } to { opacity: 1 }', '.4s ease both'))
  assert.equal(p.reducedMotion, 'brief')
  assert.equal(withMotionGuard(loop('from { opacity: 0 } to { opacity: 1 }', '.4s ease both')).includes('prefers-reduced-motion'), false)
})

/* ---------------- flash rate ---------------- */

test('a slow pulse passes and reports its rate', () => {
  const p = analyzeEffectMotion(loop('0%, 100% { opacity: 1 } 50% { opacity: .3 }', '2s ease-in-out infinite'))
  assert.equal(p.flash.verdict, 'pass')
  assert.equal(p.flash.hz, 0.5)
})

test('alternate direction halves the rate', () => {
  const p = analyzeEffectMotion(loop('from { opacity: 1 } to { opacity: .2 }', '1s ease infinite alternate'))
  assert.equal(p.flash.hz, 0.5)
})

test('a small swing is not a flash', () => {
  const p = analyzeEffectMotion(loop('0%, 100% { opacity: 1 } 50% { opacity: .95 }', '.1s linear infinite'))
  assert.equal(p.flash.hz, null)
  assert.equal(p.flash.verdict, 'pass')
})

test('exactly three flashes a second is allowed', () => {
  const p = analyzeEffectMotion(loop('0%, 100% { opacity: 1 } 50% { opacity: 0 }', '.3333s linear infinite'))
  assert.ok(p.flash.hz !== null && p.flash.hz <= FLASH_LIMIT_HZ + 0.1)
})

test('a fast, strong, full-area flash fails', () => {
  const css = `.fx-t { position: absolute; inset: 0; animation: fx-t-k .2s linear infinite; }
@keyframes fx-t-k { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`
  const p = analyzeEffectMotion(css)
  assert.equal(p.flash.verdict, 'fail')
  assert.equal(p.flash.hz, 5)
})

test('a fast, strong flash on a small element is only a caution', () => {
  const p = analyzeEffectMotion(loop('0%, 100% { opacity: 1 } 50% { opacity: 0 }', '.2s linear infinite'))
  assert.equal(p.flash.verdict, 'caution')
  assert.equal(p.flash.hz, 5)
})

test('background-color alternation is read by luminance', () => {
  const css = `.fx-t { position: absolute; inset: 0; animation: fx-t-k .25s steps(1) infinite; }
@keyframes fx-t-k { 0%, 100% { background-color: #000 } 50% { background-color: #fff } }`
  const p = analyzeEffectMotion(css)
  assert.equal(p.flash.hz, 4)
  assert.equal(p.flash.verdict, 'fail')
})

test('two similar dark colours are not a flash', () => {
  const css = `.fx-t { position: absolute; inset: 0; animation: fx-t-k .2s linear infinite; }
@keyframes fx-t-k { 0%, 100% { background-color: #0f172a } 50% { background-color: #1e293b } }`
  assert.equal(analyzeEffectMotion(css).flash.hz, null)
})

test('a one-shot animation with three or fewer flashes cannot exceed the limit', () => {
  const p = analyzeEffectMotion(loop('0%, 100% { opacity: 1 } 50% { opacity: 0 }', '.1s linear 2'))
  assert.equal(p.flash.verdict, 'pass')
})

test('brightness and invert filters count', () => {
  const css = `.fx-t { position: absolute; inset: 0; animation: fx-t-k .2s linear infinite; }
@keyframes fx-t-k { 0%, 100% { filter: invert(0) } 50% { filter: invert(1) } }`
  assert.equal(analyzeEffectMotion(css).flash.verdict, 'fail')
})

test('scroll-driven animation has no clock and so no flash rate', () => {
  const css = `.fx-t { animation: fx-t-k .1s linear infinite; animation-timeline: scroll(); }
@keyframes fx-t-k { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`
  assert.equal(analyzeEffectMotion(css).flash.hz, null)
})

test('var() durations resolve through the effect custom properties', () => {
  const css = `.fx-t { --d: .2s; position: absolute; inset: 0; animation: fx-t-k var(--d) linear infinite; }
@keyframes fx-t-k { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`
  assert.equal(analyzeEffectMotion(css).flash.hz, 5)
})

/* ---------------- compact form ---------------- */

test('compact then expand round-trips', () => {
  const p = analyzeEffectMotion(loop('0% { width: 1px; color: red } 100% { width: 9px; color: blue }', '1s linear infinite'))
  const back = expandMotion(compactMotion(p))
  assert.ok(back.applicable)
  if (back.applicable) {
    assert.equal(back.propertyClass, 'layout')
    assert.deepEqual(back.offending, ['width', 'color'])
    assert.equal(back.layoutShift, 'shifts')
  }
})

test('a shader row is not applicable', () => {
  const back = expandMotion(SHADER_MOTION)
  assert.equal(back.applicable, false)
})

/* ---------------- the shipped catalog ---------------- */

const ROWS = MOTION as unknown as Record<string, CompactMotion>

test('every effect has a row, and no row is orphaned', () => {
  const ids = new Set(EFFECTS.map((e) => e.id))
  assert.deepEqual(
    EFFECTS.filter((e) => !(e.id in ROWS)).map((e) => e.id),
    [],
    'effects without a motion row: run `npx tsx scripts/build-effect-motion.mts`',
  )
  assert.deepEqual(Object.keys(ROWS).filter((id) => !ids.has(id)), [])
})

test('the generated file equals a fresh analysis of the shipped CSS', () => {
  const stale: string[] = []
  for (const e of EFFECTS) {
    const fresh: CompactMotion = isShaderRenderer(e.renderer)
      ? SHADER_MOTION
      : compactMotion(analyzeEffectMotion(e.css, e.html))
    if (!sameMotion(fresh, ROWS[e.id])) stale.push(e.id)
  }
  assert.deepEqual(stale.slice(0, 10), [], `${stale.length} stale row(s): rebuild generated-effect-motion.json`)
})

test('no animated property in the catalog lacks a ruling', () => {
  const missing = new Set<string>()
  for (const e of EFFECTS) {
    if (isShaderRenderer(e.renderer)) continue
    for (const p of analyzeEffectMotion(e.css, e.html).unclassified) missing.add(p)
  }
  assert.deepEqual([...missing], [], 'add these to the property tables in effect-motion.ts')
})

test('every looping effect is guarded: the audit and the badge agree', () => {
  const unguarded = EFFECTS.filter(
    (e) => !isShaderRenderer(e.renderer) && analyzeEffectMotion(e.css, e.html).reducedMotion === 'unguarded',
  ).map((e) => e.id)
  assert.deepEqual(unguarded.slice(0, 10), [])
})

test('the layout-shift category is exactly the layout class', () => {
  for (const e of EFFECTS) {
    if (isShaderRenderer(e.renderer)) continue
    const p = analyzeEffectMotion(e.css, e.html)
    assert.equal(p.layoutShift === 'shifts', p.propertyClass === 'layout', e.id)
  }
})

test('the lookup expands a stored row', () => {
  const rec = getEffectMotion('btn-gradient')
  assert.ok(rec && rec.applicable)
  assert.equal(getEffectMotion('no-such-effect'), undefined)
})
