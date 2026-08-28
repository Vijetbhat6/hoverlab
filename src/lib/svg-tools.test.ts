/**
 * Unit tests for the SVG toolkit's engine.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/svg-tools.test.ts
 *
 * The optimiser is the part of this module that can silently destroy the
 * user's file, so most of what is pinned here is what it must NOT do: keep
 * an id something references, keep a `fill="none"`, keep the whitespace
 * inside a text element, keep width and height when there is no viewBox to
 * fall back on. A pass that removes too little costs bytes; a pass that
 * removes too much costs an icon, and nobody finds out until it ships.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  attributeToJsx,
  buildBlobPath,
  buildPatternCss,
  buildPatternSvg,
  buildWaveLayers,
  buildWavePath,
  buildWaveSvg,
  DEFAULT_JSX_OPTIONS,
  DEFAULT_OPTIMIZE_OPTIONS,
  DEFAULT_PATTERN_STATE,
  DEFAULT_WAVE_STATE,
  looksLikeSvg,
  optimizeSvg,
  roundTo,
  sanitizeSvgForPreview,
  styleStringToJsx,
  svgToDataUri,
  svgToJsx,
} from './svg-tools'

/* ============================================================
 *  Optimiser
 * ============================================================ */

describe('optimizeSvg', () => {
  it('removes the prolog, the doctype and comments', () => {
    const source = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generator: Adobe Illustrator -->
<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>`
    const { output } = optimizeSvg(source)
    assert.ok(!output.includes('<?xml'))
    assert.ok(!output.includes('DOCTYPE'))
    assert.ok(!output.includes('Generator'))
    assert.ok(output.startsWith('<svg'))
  })

  it('strips editor namespaces and their attributes', () => {
    const source = `<svg xmlns:inkscape="http://www.inkscape.org/ns" viewBox="0 0 24 24" inkscape:version="1.1"><sodipodi:namedview id="nv" zoom="4"/><path d="M0 0" data-name="Layer 1"/></svg>`
    const { output } = optimizeSvg(source)
    assert.ok(!output.includes('inkscape'))
    assert.ok(!output.includes('sodipodi'))
    assert.ok(!output.includes('data-name'))
    assert.ok(output.includes('<path'))
  })

  it('keeps <title> by default and removes it only on request', () => {
    const source = `<svg viewBox="0 0 24 24"><title>Download</title><path d="M0 0"/></svg>`
    assert.ok(optimizeSvg(source).output.includes('<title>Download</title>'))

    const stripped = optimizeSvg(source, {
      ...DEFAULT_OPTIMIZE_OPTIONS,
      stripTitles: true,
    })
    assert.ok(!stripped.output.includes('<title>'))
    // Removing the accessible name has to say so.
    assert.equal(stripped.warnings.length, 1)
    assert.match(stripped.warnings[0], /accessible name/)
  })

  it('removes width and height only when a viewBox can replace them', () => {
    const withBox = optimizeSvg(`<svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg>`)
    assert.ok(!withBox.output.includes('width='))
    assert.ok(withBox.output.includes('viewBox'))

    const without = optimizeSvg(`<svg width="24" height="24"><path d="M0 0"/></svg>`)
    assert.ok(without.output.includes('width="24"'))
    assert.match(without.warnings.join(' '), /no viewBox/)
  })

  it('keeps ids that are referenced and drops the ones that are not', () => {
    const source = `<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs><path id="Layer_1" d="M0 0" fill="url(#g)"/><use href="#shape"/><rect id="shape" width="4" height="4"/></svg>`
    const { output } = optimizeSvg(source)
    assert.ok(output.includes('id="g"'), 'gradient id is referenced by url()')
    assert.ok(output.includes('id="shape"'), 'rect id is referenced by <use>')
    assert.ok(!output.includes('Layer_1'), 'nothing references the layer name')
  })

  it('leaves every id alone when the file carries its own stylesheet', () => {
    const source = `<svg viewBox="0 0 24 24"><style>#a{fill:red}</style><path id="a" d="M0 0"/><path id="b" d="M1 1"/></svg>`
    const { output } = optimizeSvg(source)
    assert.ok(output.includes('id="a"'))
    assert.ok(output.includes('id="b"'), 'a selector could reach it in ways we do not model')
  })

  it('rounds path numbers to the requested precision', () => {
    const source = `<svg viewBox="0 0 24 24"><path d="M12.000000001 3.3333333 L4.987654321 9.1"/></svg>`
    const { output } = optimizeSvg(source, { ...DEFAULT_OPTIMIZE_OPTIONS, precision: 2 })
    assert.ok(output.includes('M12 3.33 L4.99 9.1'))
  })

  it('rewrites colours to currentColor without touching fill="none"', () => {
    const source = `<svg viewBox="0 0 24 24"><path d="M0 0" fill="#ff0000" stroke="none"/><circle fill="none" stroke="rgb(0,0,0)"/></svg>`
    const { output } = optimizeSvg(source, {
      ...DEFAULT_OPTIMIZE_OPTIONS,
      useCurrentColor: true,
    })
    assert.ok(output.includes('fill="currentColor"'))
    assert.ok(output.includes('stroke="currentColor"'))
    assert.ok(output.includes('fill="none"'), 'none is structural, not a colour')
    assert.ok(output.includes('stroke="none"'))
  })

  it('does not eat the whitespace between text runs', () => {
    const source = `<svg viewBox="0 0 100 20"><text x="0" y="10"><tspan>Hello</tspan> <tspan>world</tspan></text></svg>`
    const { output } = optimizeSvg(source)
    assert.ok(output.includes('</tspan> <tspan>'), 'that space is a space the reader sees')
  })

  it('collapses whitespace between shape elements', () => {
    const source = `<svg viewBox="0 0 24 24">\n  <path d="M0 0"/>\n  <path d="M1 1"/>\n</svg>`
    const { output } = optimizeSvg(source)
    assert.ok(!output.includes('\n'))
  })

  it('removes scripts and handlers by default and reports it', () => {
    const source = `<svg viewBox="0 0 24 24" onload="fetch('/steal')"><script>alert(1)</script><path d="M0 0"/></svg>`
    const { output, warnings } = optimizeSvg(source)
    assert.ok(!output.includes('script'))
    assert.ok(!output.includes('onload'))
    assert.match(warnings.join(' '), /script or inline event handler/)
  })

  it('warns rather than silently keeping a script when the pass is off', () => {
    const source = `<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>`
    const { output, warnings } = optimizeSvg(source, {
      ...DEFAULT_OPTIMIZE_OPTIONS,
      stripScripts: false,
    })
    assert.ok(output.includes('script'))
    assert.match(warnings.join(' '), /do not inline it/i)
  })

  it('reports a size that matches the output it returned', () => {
    const source = `<?xml version="1.0"?>\n<svg version="1.1" viewBox="0 0 24 24">\n  <!-- c -->\n  <path d="M0.00000 0"/>\n</svg>`
    const result = optimizeSvg(source)
    assert.equal(result.after, Buffer.byteLength(result.output, 'utf8'))
    assert.ok(result.after < result.before)
    assert.ok(result.passes.length > 0)
    // Every pass claims a saving, and the sum cannot exceed the total.
    const claimed = result.passes.reduce((sum, p) => sum + p.saved, 0)
    assert.equal(claimed, result.before - result.after)
  })

  it('is idempotent — optimising twice changes nothing the second time', () => {
    const source = `<?xml version="1.0"?><svg version="1.1" width="24" height="24" viewBox="0 0 24 24"><g id="unused"><path d="M12.00001 3"/></g></svg>`
    const once = optimizeSvg(source).output
    const twice = optimizeSvg(once).output
    assert.equal(twice, once)
  })
})

/* ============================================================
 *  Sanitiser
 * ============================================================ */

describe('sanitizeSvgForPreview', () => {
  it('removes every route to script execution', () => {
    const hostile = `<svg onload="alert(1)"><script>alert(2)</script><image onerror='alert(3)' href="x"/><a href="javascript:alert(4)"><foreignObject><iframe src="x"></iframe></foreignObject></a></svg>`
    const safe = sanitizeSvgForPreview(hostile)
    assert.ok(!safe.includes('onload'))
    assert.ok(!safe.includes('onerror'))
    assert.ok(!safe.includes('<script'))
    assert.ok(!safe.includes('javascript:'))
    assert.ok(!safe.includes('iframe'), 'foreignObject is the hole HTML comes through')
  })

  it('leaves ordinary artwork untouched', () => {
    const svg = `<svg viewBox="0 0 24 24"><path d="M0 0" fill="#f00"/></svg>`
    assert.equal(sanitizeSvgForPreview(svg), svg)
  })
})

describe('looksLikeSvg', () => {
  it('accepts markup and rejects prose', () => {
    assert.equal(looksLikeSvg('<svg viewBox="0 0 1 1"></svg>'), true)
    assert.equal(looksLikeSvg('  <svg>\n'), true)
    assert.equal(looksLikeSvg('not an svg'), false)
    assert.equal(looksLikeSvg('<svgx />'), false)
  })
})

/* ============================================================
 *  Data URI
 * ============================================================ */

describe('svgToDataUri', () => {
  it('escapes only what a CSS url() cannot carry', () => {
    const uri = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg"><path fill="#f00" d="M0 0"/></svg>`)
    assert.ok(uri.startsWith('data:image/svg+xml,'))
    assert.ok(!uri.includes('<'))
    assert.ok(!uri.includes('#f00'), 'a bare # ends the URL')
    assert.ok(uri.includes('%23f00'))
    // Double quotes become single so the URI sits inside url("…") as-is.
    assert.ok(!uri.includes('"'))
    // Slashes and spaces are left alone — that is where the saving is.
    assert.ok(uri.includes('http://www.w3.org/2000/svg'))
  })

  it('produces a base64 form on request', () => {
    const uri = svgToDataUri('<svg/>', true)
    assert.ok(uri.startsWith('data:image/svg+xml;base64,'))
    const decoded = Buffer.from(uri.split(',')[1], 'base64').toString('utf8')
    assert.equal(decoded, '<svg/>')
  })

  it('survives non-ASCII content in base64', () => {
    const uri = svgToDataUri('<svg><title>Café</title></svg>', true)
    const decoded = Buffer.from(uri.split(',')[1], 'base64').toString('utf8')
    assert.ok(decoded.includes('Café'))
  })
})

/* ============================================================
 *  JSX
 * ============================================================ */

describe('attributeToJsx', () => {
  it('camelCases hyphenated presentation attributes', () => {
    assert.equal(attributeToJsx('stroke-width'), 'strokeWidth')
    assert.equal(attributeToJsx('stroke-linecap'), 'strokeLinecap')
    assert.equal(attributeToJsx('clip-rule'), 'clipRule')
  })

  it('applies React renames', () => {
    assert.equal(attributeToJsx('class'), 'className')
    assert.equal(attributeToJsx('xlink:href'), 'xlinkHref')
    assert.equal(attributeToJsx('tabindex'), 'tabIndex')
  })

  it('leaves spec-camelCase and data/aria attributes alone', () => {
    assert.equal(attributeToJsx('viewBox'), 'viewBox')
    assert.equal(attributeToJsx('preserveAspectRatio'), 'preserveAspectRatio')
    assert.equal(attributeToJsx('data-testid'), 'data-testid')
    assert.equal(attributeToJsx('aria-hidden'), 'aria-hidden')
  })
})

describe('styleStringToJsx', () => {
  it('turns declarations into an object literal', () => {
    assert.equal(
      styleStringToJsx('fill:red;stroke-width:2'),
      "{{ fill: 'red', strokeWidth: '2' }}",
    )
  })

  it('quotes custom properties rather than camelCasing them', () => {
    assert.equal(styleStringToJsx('--brand: red'), "{{ '--brand': 'red' }}")
  })

  it('ignores a trailing semicolon and stray whitespace', () => {
    assert.equal(styleStringToJsx(' fill : red ; '), "{{ fill: 'red' }}")
  })
})

describe('svgToJsx', () => {
  it('renames attributes and closes void elements', () => {
    const jsx = svgToJsx(`<svg viewBox="0 0 24 24" class="icon"><path stroke-width="2" d="M0 0"></path></svg>`)
    assert.ok(jsx.includes('className="icon"'))
    assert.ok(jsx.includes('strokeWidth="2"'))
    assert.ok(jsx.includes('viewBox="0 0 24 24"'))
    assert.ok(!jsx.includes('stroke-width'))
  })

  it('self-closes an HTML-style path', () => {
    const jsx = svgToJsx(`<svg viewBox="0 0 24 24"><path d="M0 0"></svg>`)
    assert.ok(jsx.includes('<path d="M0 0" />'))
  })

  it('spreads props and types the component when asked', () => {
    const jsx = svgToJsx('<svg viewBox="0 0 1 1"/>', DEFAULT_JSX_OPTIONS)
    assert.ok(jsx.includes('props: React.SVGProps<SVGSVGElement>'))
    assert.ok(jsx.includes('{...props}'))
    assert.ok(jsx.includes("import type * as React from 'react'"))
  })

  it('declares no parameter when nothing would use it', () => {
    const jsx = svgToJsx('<svg viewBox="0 0 1 1"/>', {
      ...DEFAULT_JSX_OPTIONS,
      spreadProps: false,
    })
    assert.ok(jsx.includes('export function Icon() {'))
    assert.ok(!jsx.includes('props'))
    assert.ok(!jsx.includes('import type'), 'the import existed only for the props type')
  })

  it('converts a style attribute into an object', () => {
    const jsx = svgToJsx(`<svg viewBox="0 0 1 1" style="fill:red;stroke-width:2"/>`)
    assert.ok(jsx.includes("style={{ fill: 'red', strokeWidth: '2' }}"))
  })

  it('drops scripts on the way through', () => {
    const jsx = svgToJsx(`<svg viewBox="0 0 1 1" onload="alert(1)"><script>x</script></svg>`)
    assert.ok(!jsx.includes('onload'))
    assert.ok(!jsx.includes('script'))
  })

  it('names the component what the caller asked for', () => {
    const jsx = svgToJsx('<svg/>', { ...DEFAULT_JSX_OPTIONS, componentName: 'ArrowRight' })
    assert.ok(jsx.includes('export function ArrowRight('))
  })
})

/* ============================================================
 *  Patterns
 * ============================================================ */

describe('buildPatternSvg', () => {
  it('emits a tileable pattern in user space', () => {
    const svg = buildPatternSvg(DEFAULT_PATTERN_STATE)
    assert.ok(svg.includes('patternUnits="userSpaceOnUse"'))
    assert.ok(svg.includes(`width="${DEFAULT_PATTERN_STATE.size}"`))
    assert.ok(svg.includes('fill="url(#p)"'))
  })

  it('draws the corner dots that make a dot field seamless', () => {
    const svg = buildPatternSvg({ ...DEFAULT_PATTERN_STATE, kind: 'dots', size: 20 })
    // All four corners plus the centre — five circles, or the spacing
    // doubles at every tile edge.
    assert.equal(svg.match(/<circle/g)?.length, 5)
    assert.ok(svg.includes('cx="20" cy="20"'))
  })

  it('rotates the lattice rather than the marks', () => {
    const svg = buildPatternSvg({ ...DEFAULT_PATTERN_STATE, kind: 'lines', angle: 45 })
    assert.ok(svg.includes('patternTransform="rotate(45)"'))
  })

  it('has a shape for every kind it advertises', () => {
    const kinds = [
      'dots',
      'grid',
      'lines',
      'crosshatch',
      'checkers',
      'triangles',
      'zigzag',
      'plus',
      'circles',
      'waves',
    ] as const
    for (const kind of kinds) {
      const svg = buildPatternSvg({ ...DEFAULT_PATTERN_STATE, kind })
      assert.match(svg, /<(circle|rect|path)/, `${kind} drew nothing`)
    }
  })
})

describe('buildPatternCss', () => {
  it('keeps the background colour in CSS and the marks in the URI', () => {
    const css = buildPatternCss({ ...DEFAULT_PATTERN_STATE, background: '#101010' })
    assert.ok(css.includes('background-color: #101010'))
    assert.ok(css.includes('background-image: url("data:image/svg+xml,'))
    assert.ok(css.includes(`background-size: ${DEFAULT_PATTERN_STATE.size}px`))
  })

  it('takes the selector it is given', () => {
    assert.ok(buildPatternCss(DEFAULT_PATTERN_STATE, '.hero').startsWith('.hero {'))
  })
})

/* ============================================================
 *  Waves and blobs
 * ============================================================ */

describe('buildWavePath', () => {
  it('closes the path below the shape so there is no hairline seam', () => {
    const d = buildWavePath('wave', 100, 50, 3)
    assert.ok(d.endsWith('Z'))
    assert.ok(d.includes('101'), 'the closing edge overshoots by a pixel')
  })

  it('draws one segment per hump', () => {
    assert.equal(buildWavePath('wave', 100, 50, 4).match(/ q/g)?.length, 4)
    // Two of the line commands close the shape, so a five-point sawtooth
    // profile is ten of them plus the two on the way back round.
    assert.equal(buildWavePath('peaks', 100, 50, 5).match(/ L\d/g)?.length, 12)
  })

  it('scales with amplitude', () => {
    const shallow = buildWavePath('arc', 100, 10, 1)
    const deep = buildWavePath('arc', 100, 90, 1)
    assert.notEqual(shallow, deep)
  })
})

describe('buildBlobPath', () => {
  it('is deterministic for a seed', () => {
    assert.equal(buildBlobPath(6, 0.4, 3), buildBlobPath(6, 0.4, 3))
    assert.notEqual(buildBlobPath(6, 0.4, 3), buildBlobPath(6, 0.4, 4))
  })

  it('closes the ring and uses one cubic per point', () => {
    const d = buildBlobPath(6, 0.4, 1)
    assert.ok(d.endsWith('Z'))
    assert.equal(d.match(/C/g)?.length, 6)
  })

  it('clamps the point count to something drawable', () => {
    assert.equal(buildBlobPath(1, 0.4, 1).match(/C/g)?.length, 3)
    assert.equal(buildBlobPath(50, 0.4, 1).match(/C/g)?.length, 12)
  })

  it('is a circle when nothing is random', () => {
    /*
      With randomness at zero every vertex sits on the base circle: radius
      0.38 x 200 = 76 about a centre of 100, so the ring passes through 176
      and 24 on the two axes. If the handle maths ever stops reproducing a
      circle, these are the first numbers to move.
    */
    const d = buildBlobPath(4, 0, 1, 200)
    assert.ok(d.startsWith('M176,100'))
    assert.ok(d.includes('100,176'))
    assert.ok(d.includes('24,100'))
  })
})

describe('buildWaveLayers', () => {
  it('stacks back to front with the solid layer last', () => {
    const layers = buildWaveLayers({ ...DEFAULT_WAVE_STATE, layers: 3 })
    assert.equal(layers.length, 3)
    assert.equal(layers[layers.length - 1].opacity, 1)
    assert.ok(layers[0].opacity < layers[2].opacity)
  })
})

describe('buildWaveSvg', () => {
  it('blocks the svg so no baseline gap opens under it', () => {
    const svg = buildWaveSvg(DEFAULT_WAVE_STATE)
    assert.ok(svg.includes('display:block'))
  })

  it('mirrors by translating first, so the shape stays in the viewBox', () => {
    const svg = buildWaveSvg({ ...DEFAULT_WAVE_STATE, flipX: true })
    assert.ok(svg.includes('translate(1200, 0) scale(-1, 1)'))
  })

  it('emits currentColor when asked, and the literal otherwise', () => {
    assert.ok(
      buildWaveSvg({ ...DEFAULT_WAVE_STATE, useCurrentColor: true }).includes(
        'fill="currentColor"',
      ),
    )
    assert.ok(
      buildWaveSvg({ ...DEFAULT_WAVE_STATE, color: '#123456' }).includes('fill="#123456"'),
    )
  })

  it('gives a blob a square viewBox rather than a full-width one', () => {
    const svg = buildWaveSvg({ ...DEFAULT_WAVE_STATE, kind: 'blob' })
    assert.ok(svg.includes('viewBox="0 0 200 200"'))
    assert.ok(!svg.includes('preserveAspectRatio'), 'a blob must not be stretched')
  })
})

describe('roundTo', () => {
  it('drops the floating-point tail', () => {
    assert.equal(roundTo(0.10000000000000009, 2), 0.1)
    assert.equal(roundTo(12.000000001, 2), 12)
    assert.equal(roundTo(1.005, 2), 1.0)
  })
})
