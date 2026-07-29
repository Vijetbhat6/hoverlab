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
