/**
 * Color utilities for the Designer Tools.
 *
 * All conversions go through HSL as the canonical intermediate format
 * because HSL is what designers reason about (hue / saturation / lightness
 * map directly to mental models of "color", "intensity", "brightness").
 *
 * Storage format: hex strings (#rrggbb or #rgb) — most compact, universally
 * understood, and what designers paste into Figma / Sketch.
 */

/** A hex color string (#rgb, #rrggbb, or #rrggbbaa). */
export type Hex = string

/** HSL triple (h: 0-360, s: 0-100, l: 0-100). */
export interface HSL {
  h: number
  s: number
  l: number
}

/** RGB triple (0-255 each). */
export interface RGB {
  r: number
  g: number
  b: number
}

/* ============================================================
 *  Conversions
 * ========================================================== */

/** Parse a hex string (#rgb, #rrggbb, #rrggbbaa) to RGB. Returns null on failure. */
export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim())
  if (!m) return null
  let s = m[1]
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  }
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}

/** Convert RGB to a 6-digit hex string. */
export function rgbToHex({ r, g, b }: RGB): Hex {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Convert hex directly to HSL. Returns null on invalid input. */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb)
}

/** Convert RGB to HSL (algorithm from the CSS spec). */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rN = r / 255
  const gN = g / 255
  const bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rN) h = ((gN - bN) / d) % 6
    else if (max === gN) h = (bN - rN) / d + 2
    else h = (rN - gN) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s: s * 100, l: l * 100 }
}

/** Convert HSL to RGB. */
export function hslToRgb({ h, s, l }: HSL): RGB {
  const hN = ((h % 360) + 360) % 360 / 360
  const sN = Math.max(0, Math.min(100, s)) / 100
  const lN = Math.max(0, Math.min(100, l)) / 100
  if (sN === 0) {
    const v = Math.round(lN * 255)
    return { r: v, g: v, b: v }
  }
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN
  const p = 2 * lN - q
  const hue = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: Math.round(hue(hN + 1 / 3) * 255),
    g: Math.round(hue(hN) * 255),
    b: Math.round(hue(hN - 1 / 3) * 255),
  }
}

/** Convert HSL to a 6-digit hex string. */
export function hslToHex(hsl: HSL): Hex {
  return rgbToHex(hslToRgb(hsl))
}

/** Convert a hex string to "hsl(h, s%, l%)" CSS string. */
export function hexToHslCss(hex: string): string {
  const hsl = hexToHsl(hex)
  if (!hsl) return 'hsl(0, 0%, 0%)'
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
}

/* ============================================================
 *  OKLCH
 *
 *  OKLCH does not route through HSL: its whole value is that lightness
 *  and chroma are perceptually uniform, which HSL destroys. Conversions
 *  go sRGB → linear-light → OKLab → OKLCH per Björn Ottosson's
 *  reference matrices (the same ones the CSS Color 4 spec cites).
 * ========================================================== */

/** OKLCH triple (l: 0-1, c: chroma ≥ 0, h: 0-360 degrees). */
export interface OKLCH {
  l: number
  c: number
  h: number
}

function srgbChannelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function linearChannelToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/** Convert sRGB to OKLCH. */
export function rgbToOklch({ r, g, b }: RGB): OKLCH {
  const lr = srgbChannelToLinear(r)
  const lg = srgbChannelToLinear(g)
  const lb = srgbChannelToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.sqrt(a * a + bb * bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360
  // Hue is undefined at zero chroma; pin it so grays round-trip stably.
  return { l: L, c, h: c < 1e-6 ? 0 : h }
}

/** OKLCH → linear-light sRGB, unclamped — channels outside [0,1] mean out of gamut. */
function oklchToLinearRgb({ l, c, h }: OKLCH): { r: number; g: number; b: number } {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  }
}

/** True when the OKLCH color fits in the sRGB gamut (small epsilon for rounding). */
export function oklchInSrgbGamut(oklch: OKLCH): boolean {
  const { r, g, b } = oklchToLinearRgb(oklch)
  const eps = 1e-4
  return (
    r >= -eps && r <= 1 + eps &&
    g >= -eps && g <= 1 + eps &&
    b >= -eps && b <= 1 + eps
  )
}

/** Convert OKLCH to sRGB, clamping each channel into gamut. */
export function oklchToRgb(oklch: OKLCH): RGB {
  const lin = oklchToLinearRgb(oklch)
  const to = (v: number) =>
    Math.round(linearChannelToSrgb(Math.min(1, Math.max(0, v))) * 255)
  return { r: to(lin.r), g: to(lin.g), b: to(lin.b) }
}

/** Format OKLCH as a CSS string, e.g. "oklch(0.6280 0.2577 29.23)". */
export function formatOklch({ l, c, h }: OKLCH): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`
}

/* ============================================================
 *  Palette generation
 * ========================================================== */

export type PaletteScheme =
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic'
  | 'shades'

export interface PaletteResult {
  /** Human-readable name of the scheme. */
  name: string
  /** The colors in the palette (always 5 for consistent UI layout). */
  colors: Hex[]
}

/**
 * Generate a 5-color palette from a base hex color using the chosen scheme.
 * Always returns exactly 5 colors so the UI grid is stable.
 */
export function generatePalette(base: Hex, scheme: PaletteScheme): PaletteResult {
  const hsl = hexToHsl(base)
  if (!hsl) {
    return { name: scheme, colors: [base, base, base, base, base] }
  }
  const { h, s, l } = hsl

  const colors: Hex[] = []
  let name = ''

  switch (scheme) {
    case 'analogous':
      name = 'Analogous'
      colors.push(hslToHex({ h: (h - 60 + 360) % 360, s, l }))
      colors.push(hslToHex({ h: (h - 30 + 360) % 360, s, l }))
      colors.push(base)
      colors.push(hslToHex({ h: (h + 30) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 60) % 360, s, l }))
      break
    case 'complementary':
      name = 'Complementary'
      colors.push(hslToHex({ h, s, l: Math.max(10, l - 20) }))
      colors.push(base)
      colors.push(hslToHex({ h, s, l: Math.min(90, l + 20) }))
      colors.push(hslToHex({ h: (h + 180) % 360, s, l: Math.max(10, l - 10) }))
      colors.push(hslToHex({ h: (h + 180) % 360, s, l }))
      break
    case 'triadic':
      name = 'Triadic'
      colors.push(base)
      colors.push(hslToHex({ h: (h + 120) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 240) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 60) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 300) % 360, s, l }))
      break
    case 'split-complementary':
      name = 'Split Complementary'
      colors.push(base)
      colors.push(hslToHex({ h: (h + 150) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 210) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 150) % 360, s, l: Math.min(90, l + 15) }))
      colors.push(hslToHex({ h: (h + 210) % 360, s, l: Math.max(10, l - 15) }))
      break
    case 'tetradic':
      name = 'Tetradic (Rectangle)'
      colors.push(base)
      colors.push(hslToHex({ h: (h + 90) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 180) % 360, s, l }))
      colors.push(hslToHex({ h: (h + 270) % 360, s, l }))
      colors.push(hslToHex({ h, s: Math.max(0, s - 30), l: Math.min(90, l + 15) }))
      break
    case 'monochromatic':
      name = 'Monochromatic'
      colors.push(hslToHex({ h, s, l: Math.max(5, l - 30) }))
      colors.push(hslToHex({ h, s, l: Math.max(10, l - 15) }))
      colors.push(base)
      colors.push(hslToHex({ h, s, l: Math.min(90, l + 15) }))
      colors.push(hslToHex({ h, s, l: Math.min(95, l + 30) }))
      break
    case 'shades':
      name = 'Shades & Tints'
      colors.push(hslToHex({ h, s: 0, l }))
      colors.push(hslToHex({ h, s, l: Math.max(5, l - 25) }))
      colors.push(base)
      colors.push(hslToHex({ h, s, l: Math.min(92, l + 25) }))
      colors.push(hslToHex({ h, s: Math.min(100, s + 30), l }))
      break
  }

  return { name, colors }
}

/* ============================================================
 *  WCAG contrast
 * ========================================================== */

/** Relative luminance per WCAG 2.1. */
export function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contrast ratio between two hex colors, range [1, 21]. */
export function contrastRatio(fg: Hex, bg: Hex): number | null {
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  if (!fgRgb || !bgRgb) return null
  const l1 = relativeLuminance(fgRgb)
  const l2 = relativeLuminance(bgRgb)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** WCAG level for a given ratio at the given text size. */
export function wcagLevel(ratio: number, large: boolean): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (large) {
    if (ratio >= 4.5) return 'AAA'
    if (ratio >= 3) return 'AA Large'
    return 'Fail'
  }
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

/* ============================================================
 *  Formatting
 * ========================================================== */

/** Format a hex string with the leading # and lowercase. */
export function normalizeHex(input: string): Hex | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed)
  if (!m) return null
  let s = m[1].toLowerCase()
  if (s.length === 3) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  }
  return `#${s}`
}

/** Random pleasant base color for the "Surprise me" button. */
export function randomHex(): Hex {
  const h = Math.floor(Math.random() * 360)
  const s = 60 + Math.floor(Math.random() * 30)
  const l = 45 + Math.floor(Math.random() * 15)
  return hslToHex({ h, s, l })
}
