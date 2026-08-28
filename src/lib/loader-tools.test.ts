/**
 * Unit tests for the loader generator.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/loader-tools.test.ts
 *
 * Two things are worth pinning here and they are not the shapes.
 *
 * The first is that every family a user can pick emits a `role="status"`, an
 * accessible name and a reduced-motion guard. Those are the parts a loader
 * ships without, they are invisible in the preview, and a regression in them
 * would look exactly like working code.
 *
 * The second is `seedFromCss`, which reads a catalog loader's numbers back
 * out of its stylesheet. It is an approximation by design, so what is tested
 * is that it never returns something absurd — a zero duration, a size of
 * 4000, a track colour mistaken for the brand.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLoader,
  DEFAULT_LOADER,
  dominantColorIn,
  familyFromTags,
  LOADER_FAMILIES,
  seedFromCss,
  type LoaderFamily,
} from './loader-tools'

const EVERY_FAMILY = LOADER_FAMILIES.map((family) => family.id)

describe('buildLoader', () => {
  it('covers every family it advertises', () => {
    for (const family of EVERY_FAMILY) {
      const { html, css } = buildLoader({ ...DEFAULT_LOADER, family })
      assert.ok(css.includes('@keyframes'), `${family} has no animation`)
      assert.ok(html.includes('<div'), `${family} emitted no markup`)
    }
  })

  it('announces itself to a screen reader, whichever family it is', () => {
    for (const family of EVERY_FAMILY) {
      const { html, css } = buildLoader({
        ...DEFAULT_LOADER,
        family,
        label: 'Saving changes',
      })
      assert.ok(html.includes('role="status"'), `${family} is silent`)
      assert.ok(html.includes('Saving changes'), `${family} has no accessible name`)
      // The name has to be hidden visually but not from the a11y tree —
      // display:none would remove it from both and leave an empty status.
      assert.ok(css.includes('clip-path: inset(50%)'))
      assert.ok(!css.includes('display: none'))
    }
  })

  it('guards every family against prefers-reduced-motion', () => {
    for (const family of EVERY_FAMILY) {
      const { css } = buildLoader({ ...DEFAULT_LOADER, family })
      assert.ok(
        css.includes('@media (prefers-reduced-motion: reduce)'),
        `${family} animates forever with no way out`,
      )
      // Collapsed rather than switched off: `animation: none` would drop a
      // resting state that only exists in the keyframes.
      assert.ok(css.includes('animation-duration: 1ms !important'))
    }
  })

  it('writes the CSS against the class name it was given', () => {
    const { html, css } = buildLoader({ ...DEFAULT_LOADER, className: 'app-spinner' })
    assert.ok(css.startsWith('.app-spinner {'))
    assert.ok(html.includes('class="app-spinner"'))
    assert.ok(!css.includes('.loader '))
  })

  it('names its keyframes after the class, so two loaders can coexist', () => {
    const one = buildLoader({ ...DEFAULT_LOADER, className: 'a' })
    const two = buildLoader({ ...DEFAULT_LOADER, className: 'b', family: 'dots' })
    assert.deepEqual(one.keyframes, ['a-anim'])
    assert.deepEqual(two.keyframes, ['b-anim'])
    // Keyframe names are global. Same name in both would mean whichever
    // stylesheet loaded second silently redefined the first loader.
    assert.notEqual(one.keyframes[0], two.keyframes[0])
  })

  it('draws one child per dot or bar, and staggers them', () => {
    const dots = buildLoader({ ...DEFAULT_LOADER, family: 'dots', count: 5 })
    assert.equal(dots.html.match(/<span><\/span>/g)?.length, 5)
    // Five staggered children, each addressed by position. (The sixth
    // animation-delay in the stylesheet is the reduced-motion guard zeroing
    // them all, which is the point of the guard.)
    assert.equal(dots.css.match(/nth-child\(\d\) \{ animation-delay/g)?.length, 5)
    assert.ok(dots.css.includes('nth-child(5)'))

    const bars = buildLoader({ ...DEFAULT_LOADER, family: 'bars', count: 4 })
    assert.equal(bars.html.match(/<span><\/span>/g)?.length, 4)
  })

  it('scales bars with a transform rather than a height', () => {
    // A height animation is a layout pass per frame; a transform is not.
    const { css } = buildLoader({ ...DEFAULT_LOADER, family: 'bars' })
    assert.ok(css.includes('scaleY'))
    assert.ok(!/height:\s*\d+%.*\n.*animation/.test(css))
  })

  it('ships both mask spellings for the conic ring', () => {
    const { css } = buildLoader({ ...DEFAULT_LOADER, family: 'conic' })
    assert.ok(css.includes('-webkit-mask:'))
    assert.ok(css.includes('\n  mask:'))
  })

  it('takes the colours it is given', () => {
    const { css } = buildLoader({
      ...DEFAULT_LOADER,
      color: '#ff0000',
      trackColor: '#eeeeee',
    })
    assert.ok(css.includes('#ff0000'))
    assert.ok(css.includes('#eeeeee'))
  })
})

describe('familyFromTags', () => {
  it('reads the catalog’s own tags', () => {
    assert.equal(familyFromTags(['spinner', 'ring', 'blue']), 'ring')
    assert.equal(familyFromTags(['dots', 'bounce', 'ocean']), 'dots')
    assert.equal(familyFromTags(['bars', 'equalizer', 'audio']), 'bars')
    assert.equal(familyFromTags(['pulse', 'heartbeat']), 'pulse')
    assert.equal(familyFromTags(['loader', 'spinner', 'conic', 'mask']), 'conic')
    assert.equal(familyFromTags(['spinner', 'dual-ring', 'ocean', 'md']), 'dual-ring')
    assert.equal(familyFromTags(['loader', 'orbit', 'spinner', 'dots']), 'orbit')
    assert.equal(familyFromTags(['ping', 'ripple', 'rings', 'sonar']), 'ping')
  })

  it('prefers the more specific hint when a loader carries several', () => {
    // "Ocean Dual-Ring Spinner" is tagged both spinner and dual-ring.
    assert.equal(familyFromTags(['spinner', 'dual-ring']), 'dual-ring')
    // "Orbit Loader" is tagged spinner and dots as well as orbit.
    assert.equal(familyFromTags(['orbit', 'spinner', 'dots']), 'orbit')
  })

  it('falls back to a ring rather than to nothing', () => {
    assert.equal(familyFromTags(['newtons cradle', 'pendulum']), 'ring')
    assert.equal(familyFromTags([]), 'ring')
  })

  it('reads the name when the tags say nothing', () => {
    // The ten hand-written loaders in the catalog carry no tags at all, so
    // for those the name is the only signal there is.
    assert.equal(familyFromTags(['ocean'], 'Ocean Typing Indicator'), 'dots')
    assert.equal(familyFromTags([], 'Indeterminate Bar'), 'bar')
    assert.equal(familyFromTags([], 'Skeleton Shimmer'), 'shimmer')
    assert.equal(familyFromTags([], 'Classic Spinner'), 'ring')
    // Three expanding rings, whatever its first word says.
    assert.equal(familyFromTags([], 'Pulse Ring Loader'), 'ping')
  })

  it('puts the shape before the behaviour', () => {
    // "Ocean Percentage Ring" is tagged progress AND ring. It is a ring.
    assert.equal(
      familyFromTags(['loader', 'progress', 'ring', 'determinate', 'percentage']),
      'ring',
    )
    // With no ring in sight, progress means the bar.
    assert.equal(familyFromTags(['loader', 'upload', 'file', 'progress']), 'bar')
  })
})

describe('dominantColorIn', () => {
  it('skips the translucent track and finds the brand colour', () => {
    const css = `.x { border: 4px solid rgba(59,130,246, 0.2); border-top-color: #3b82f6; }`
    assert.equal(dominantColorIn(css), '#3b82f6')
  })

  it('prefers the vivid colour over the surface it is drawn on', () => {
    /*
      Half the catalog's loaders are drawn for a dark surface and open with
      that surface's colour. Taking the first literal seeded the tool with
      near-black for eight of the 35.
    */
    const css = `.x { background: #0f172a; } .x span { background: #06b6d4; }`
    assert.equal(dominantColorIn(css), '#06b6d4')
  })

  it('breaks a tie on source order', () => {
    const css = `.x { color: #ff0000; background: #00ff00; }`
    assert.equal(dominantColorIn(css), '#ff0000')
  })

  it('accepts the modern colour functions', () => {
    assert.equal(dominantColorIn('.x { background: oklch(0.6 0.2 250); }'), 'oklch(0.6 0.2 250)')
    assert.equal(dominantColorIn('.x { color: hsl(210 90% 50%); }'), 'hsl(210 90% 50%)')
  })

  it('returns null when there is no colour at all', () => {
    assert.equal(dominantColorIn('.x { width: 10px; }'), null)
  })

  it('keeps the translucent colour when it is the only one', () => {
    assert.equal(dominantColorIn('.x { background: rgba(0,0,0,0.4); }'), 'rgba(0,0,0,0.4)')
  })
})

describe('seedFromCss', () => {
  const RING = `.fx-ld-spin-blue-norm-0489 {
  width: 38px; height: 38px;
  border: 4px solid rgba(59,130,246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: fx-ld-spin-blue-norm-0489-rot 1s linear infinite;
}`

  it('recovers the numbers a catalog spinner was written with', () => {
    const seed = seedFromCss(RING, '<div class="x"></div>', ['spinner', 'ring', 'blue'])
    assert.equal(seed.family, 'ring')
    assert.equal(seed.size, 38)
    assert.equal(seed.thickness, 4)
    assert.equal(seed.speed, 1)
    assert.equal(seed.color, '#3b82f6')
  })

  it('takes the largest dimension, not the first one', () => {
    // An equalizer's first `width` is one 5px bar; its size is the 32px
    // container. Seeding from the first match opened the tool on a loader
    // the size of a full stop.
    const bars = `.x { display: inline-flex; gap: 4px; height: 32px; }
.x span { width: 5px; height: 100%; }`
    assert.equal(seedFromCss(bars, '', ['bars', 'equalizer']).size, 32)
  })

  it('does not mistake border-radius for a border width', () => {
    // `border-radius: 999px` on a pill track was being read as a 999px
    // stroke, which the clamp then reported as a 16px one.
    const bar = `.x { width: 220px; height: 6px; border-radius: 999px; }`
    const seed = seedFromCss(bar, '', [], 'Indeterminate Bar')
    assert.equal(seed.family, 'bar')
    assert.equal(seed.thickness, 6, 'the thin dimension is the thickness here')
  })

  it('counts the children of a multi-part loader', () => {
    const dots = `.x { display: inline-flex; gap: 6px; }
.x span { width: 10px; height: 10px; background: #0ea5e9;
  animation: bounce 1.4s ease-in-out infinite; }`
    const seed = seedFromCss(
      dots,
      '<div class="x"><span></span><span></span><span></span></div>',
      ['dots', 'bounce'],
    )
    assert.equal(seed.family, 'dots')
    assert.equal(seed.count, 3)
    assert.equal(seed.gap, 6)
    assert.equal(seed.speed, 1.4)
  })

  it('reads a duration written in milliseconds', () => {
    const seed = seedFromCss('.x { animation: spin 800ms linear infinite; }', '', [])
    assert.equal(seed.speed, 0.8)
  })

  it('never seeds a loader that does not move', () => {
    // A delay written first in the shorthand must not be read as duration.
    const seed = seedFromCss('.x { animation: 0s 2s spin linear infinite; }', '', [])
    assert.notEqual(seed.speed, 0)
  })

  it('never hands the sliders a value they could not represent', () => {
    const seed = seedFromCss(
      '.x { width: 4000px; border: 90px solid red; animation: spin 900s linear infinite; }',
      '',
      [],
    )
    // A 4000px dimension is not a loader's size — it is a container, and it
    // is dropped rather than clamped, so the default stands.
    assert.equal(seed.size, undefined)
    assert.ok(seed.thickness! <= 16)
    assert.ok(seed.speed! <= 6)

    const merged = { ...DEFAULT_LOADER, ...seed }
    assert.equal(merged.size, DEFAULT_LOADER.size)
  })

  it('always returns something buildable', () => {
    const seed = seedFromCss('', '', [])
    const merged = { ...DEFAULT_LOADER, ...seed }
    const { html, css } = buildLoader(merged)
    assert.ok(html.includes('role="status"'))
    assert.ok(css.includes('@keyframes'))
  })
})

describe('LOADER_FAMILIES', () => {
  it('describes every family the builder can draw', () => {
    const built = new Set<LoaderFamily>(EVERY_FAMILY)
    assert.equal(built.size, LOADER_FAMILIES.length, 'a duplicate id in the list')
    for (const family of LOADER_FAMILIES) {
      assert.ok(family.note.length > 20, `${family.id} has no reason to be picked`)
    }
  })
})
