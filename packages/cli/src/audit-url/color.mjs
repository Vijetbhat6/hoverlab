/**
 * Colour maths for `hoverlab audit-url`. Pure functions, no I/O.
 *
 * Colours arrive from the page already resolved to sRGB `[r, g, b, a]`
 * (0-255, 0-255, 0-255, 0-1). The page does that conversion itself, because
 * `getComputedStyle` hands back `oklch(...)`, `color-mix` results and
 * `color(display-p3 ...)` unchanged and this side has no business
 * reimplementing every CSS colour syntax a browser understands.
 */

/** @typedef {[number, number, number, number]} Rgba */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

/** `#rrggbb`, or `#rrggbbaa` when the colour is not opaque. */
export function toHex([r, g, b, a = 1]) {
  const part = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  const base = `#${part(r)}${part(g)}${part(b)}`
  return a >= 0.999 ? base : `${base}${part(a * 255)}`
}

/**
 * Lay `top` over an already-opaque `bottom`.
 *
 * @param {Rgba} top
 * @param {Rgba} bottom
 * @returns {Rgba}
 */
export function composite(top, bottom) {
  const a = clamp(top[3], 0, 1)
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ]
}

/** WCAG 2.x relative luminance. */
export function luminance([r, g, b]) {
  const lin = (channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two opaque colours, 1 to 21. */
export function contrastRatio(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The ratio a piece of text has to reach.
 *
 * Large text is 24 CSS px and up, or 18.66 px (14 pt) and up when bold.
 * Judged on the computed size and weight because that is what was painted;
 * the source may have said `text-xl` or `1.5rem` or `clamp(...)`.
 */
export function requiredRatio(fontSizePx, fontWeight) {
  const bold = Number(fontWeight) >= 700
  const large = fontSizePx >= 24 || (bold && fontSizePx >= 18.66)
  return { large, ratio: large ? 3 : 4.5 }
}

/** A ratio for display: truncated, never rounded up, so 4.499 does not print as a pass. */
export function formatRatio(ratio) {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`
}

/** sRGB to OKLab, https://bottosson.github.io/posts/oklab/ */
export function toOklab([r, g, b]) {
  const lin = (channel) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const lr = lin(r)
  const lg = lin(g)
  const lb = lin(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/**
 * Perceptual distance, scaled so that about 2.3 is one just-noticeable
 * difference (the same scale as CIE76 delta-E, which people have intuitions
 * about). Euclidean distance in OKLab, times 100.
 */
export function deltaE(a, b) {
  const [l1, a1, b1] = toOklab(a)
  const [l2, a2, b2] = toOklab(b)
  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/** OKLab chroma. Below about 0.045 a colour reads as a grey, tinted or not. */
export function chroma(rgb) {
  const [, a, b] = toOklab(rgb)
  return Math.hypot(a, b)
}

export const GREY_CHROMA = 0.045

export function isGrey(rgb) {
  return chroma(rgb) < GREY_CHROMA
}
