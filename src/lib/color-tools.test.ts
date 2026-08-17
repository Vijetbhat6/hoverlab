/**
 * Unit tests for the pure color math in color-tools.ts.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/color-tools.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  rgbToOklch,
  oklchToRgb,
  oklchInSrgbGamut,
  contrastRatio,
  wcagLevel,
  generatePalette,
  type RGB,
  type PaletteScheme,
} from './color-tools'

const HEX6 = /^#[0-9a-f]{6}$/

/* ============================================================
 *  Hex parsing / normalization
 * ========================================================== */

describe('normalizeHex', () => {
  it('normalizes 6-digit hex with #', () => {
    assert.equal(normalizeHex('#aabbcc'), '#aabbcc')
  })

  it('normalizes 6-digit hex without #', () => {
    assert.equal(normalizeHex('aabbcc'), '#aabbcc')
  })

  it('expands 3-digit hex with #', () => {
    assert.equal(normalizeHex('#abc'), '#aabbcc')
  })

  it('expands 3-digit hex without #', () => {
    assert.equal(normalizeHex('abc'), '#aabbcc')
  })

  it('lowercases', () => {
    assert.equal(normalizeHex('#AaBbCc'), '#aabbcc')
    assert.equal(normalizeHex('FFF'), '#ffffff')
  })

  it('trims surrounding whitespace', () => {
    assert.equal(normalizeHex('  #10b981  '), '#10b981')
  })

  it('returns null for invalid inputs', () => {
    for (const bad of ['', '   ', '#', '#ab', '#abcd', '#abcde', '#abcdefa', '#aabbccdd', 'gghhii', '#12 34 56', 'red', '##aabbcc']) {
      assert.equal(normalizeHex(bad), null, `expected null for ${JSON.stringify(bad)}`)
    }
  })
})

describe('hexToRgb / rgbToHex', () => {
  it('parses 6-digit hex', () => {
    assert.deepEqual(hexToRgb('#10b981'), { r: 0x10, g: 0xb9, b: 0x81 })
  })

  it('parses 3-digit hex (with and without #)', () => {
    assert.deepEqual(hexToRgb('#f80'), { r: 255, g: 136, b: 0 })
    assert.deepEqual(hexToRgb('f80'), { r: 255, g: 136, b: 0 })
  })

  it('parses 8-digit hex, ignoring alpha', () => {
    assert.deepEqual(hexToRgb('#aabbccdd'), { r: 0xaa, g: 0xbb, b: 0xcc })
  })

  it('returns null for invalid input', () => {
    for (const bad of ['', '#ab', '#abcd', 'zzz', '#12345', 'not a color']) {
      assert.equal(hexToRgb(bad), null, `expected null for ${JSON.stringify(bad)}`)
    }
  })

  it('round-trips hex -> rgb -> hex exactly', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#10b981', '#123456', '#fedcba', '#808080', '#7f00ff']) {
      const rgb = hexToRgb(hex)
      assert.ok(rgb, `hexToRgb failed for ${hex}`)
      assert.equal(rgbToHex(rgb), hex)
    }
  })

  it('rgbToHex clamps and rounds out-of-range channels', () => {
    assert.equal(rgbToHex({ r: -5, g: 300, b: 127.6 }), '#00ff80')
  })
})

/* ============================================================
 *  HSL
 * ========================================================== */

describe('hexToHsl / hslToHex', () => {
  it('produces known HSL for primaries and greys', () => {
    const red = hexToHsl('#ff0000')!
    assert.equal(red.h, 0)
    assert.equal(red.s, 100)
    assert.equal(red.l, 50)

    const white = hexToHsl('#ffffff')!
    assert.equal(white.s, 0)
    assert.equal(white.l, 100)

    const black = hexToHsl('#000000')!
    assert.equal(black.s, 0)
    assert.equal(black.l, 0)

    const grey = hexToHsl('#808080')!
    assert.equal(grey.s, 0)
    assert.ok(Math.abs(grey.l - 50.2) < 0.1)
  })

  it('returns null on invalid hex', () => {
    assert.equal(hexToHsl('nope'), null)
  })

  it('round-trips hex -> hsl -> hex within +/-1 per channel', () => {
    const colors = [
      '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
      '#10b981', '#123456', '#fedcba', '#808080', '#7f00ff',
      '#e11d48', '#f59e0b', '#0ea5e9', '#a3e635', '#4b5563',
    ]
    for (const hex of colors) {
      const hsl = hexToHsl(hex)
      assert.ok(hsl, `hexToHsl failed for ${hex}`)
      const back = hexToRgb(hslToHex(hsl))!
      const orig = hexToRgb(hex)!
      for (const ch of ['r', 'g', 'b'] as const) {
        assert.ok(
          Math.abs(back[ch] - orig[ch]) <= 1,
          `${hex}: channel ${ch} drifted ${orig[ch]} -> ${back[ch]}`,
        )
      }
    }
  })
})

/* ============================================================
 *  OKLCH
 * ========================================================== */

describe('rgbToOklch', () => {
  it('matches reference values for pure red', () => {
    const { l, c, h } = rgbToOklch({ r: 255, g: 0, b: 0 })
    assert.ok(Math.abs(l - 0.628) < 0.001, `L was ${l}`)
    assert.ok(Math.abs(c - 0.2577) < 0.001, `C was ${c}`)
    assert.ok(Math.abs(h - 29.23) < 0.1, `H was ${h}`)
  })

  it('white is L~1, C~0', () => {
    const { l, c } = rgbToOklch({ r: 255, g: 255, b: 255 })
    assert.ok(Math.abs(l - 1) < 0.001, `L was ${l}`)
    assert.ok(c < 0.001, `C was ${c}`)
  })

  it('black is L~0, C~0', () => {
    const { l, c } = rgbToOklch({ r: 0, g: 0, b: 0 })
    assert.ok(Math.abs(l) < 0.001, `L was ${l}`)
    assert.ok(c < 0.001, `C was ${c}`)
  })

  it('pins hue to 0 for achromatic colors', () => {
    for (const v of [0, 64, 128, 192, 255]) {
      assert.equal(rgbToOklch({ r: v, g: v, b: v }).h, 0)
    }
  })
})

describe('oklchToRgb', () => {
  it('round-trips rgb -> oklch -> rgb exactly', () => {
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 0, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
      { r: 128, g: 128, b: 128 },
      { r: 64, g: 64, b: 64 },
      { r: 192, g: 192, b: 192 },
      { r: 16, g: 185, b: 129 },  // #10b981
      { r: 18, g: 52, b: 86 },    // #123456
      { r: 255, g: 136, b: 0 },   // #ff8800
      { r: 225, g: 29, b: 72 },   // #e11d48
    ]
    for (const rgb of colors) {
      assert.deepEqual(oklchToRgb(rgbToOklch(rgb)), rgb, `round-trip failed for ${JSON.stringify(rgb)}`)
    }
  })
})

describe('oklchInSrgbGamut', () => {
  it('is true for colors derived from sRGB', () => {
    assert.equal(oklchInSrgbGamut(rgbToOklch({ r: 255, g: 0, b: 0 })), true)
    assert.equal(oklchInSrgbGamut(rgbToOklch({ r: 16, g: 185, b: 129 })), true)
    assert.equal(oklchInSrgbGamut({ l: 0.5, c: 0.05, h: 200 }), true)
  })

  it('is false for out-of-gamut chroma', () => {
    assert.equal(oklchInSrgbGamut({ l: 0.7, c: 0.35, h: 150 }), false)
  })

  it('is false for lightness beyond the gamut', () => {
    assert.equal(oklchInSrgbGamut({ l: 1.1, c: 0, h: 0 }), false)
  })
})

/* ============================================================
 *  WCAG contrast
 * ========================================================== */

describe('contrastRatio', () => {
  it('black on white is 21', () => {
    assert.ok(Math.abs(contrastRatio('#000000', '#ffffff')! - 21) < 0.01)
  })

  it('is symmetric', () => {
    assert.equal(contrastRatio('#000000', '#ffffff'), contrastRatio('#ffffff', '#000000'))
  })

  it('same color is 1', () => {
    assert.equal(contrastRatio('#10b981', '#10b981'), 1)
    assert.equal(contrastRatio('#000', '#000000'), 1)
  })

  it('returns null on invalid input', () => {
    assert.equal(contrastRatio('nope', '#ffffff'), null)
    assert.equal(contrastRatio('#ffffff', 'nope'), null)
  })
})

describe('wcagLevel', () => {
  it('normal text thresholds at 3.0 / 4.5 / 7.0', () => {
    assert.equal(wcagLevel(2.99, false), 'Fail')
    assert.equal(wcagLevel(3.0, false), 'AA Large')
    assert.equal(wcagLevel(4.49, false), 'AA Large')
    assert.equal(wcagLevel(4.5, false), 'AA')
    assert.equal(wcagLevel(6.99, false), 'AA')
    assert.equal(wcagLevel(7.0, false), 'AAA')
    assert.equal(wcagLevel(21, false), 'AAA')
  })

  it('large text thresholds at 3.0 / 4.5', () => {
    assert.equal(wcagLevel(2.99, true), 'Fail')
    assert.equal(wcagLevel(3.0, true), 'AA Large')
    assert.equal(wcagLevel(4.49, true), 'AA Large')
    assert.equal(wcagLevel(4.5, true), 'AAA')
  })
})

/* ============================================================
 *  Palette generation
 * ========================================================== */

const SCHEMES: PaletteScheme[] = [
  'analogous',
  'complementary',
  'triadic',
  'split-complementary',
  'tetradic',
  'monochromatic',
  'shades',
]

describe('generatePalette', () => {
  it('returns exactly 5 valid 6-digit hex colors for every scheme', () => {
    for (const scheme of SCHEMES) {
      for (const base of ['#10b981', '#ff0000', '#123456', '#808080']) {
        const { colors, name } = generatePalette(base, scheme)
        assert.equal(colors.length, 5, `${scheme} returned ${colors.length} colors`)
        assert.ok(name.length > 0, `${scheme} has no name`)
        for (const c of colors) {
          assert.match(c, HEX6, `${scheme}(${base}) produced invalid color ${c}`)
        }
      }
    }
  })

  // The palette tool UI (src/app/tools/palette/page.tsx) claims
  // "base at position 3" (i.e. index 2) for every scheme. That is only
  // true for analogous / monochromatic / shades; the implementation puts
  // the base at index 1 for complementary and index 0 for triadic,
  // split-complementary, and tetradic. These assertions pin the ACTUAL
  // behavior — see the test-run report for the UI-copy mismatch finding.
  it('places the base color where the implementation actually puts it', () => {
    const base = '#10b981'
    const actualBaseIndex: Record<PaletteScheme, number> = {
      analogous: 2,
      complementary: 1,
      triadic: 0,
      'split-complementary': 0,
      tetradic: 0,
      monochromatic: 2,
      shades: 2,
    }
    for (const scheme of SCHEMES) {
      const { colors } = generatePalette(base, scheme)
      assert.equal(
        colors[actualBaseIndex[scheme]],
        base,
        `${scheme}: base not at index ${actualBaseIndex[scheme]} (got [${colors.join(', ')}])`,
      )
    }
  })

  it('does NOT place the base at index 2 for the schemes that contradict the UI claim', () => {
    const base = '#10b981'
    for (const scheme of ['complementary', 'triadic', 'split-complementary', 'tetradic'] as PaletteScheme[]) {
      const { colors } = generatePalette(base, scheme)
      assert.notEqual(colors[2], base, `${scheme}: base unexpectedly at index 2 now — UI claim may have been fixed`)
    }
  })

  it('falls back to 5 copies of the input for an invalid base', () => {
    const { colors } = generatePalette('nope', 'triadic')
    assert.deepEqual(colors, ['nope', 'nope', 'nope', 'nope', 'nope'])
  })
})
