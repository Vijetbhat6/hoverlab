/**
 * The animation emitter, and the two claims the pages built on it make.
 *
 * The first is the guard: every animation this site hands out carries a
 * `prefers-reduced-motion` rule, and which rule depends on whether it loops.
 * That is audited across the catalog by `test:motion`; this is the same claim
 * checked at its source, so a change to the emitter cannot quietly weaken it.
 *
 * The second is that /tools/motion and /tools/keyframes cannot disagree.
 * They share this module, and the presets are `Animation` values, so the test
 * that matters is that a preset's published CSS is exactly what the editor
 * would emit after opening it.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  animationShorthand,
  buildAnimationCss,
  declarationsOf,
  keyframesBlock,
  safeName,
  sortStops,
  stopAt,
  withIds,
  type Animation,
} from './keyframes-css'
import { MOTION_PRESETS, buildMotionCss, motionClass } from './motion-presets'

function anim(over: Partial<Animation> = {}): Animation {
  return {
    duration: 600,
    delay: 0,
    easing: 'ease-out',
    iterations: 1,
    direction: 'normal',
    fill: 'both',
    stops: withIds([stopAt(0, { opacity: 0, y: 16 }), stopAt(100)]),
    ...over,
  }
}

test('a stop that changes nothing is written out, not left empty', () => {
  // An empty frame is a hole: the property falls back to its unanimated
  // value halfway through, which is never what was drawn on the timeline.
  assert.deepEqual(declarationsOf({ ...stopAt(100), id: 1 }), ['transform: none;'])
})

test('transforms compose in a fixed order', () => {
  const [d] = declarationsOf({ ...stopAt(50, { x: 4, y: -8, rotate: 90, scale: 50 }), id: 1 })
  assert.equal(d, 'transform: translate(4px, -8px) rotate(90deg) scale(0.5);')
})

test('percentages become fractions', () => {
  assert.deepEqual(declarationsOf({ ...stopAt(0, { opacity: 40, blur: 2 }), id: 1 }), [
    'opacity: 0.4;',
    'filter: blur(2px);',
  ])
})

test('stops are emitted in timeline order, whatever order they were made in', () => {
  const stops = withIds([stopAt(100), stopAt(0, { opacity: 0 }), stopAt(50, { y: 4 })])
  assert.deepEqual(
    sortStops(stops).map((s) => s.at),
    [0, 50, 100],
  )
  const lines = keyframesBlock('x', stops).split('\n')
  assert.deepEqual(
    lines.filter((l) => l.includes('%')).map((l) => l.trim()),
    ['0% {', '50% {', '100% {'],
  )
})

test('the shorthand omits every sub-property left at its initial value', () => {
  assert.equal(
    animationShorthand(anim({ fill: 'none' })),
    '600ms ease-out',
    'iterations 1, direction normal and fill none are all the initial values',
  )
  assert.equal(animationShorthand(anim()), '600ms ease-out both')
  assert.equal(animationShorthand(anim({ iterations: 0 })), '600ms ease-out infinite both')
})

test('delay follows duration, because a shorthand reads two times in order', () => {
  assert.equal(animationShorthand(anim({ delay: 120 })), '600ms ease-out 120ms both')
})

test('a one-shot is collapsed under reduced motion, so it still arrives', () => {
  const css = buildAnimationCss('rise', anim())
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /animation-duration: 0\.01ms !important/)
  assert.doesNotMatch(css, /animation: none/)
})

test('a loop is stopped outright, not run very fast forever', () => {
  const css = buildAnimationCss('pulse', anim({ iterations: 0 }))
  assert.match(css, /animation: none;/)
  assert.doesNotMatch(css, /0\.01ms/)
})

test('names are folded to something valid in both places they land', () => {
  assert.equal(safeName('Rise In!'), 'rise-in')
  assert.equal(safeName('3d spin'), 'a3d-spin')
  assert.equal(safeName('   '), 'animation')
})

test('every motion preset is guarded', () => {
  for (const preset of MOTION_PRESETS) {
    const css = buildMotionCss(preset)
    assert.match(
      css,
      /@media \(prefers-reduced-motion: reduce\)/,
      `${preset.id} ships without a guard`,
    )
  }
})

test('an editable preset publishes exactly what the editor would emit', () => {
  // The promise "Edit in the keyframes editor" makes. If these ever differ,
  // the button opens something other than what the gallery handed out.
  for (const preset of MOTION_PRESETS) {
    if (!preset.anim) continue
    assert.equal(
      buildMotionCss(preset),
      buildAnimationCss(motionClass(preset), preset.anim),
      `${preset.id} drifted from its own animation`,
    )
  }
})

test('a preset that is not editable says why', () => {
  for (const preset of MOTION_PRESETS) {
    if (preset.anim) continue
    assert.ok(preset.frames && preset.timing, `${preset.id} has neither stops nor CSS`)
    assert.ok(preset.notEditable, `${preset.id} hides its Edit button without saying why`)
  }
})
