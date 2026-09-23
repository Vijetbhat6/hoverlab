import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { bucketForHue, declarationsOf, dominantColors, rgbToOklch } from './color'

describe('bucketForHue', () => {
  test('lands the Tailwind hues people name in the bucket they would name', () => {
    const cases: Array<[string, number, ReturnType<typeof bucketForHue>]> = [
      ['rose', 17, 'red'],
      ['red', 25, 'red'],
      ['orange', 50, 'orange'],
      ['amber', 76, 'orange'],
      ['yellow', 90, 'yellow'],
      ['green', 149, 'green'],
      ['emerald', 163, 'green'],
      ['teal', 181, 'cyan'],
      ['cyan', 215, 'cyan'],
      ['sky', 237, 'blue'],
      ['blue', 260, 'blue'],
      ['violet', 293, 'purple'],
      ['fuchsia', 322, 'purple'],
      ['pink', 354, 'pink'],
    ]
    for (const [name, hue, bucket] of cases) assert.equal(bucketForHue(hue), bucket, name)
  })

  test('wraps around zero', () => {
    assert.equal(bucketForHue(-5), 'pink')
    assert.equal(bucketForHue(365), 'red')
  })
})

describe('rgbToOklch', () => {
  test('primaries have the expected hue neighbourhood', () => {
    assert.ok(Math.abs(rgbToOklch(1, 0, 0).h - 29) < 3)
    assert.ok(Math.abs(rgbToOklch(0, 0, 1).h - 264) < 3)
    assert.ok(rgbToOklch(0.5, 0.5, 0.5).c < 0.01)
  })
})

describe('declarationsOf', () => {
  test('reads declarations and skips selectors, so an id that looks like hex is not a colour', () => {
    const decls = declarationsOf('#fade { color: #3b82f6; } .a:hover { background: red }')
    assert.deepEqual(
      decls.map((d) => d.prop),
      ['color', 'background'],
    )
  })

  test('ignores url() payloads, strings and comments', () => {
    const decls = declarationsOf(
      '.a { background: url(data:image/png;base64,AAAA#ff0000); content: "#ff0000"; /* #00ff00 */ color: #0000ff }',
    )
    const joined = decls.map((d) => d.value).join(' ')
    assert.ok(!joined.includes('ff0000'))
    assert.ok(!joined.includes('00ff00'))
    assert.ok(joined.includes('0000ff'))
  })

  test('reads declarations inside keyframes', () => {
    const decls = declarationsOf('@keyframes p { 0% { color: #ef4444 } 100% { color: #ef4444 } }')
    assert.equal(decls.length, 2)
  })
})

describe('dominantColors', () => {
  test('one clear hue is tagged, whatever the literal syntax', () => {
    assert.deepEqual(dominantColors('.a { color: #3b82f6; border: 1px solid rgba(59,130,246,.4) }'), ['blue'])
    assert.deepEqual(dominantColors('.a { background: hsl(142 71% 45%) }'), ['green'])
    assert.deepEqual(dominantColors('.a { background: oklch(0.7 0.19 25) }'), ['red'])
    assert.deepEqual(dominantColors('.a { color: #ef4444 } .b { color: #ef4444 }'), ['red'])
    assert.deepEqual(dominantColors('.a { color: #ec4899 }'), ['pink'])
    assert.deepEqual(dominantColors('.a { color: #eab308 }'), ['yellow'])
  })

  test('a two-hue gradient carries both, most prominent first', () => {
    const got = dominantColors('.a { background: linear-gradient(90deg, #0ea5e9, #6366f1) }')
    assert.equal(got.length, 2)
    assert.deepEqual([...got].sort(), ['blue', 'purple'])
  })

  test('a rainbow clears no bucket and is left untagged', () => {
    const css =
      '.a { background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899) }'
    assert.deepEqual(dominantColors(css), [])
  })

  test('colour that lives only in variables is not guessed at', () => {
    assert.deepEqual(dominantColors('.a { color: var(--accent); background: hsl(var(--primary) / .1) }'), [])
    assert.deepEqual(dominantColors('.a { color: currentColor }'), [])
    assert.deepEqual(dominantColors(''), [])
  })

  test('slate navy backgrounds are neutral, so the accent decides', () => {
    assert.deepEqual(dominantColors('.a { background: #0f172a; border: 1px solid #1e293b; color: #f97316 }'), ['orange'])
  })

  test('near-transparent colours do not count', () => {
    assert.deepEqual(dominantColors('.a { color: rgba(239,68,68,0.05) }'), [])
  })

  test('shadows count for a quarter', () => {
    const got = dominantColors('.a { color: #3b82f6; box-shadow: 0 0 20px #ef4444 }')
    assert.deepEqual(got, ['blue'])
  })

  test('inline styles and SVG paint attributes in markup are read', () => {
    assert.deepEqual(dominantColors('', '<div style="background:#22c55e"></div>'), ['green'])
    assert.deepEqual(dominantColors('', '<svg><path fill="#a855f7"/></svg>'), ['purple'])
  })

  test('mono needs several real neutrals and no variable-hidden colour', () => {
    assert.deepEqual(dominantColors('.a { color: #fff; background: #000; border: 1px solid #888 }'), ['mono'])
    assert.deepEqual(dominantColors('.a { color: #fff; background: #000 }'), [])
    assert.deepEqual(
      dominantColors('.a { color: #fff; background: var(--x); border: 1px solid #888; outline: 1px solid #000 }'),
      [],
    )
  })
})
