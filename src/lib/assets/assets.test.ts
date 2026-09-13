/**
 * Unit tests for the four free-asset generators.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/assets/assets.test.ts
 *
 * Generated SVG is the canonical example of output that is wrong for months
 * because it always looks plausible. What is pinned here is therefore not
 * "the shapes" — a test asserting a path string would break on every visual
 * improvement and assert nothing about whether the picture is right. It is
 * the set of properties that are invisible in a preview and catastrophic in
 * production:
 *
 *   - the palette is scoped to a class, never to `:root`
 *   - a seed always produces the same asset
 *   - skin tone does not move between light and dark
 *   - the reduced-motion guard exists, and for the whole-icon families is
 *     literally the catalog's own function rather than a copy of it
 *   - a dash family's guard undoes the static properties that would
 *     otherwise leave the icon invisible
 *
 * Four of those five are regressions that actually happened during the build
 * and were found by looking at a contact sheet, not by a type error.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { reducedMotionGuard } from '../keyframes-css'
import {
  ASSET_PALETTES,
  DEFAULT_PALETTE_ID,
  assetSlug,
  componentName,
  paletteById,
  paletteScopeClass,
  paletteStyle,
  svgDocument,
} from './asset-types'
import {
  ICON_GEOMETRY,
  ICON_MOTIONS,
  PATH_CLASS,
  animatedIconCount,
  buildAnimatedIconCss,
  buildAnimatedIconJsx,
  buildAnimatedIconSvg,
  guardFor,
  iconBySlug,
  motionClass,
  searchIcons,
} from './animated-icons'
import {
  AVATAR_SET,
  AVATAR_STYLES,
  buildAvatarSvg,
  hashSeed,
  searchAvatars,
} from './avatars'
import { LOGO_FAMILIES, LOGO_SET, buildLogoSvg, searchLogos } from './logos'
import { SCENES, buildIllustrationSvg, project } from './illustrations'

/* ================================================================== *
 *  Shared
 * ================================================================== */

describe('asset-types', () => {
  it('scopes the palette to a class and never to :root', () => {
    /*
      The bug this pins: a `<style>` inside an INLINED svg is a stylesheet of
      the host page, so `:root` there is the `<html>`. Six illustrations in
      six palettes all rendered in whichever palette came last in the DOM,
      with nothing in the console.
    */
    for (const palette of ASSET_PALETTES) {
      for (const scheme of ['light', 'dark', 'auto'] as const) {
        const css = paletteStyle(palette, scheme)
        assert.ok(!css.includes(':root'), `${palette.id}/${scheme} still writes to :root`)
        assert.ok(css.includes(`.${paletteScopeClass(palette, scheme)}`))
      }
    }
  })

  it('gives different palettes different scope classes', () => {
    const classes = new Set(ASSET_PALETTES.map((p) => paletteScopeClass(p, 'auto')))
    assert.equal(classes.size, ASSET_PALETTES.length)
  })

  it('only the auto scheme carries a prefers-color-scheme block', () => {
    const p = paletteById(DEFAULT_PALETTE_ID)
    assert.ok(paletteStyle(p, 'auto').includes('prefers-color-scheme: dark'))
    assert.ok(!paletteStyle(p, 'light').includes('prefers-color-scheme'))
    assert.ok(!paletteStyle(p, 'dark').includes('prefers-color-scheme'))
  })

  it('a titled document is role=img and an untitled one is hidden', () => {
    const titled = svgDocument({ viewBox: '0 0 1 1', body: '', title: 'A name' })
    assert.ok(titled.includes('role="img"'))
    assert.ok(titled.includes('<title>A name</title>'))

    const decorative = svgDocument({ viewBox: '0 0 1 1', body: '', title: null })
    assert.ok(decorative.includes('aria-hidden="true"'))
    assert.ok(decorative.includes('focusable="false"'))
    assert.ok(!decorative.includes('<title>'))
  })

  it('escapes a title that contains markup', () => {
    const svg = svgDocument({ viewBox: '0 0 1 1', body: '', title: 'a <b> & "c"' })
    assert.ok(svg.includes('&lt;b&gt;'))
    assert.ok(!svg.includes('<b>'))
  })

  it('componentName never starts with a digit', () => {
    assert.equal(componentName('3d', 'scene'), 'Asset3dScene')
    assert.equal(componentName('bell', 'draw', 'icon'), 'BellDrawIcon')
  })

  it('assetSlug splits camel case', () => {
    assert.equal(assetSlug('BarChart3', 'draw'), 'bar-chart3-draw')
  })
})

/* ================================================================== *
 *  Animated icons
 * ================================================================== */

describe('animated icons', () => {
  const bell = iconBySlug('bell')!

  it('has geometry for every icon in the browser', () => {
    assert.ok(ICON_GEOMETRY.length > 100)
    for (const icon of ICON_GEOMETRY) {
      assert.ok(icon.nodes.length > 0, `${icon.name} has no nodes`)
      for (const [tag, attrs] of icon.nodes) {
        assert.ok(tag.length > 0)
        // `key` is React bookkeeping and means nothing in a file; the build
        // script strips it and nothing downstream filters it again.
        assert.ok(!('key' in attrs), `${icon.name} kept a React key`)
      }
    }
  })

  it('counts as a multiplication', () => {
    assert.equal(animatedIconCount(), ICON_GEOMETRY.length * ICON_MOTIONS.length)
  })

  it('every family emits keyframes, a rule and a guard', () => {
    for (const motion of ICON_MOTIONS) {
      const css = buildAnimatedIconCss({ icon: bell, motion: motion.id })
      const cls = motionClass(motion.id)
      assert.ok(css.includes(`@keyframes ${cls} {`), `${motion.id}: no keyframes`)
      assert.ok(css.includes(`animation: ${cls} `), `${motion.id}: no animation rule`)
      assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), `${motion.id}: no guard`)
    }
  })

  it('whole-icon families use the catalog’s own guard verbatim', () => {
    /*
      Not "a guard that looks like it": the same function the 1,047 catalog
      effects are guarded by, called rather than reimplemented. If the
      catalog's rule ever changes, this test goes red here rather than the
      two ideas of a guard quietly diverging.
    */
    for (const motion of ICON_MOTIONS.filter((m) => !m.perPath)) {
      const looping = motion.anim ? motion.anim.iterations === 0 : Boolean(motion.forever)
      assert.equal(
        guardFor(motion),
        reducedMotionGuard(motionClass(motion.id), looping),
        `${motion.id} has drifted from reducedMotionGuard`,
      )
    }
  })

  it('a dash family’s guard undoes the properties that would hide the icon', () => {
    /*
      `draw` sets stroke-dashoffset: 1 statically. Disabling the animation
      without undoing that leaves a fully invisible icon — on the one setting
      that exists to help. This is the single worst failure in the module.
    */
    for (const motion of ICON_MOTIONS.filter((m) => m.dash)) {
      const guard = guardFor(motion)
      assert.ok(guard.includes('stroke-dasharray: none'), `${motion.id}: dasharray not reset`)
      assert.ok(guard.includes('stroke-dashoffset: 0'), `${motion.id}: dashoffset not reset`)
      assert.ok(guard.includes(`.${PATH_CLASS}`), `${motion.id}: guard misses the shapes`)
    }
  })

  it('never emits the same selector twice in one stylesheet', () => {
    for (const motion of ICON_MOTIONS) {
      for (const trigger of ['load', 'hover'] as const) {
        const css = buildAnimatedIconCss({ icon: bell, motion: motion.id, trigger })
        const selectors = [...css.matchAll(/^(\.[^{@\n]+) \{$/gm)].map((m) => m[1].trim())
        assert.equal(
          new Set(selectors).size,
          selectors.length,
          `${motion.id}/${trigger}: duplicate selector in ${selectors.join(' | ')}`,
        )
      }
    }
  })

  it('a hover trigger also answers to the keyboard', () => {
    const css = buildAnimatedIconCss({ icon: bell, motion: 'spin', trigger: 'hover' })
    assert.ok(css.includes(':hover'))
    assert.ok(css.includes(':focus-visible'))
  })

  it('per-path families index their shapes with a custom property', () => {
    const svg = buildAnimatedIconSvg({ icon: bell, motion: 'draw' })
    assert.ok(svg.includes(`class="${PATH_CLASS}"`))
    assert.ok(svg.includes('style="--i:0"'))
    assert.ok(svg.includes('style="--i:1"'))
    // pathLength renormalises every shape to 1 so one dash length fits all.
    assert.equal((svg.match(/pathLength="1"/g) ?? []).length, bell.nodes.length)
  })

  it('whole-icon families do not touch the shapes', () => {
    const svg = buildAnimatedIconSvg({ icon: bell, motion: 'spin' })
    assert.ok(!svg.includes(PATH_CLASS))
    assert.ok(!svg.includes('pathLength'))
  })

  it('inline markup carries no stylesheet and no forced colour', () => {
    /*
      A `<style>` inside inline markup is a global stylesheet smuggled into
      the host page through an icon, and a hard-coded `color` overrides the
      `text-*` class that is meant to colour it.
    */
    const inline = buildAnimatedIconSvg({ icon: bell, motion: 'draw' })
    assert.ok(!inline.includes('<style>'))
    assert.ok(inline.includes('stroke="currentColor"'))

    const file = buildAnimatedIconSvg({ icon: bell, motion: 'draw', standalone: true })
    assert.ok(file.includes('<style>'))
    assert.ok(file.includes('color:'))
    assert.ok(file.includes('@keyframes'))
  })

  it('a file is named and inline markup is decorative by default', () => {
    assert.ok(buildAnimatedIconSvg({ icon: bell, motion: 'pop', standalone: true }).includes('<title>Bell</title>'))
    assert.ok(buildAnimatedIconSvg({ icon: bell, motion: 'pop' }).includes('aria-hidden="true"'))
  })

  it('the JSX merges className rather than dropping the caller’s', () => {
    const jsx = buildAnimatedIconJsx({ icon: bell, motion: 'spin' })
    assert.ok(jsx.includes("['hl-icon-spin', props.className]"))
    // Overwriting would leave a bare literal beside the props spread.
    assert.ok(!jsx.includes('className="hl-icon-spin"'))
  })

  it('the JSX casts the custom property so it compiles in strict TypeScript', () => {
    const jsx = buildAnimatedIconJsx({ icon: bell, motion: 'draw' })
    assert.ok(jsx.includes('as React.CSSProperties'))
    assert.ok(!jsx.includes("'--i': '0'"), 'the custom property is still a string literal')
  })

  it('searches keywords, not just names', () => {
    const byKeyword = searchIcons('spinner')
    assert.ok(byKeyword.some((i) => i.name === 'Loader2'))
    assert.equal(searchIcons('').length, ICON_GEOMETRY.length)
    assert.equal(searchIcons('zzzznope').length, 0)
  })
})

/* ================================================================== *
 *  Avatars
 * ================================================================== */

describe('avatars', () => {
  it('is deterministic in the seed', () => {
    const a = buildAvatarSvg({ seed: 'Priya Raman' })
    const b = buildAvatarSvg({ seed: 'Priya Raman' })
    assert.equal(a, b)
    assert.notEqual(a, buildAvatarSvg({ seed: 'Priya Ramen' }))
  })

  it('decorrelates features rather than deriving them all from one hash', () => {
    /*
      With `hash % n` per feature, two lists of the same length correlate
      perfectly and the grid becomes eight avatars repeated. The check is
      cheap: a sample of seeds should produce a lot of distinct pictures.
    */
    const seeds = Array.from({ length: 60 }, (_, i) => `person-${i}`)
    const drawings = new Set(seeds.map((seed) => buildAvatarSvg({ seed })))
    assert.ok(drawings.size > 50, `only ${drawings.size} distinct avatars from 60 seeds`)
  })

  it('does not change skin tone between light and dark', () => {
    /*
      The one rule that matters here. Running the whole drawing through the
      palette makes a face darken when the reader turns on dark mode, which
      is both absurd and offensive. Only the plate and the clothing may move.
    */
    const skin = /#(?:f3d2bc|e8b894|c68863|a2653f|75492c|4a2c1a)/g
    for (const seed of ['Amara Okonkwo', 'Hugo Moreau', 'Yuki Sato']) {
      const light = buildAvatarSvg({ seed, scheme: 'light' })?.match(skin) ?? []
      const dark = buildAvatarSvg({ seed, scheme: 'dark' })?.match(skin) ?? []
      assert.ok(light.length > 0, `${seed} drew no skin at all`)
      assert.deepEqual(light, dark, `${seed} changed skin tone with the colour scheme`)
    }
  })

  it('never renders an empty identicon', () => {
    for (let i = 0; i < 200; i++) {
      const svg = buildAvatarSvg({ seed: `blocks-${i}`, style: 'blocks' })
      assert.ok(svg.includes('<rect'), `blocks-${i} rendered no cells`)
    }
  })

  it('mirrors the identicon about the vertical axis', () => {
    const svg = buildAvatarSvg({ seed: 'symmetry', style: 'blocks' })
    const xs = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)"/g)].map((m) => `${m[1]}:${m[2]}`)
    for (const cell of xs) {
      const [x, y] = cell.split(':').map(Number)
      // Columns are 2 + c*12; the mirror of column c is column 4 - c.
      const col = (x - 2) / 12
      const mirrored = `${2 + (4 - col) * 12}:${y}`
      assert.ok(xs.includes(mirrored), `cell ${cell} has no mirror`)
    }
  })

  it('draws every style without leaving a placeholder behind', () => {
    for (const style of AVATAR_STYLES) {
      const svg = buildAvatarSvg({ seed: 'coverage', style: style.id })
      assert.ok(svg.startsWith('<svg'))
      assert.ok(!svg.includes('{{'), `${style.id} left a placeholder`)
      assert.ok(svg.includes(paletteScopeClass(paletteById(DEFAULT_PALETTE_ID), 'auto')))
    }
  })

  it('is decorative unless the caller asks for a name', () => {
    assert.ok(buildAvatarSvg({ seed: 'x' }).includes('aria-hidden="true"'))
    assert.ok(buildAvatarSvg({ seed: 'x', title: 'Amara Okonkwo' }).includes('<title>Amara Okonkwo</title>'))
  })

  it('has a set whose ids are unique', () => {
    const ids = new Set(AVATAR_SET.map((a) => a.id))
    assert.equal(ids.size, AVATAR_SET.length)
    assert.ok(AVATAR_SET.length >= 370, `${AVATAR_SET.length} avatars in the grid`)
  })

  it('searches names, roles and styles', () => {
    assert.ok(searchAvatars('ring').every((a) => a.style === 'ring' || a.name.toLowerCase().includes('ring')))
    assert.equal(searchAvatars('').length, AVATAR_SET.length)
  })

  it('hashes two near-identical seeds to unrelated places', () => {
    assert.notEqual(hashSeed('Alex'), hashSeed('Alez'))
  })
})

/* ================================================================== *
 *  Logos
 * ================================================================== */

describe('logos', () => {
  it('draws every family in both colour modes', () => {
    for (const family of LOGO_FAMILIES) {
      for (const mono of [false, true]) {
        const svg = buildLogoSvg({ name: 'Northwind', family: family.id, mono })
        assert.ok(svg.startsWith('<svg'), `${family.id} produced nothing`)
        assert.ok(!svg.includes('{{'), `${family.id} left a placeholder`)
      }
    }
  })

  it('never knocks the monogram out in literal white', () => {
    /*
      The shipped bug: `fill="#ffffff"` is right on a coloured tile in light
      mode and invisible on the mono variant in dark mode, where the tile is
      the near-white ink. A knocked-out glyph is the page colour, not white.
    */
    const svg = buildLogoSvg({ name: 'Northwind', family: 'monogram', mono: true })
    assert.ok(!/fill="#ffffff"/i.test(svg), 'the monogram letter is still hard-coded white')
    assert.ok(svg.includes('--a-bg'))
  })

  it('uses the initial of the name', () => {
    assert.ok(buildLogoSvg({ name: 'Quartzly', family: 'monogram' }).includes('>Q<'))
    assert.ok(buildLogoSvg({ name: 'ferrous', family: 'monogram' }).includes('>F<'))
  })

  it('estimates the wordmark wide rather than narrow', () => {
    /*
      There is no font metric available here, so the viewBox is estimated. The
      direction of the error is the decision: too wide leaves a little space,
      too narrow clips the brand name.
    */
    const short = buildLogoSvg({ name: 'Ilia', family: 'stack' })
    const long = buildLogoSvg({ name: 'Wammow Manufacturing', family: 'stack' })
    const width = (svg: string) => Number(svg.match(/viewBox="0 0 (\d+)/)![1])
    assert.ok(width(long) > width(short) * 2)
  })

  it('the mark-only lockup is square and carries no text', () => {
    const svg = buildLogoSvg({ name: 'Northwind', family: 'orbit', lockup: 'mark' })
    assert.ok(svg.includes('viewBox="0 0 32 32"'))
    assert.ok(!svg.includes('<text'))
  })

  it('has 180 entries with unique ids', () => {
    assert.equal(LOGO_SET.length, 180)
    assert.equal(new Set(LOGO_SET.map((l) => l.id)).size, 180)
  })

  it('searches by industry as well as name', () => {
    assert.ok(searchLogos('fintech').length > 0)
    assert.ok(searchLogos('northwind').length === LOGO_FAMILIES.length)
  })
})

/* ================================================================== *
 *  Illustrations
 * ================================================================== */

describe('illustrations', () => {
  it('projects the three axes the way the docblock says', () => {
    assert.deepEqual(project(0, 0, 0), { x: 0, y: 0 })
    // +x goes right and down, +y left and down, +z straight up.
    assert.ok(project(1, 0, 0).x > 0 && project(1, 0, 0).y > 0)
    assert.ok(project(0, 1, 0).x < 0 && project(0, 1, 0).y > 0)
    assert.equal(project(0, 0, 1).y, -16)
  })

  it('renders every scene with no placeholder left behind', () => {
    for (const scene of SCENES) {
      const svg = buildIllustrationSvg({ sceneId: scene.id })
      assert.ok(svg.startsWith('<svg'), `${scene.id} produced nothing`)
      assert.ok(!svg.includes('{{'), `${scene.id} left an unresolved tone placeholder`)
      assert.ok(svg.includes('<title>'), `${scene.id} has no accessible name`)
    }
  })

  it('paints contact shadows before the solids that cast them', () => {
    /*
      Decals are drawn last by definition, which is right for a tick and
      catastrophic for a shadow — it becomes a grey smear across the object
      above it. Shadows are the `back` layer.
    */
    const svg = buildIllustrationSvg({ sceneId: 'empty-inbox' })
    const shadow = svg.indexOf('<ellipse')
    const firstSolid = svg.indexOf('<path')
    assert.ok(shadow > -1 && shadow < firstSolid, 'the shadow is painted over the scene')
  })

  it('shades the near faces, not the far ones', () => {
    /*
      Screen depth is x + y, so the near corner of a box is always
      (x + w, y + d). Drawing the `y` face instead renders, looks almost
      right, and puts the shading on the wrong side of every solid.
    */
    const svg = buildIllustrationSvg({ sceneId: 'page-not-found' })
    // The lowest point of the drawing must belong to a vertical face, which
    // is only true when the near faces are the ones drawn.
    const ys = [...svg.matchAll(/[ML] -?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]))
    assert.ok(Math.max(...ys) > 0, 'nothing is drawn below the origin — the far faces were used')
  })

  it('gives each palette a distinct rendering', () => {
    const rendered = ASSET_PALETTES.map((p) => buildIllustrationSvg({ sceneId: 'analytics', paletteId: p.id }))
    assert.equal(new Set(rendered).size, ASSET_PALETTES.length)
  })

  it('refuses an unknown scene rather than rendering an empty frame', () => {
    assert.throws(() => buildIllustrationSvg({ sceneId: 'not-a-scene' }), /no scene/)
  })

  it('has twelve scenes with unique ids', () => {
    assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length)
    assert.ok(SCENES.length >= 12)
  })
})
