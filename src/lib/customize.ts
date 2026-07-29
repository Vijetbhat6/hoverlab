/**
 * Live CSS customization engine for Hoverlab.
 *
 * Takes an effect's CSS string and applies user-controlled transformations:
 *   - hue shift (rotate all colors around the color wheel)
 *   - saturation shift (boost or mute color intensity)
 *   - scale (multiply every px/rem dimension)
 *   - speed (multiply every animation duration in seconds)
 *
 * The transforms are pure string operations — no AST, no CSS parser — so they
 * are fast enough to run on every slider drag. Each transform is also
 * idempotent against the ORIGINAL css: we always re-derive from
 * effect.css + opts, never accumulate.
 */

export interface CustomizationOptions {
  /** Hue rotation in degrees, -180 to +180. 0 = no change. */
  hue: number
  /** Saturation delta in percentage points, -100 to +100. 0 = no change. */
  saturation: number
  /** Multiplier for every px/rem value, 0.5 to 1.5. 1 = no change. */
  scale: number
  /** Multiplier for every animation duration (e.g. 1.4s), 0.25 to 3. 1 = no change. */
  speed: number
}

export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  hue: 0,
  saturation: 0,
  scale: 1,
  speed: 1,
}

export function isDefault(opts: CustomizationOptions): boolean {
  return (
    opts.hue === 0 &&
    opts.saturation === 0 &&
    opts.scale === 1 &&
    opts.speed === 1
  )
}

/* ============================================================
 *  Theme presets — one-click coordinated color shifts
 * ========================================================= */

export interface Preset {
  id: string
  name: string
  description: string
  /** A representative swatch color for the chip. */
  swatch: string
  opts: CustomizationOptions
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm reds and oranges',
    swatch: '#f97316',
    opts: { hue: 15, saturation: 25, scale: 1, speed: 1 },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and cyans',
    swatch: '#0ea5e9',
    opts: { hue: -45, saturation: 15, scale: 1, speed: 1 },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Greens and earthy browns',
    swatch: '#16a34a',
    opts: { hue: 90, saturation: 10, scale: 1, speed: 1 },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Strip color to grayscale',
    swatch: '#6b7280',
    opts: { hue: 0, saturation: -100, scale: 1, speed: 1 },
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Hyper-saturated electric vibe',
    swatch: '#d946ef',
    opts: { hue: -25, saturation: 60, scale: 1, speed: 1.25 },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft, muted tones',
    swatch: '#f9a8d4',
    opts: { hue: 0, saturation: -35, scale: 1, speed: 0.85 },
  },
]

/**
 * Detect which preset (if any) the current options match exactly.
 * Used to highlight the active preset chip.
 */
export function matchingPreset(opts: CustomizationOptions): Preset | null {
  for (const p of PRESETS) {
    if (
      p.opts.hue === opts.hue &&
      p.opts.saturation === opts.saturation &&
      p.opts.scale === opts.scale &&
      p.opts.speed === opts.speed
    ) {
      return p
    }
  }
  return null
}

/* ============================================================
 *  URL hash serialization
 *  Format: #hue=15&sat=25&scale=1.00&speed=1.25
 *  Only non-default values are written; missing keys default.
 * ========================================================= */

export interface HashParts {
  hue?: number
  saturation?: number
  scale?: number
  speed?: number
}

/**
 * Parse a URL hash (without the leading #) into a partial options object.
 * Returns only the keys that are present and valid. Invalid values are
 * silently dropped — we never throw.
 */
export function parseHash(hash: string): HashParts {
  const out: HashParts = {}
  if (!hash) return out
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash
  if (!stripped) return out
  for (const pair of stripped.split('&')) {
    const [k, v] = pair.split('=')
    if (v === undefined) continue
    const num = parseFloat(v)
    if (!Number.isFinite(num)) continue
    switch (k) {
      case 'hue':
        out.hue = num
        break
      case 'sat':
        out.saturation = num
        break
      case 'scale':
        out.scale = num
        break
      case 'speed':
        out.speed = num
        break
    }
  }
  return out
}

/**
 * Convert options into a URL hash string (without the leading #).
 * Returns an empty string when all values are default — so we don't
 * clutter the URL for unchanged effects.
 */
export function optsToHash(opts: CustomizationOptions): string {
  const parts: string[] = []
  if (opts.hue !== 0) parts.push(`hue=${opts.hue}`)
  if (opts.saturation !== 0) parts.push(`sat=${opts.saturation}`)
  if (opts.scale !== 1) parts.push(`scale=${opts.scale.toFixed(2)}`)
  if (opts.speed !== 1) parts.push(`speed=${opts.speed.toFixed(2)}`)
  return parts.join('&')
}

/**
 * Merge parsed hash parts onto the default options, producing a full
 * CustomizationOptions object. Used on first mount to restore state
 * from a shared URL.
 */
export function hashToOpts(parts: HashParts): CustomizationOptions {
  return {
    hue: parts.hue ?? 0,
    saturation: parts.saturation ?? 0,
    scale: parts.scale ?? 1,
    speed: parts.speed ?? 1,
  }
}

/* ============================================================
 *  Color conversion helpers
 * ========================================================== */

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360 / 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

/* ============================================================
 *  Number formatting helper
 * ========================================================== */

function fmt(n: number): string {
  // Round to 2 decimals, strip trailing zeros
  return Number(n.toFixed(2)).toString()
}

/* ============================================================
 *  Main transform
 * ========================================================== */

export function customizeCss(css: string, opts: CustomizationOptions): string {
  if (isDefault(opts)) return css

  let result = css

  /* 1. Hue + saturation shift ------------------------------------------
   * Replace #rrggbb colors. Skip near-grayscale colors (saturation < 5%)
   * when hue-shifting because rotating gray just produces gray — and we
   * want whites and blacks to stay put. Saturation, however, applies to
   * every color (including grays: pushing saturation up revives them,
   * pushing it to -100 strips all color).
   */
  if (opts.hue !== 0 || opts.saturation !== 0) {
    result = result.replace(/#([a-f\d]{6})\b/gi, (match) => {
      const hsl = hexToHsl(match)
      if (!hsl) return match
      const newHue = opts.hue === 0 ? hsl.h : (hsl.s < 5 ? hsl.h : hsl.h + opts.hue)
      const newSat = Math.max(0, Math.min(100, hsl.s + opts.saturation))
      return hslToHex(newHue, newSat, hsl.l)
    })
    // Also handle rgb()/rgba() — e.g. rgba(244, 63, 94, 0.3)
    result = result.replace(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g,
      (match, r, g, b, a) => {
        const hsl = rgbToHsl(+r, +g, +b)
        const newHue = opts.hue === 0 ? hsl.h : (hsl.s < 5 ? hsl.h : hsl.h + opts.hue)
        const newSat = Math.max(0, Math.min(100, hsl.s + opts.saturation))
        const shifted = hslToHex(newHue, newSat, hsl.l)
        // Convert back to rgb for the rgba() form
        const back = hexToHsl(shifted)!
        const rgb = hslToRgb(back.h, back.s, back.l)
        return a ? `rgba(${rgb.r},${rgb.g},${rgb.b},${a})` : `rgb(${rgb.r},${rgb.g},${rgb.b})`
      },
    )
    // Also handle hsl()/hsla() — e.g. hsla(215, 98%, 61%, 0.7)
    // These are common in gradient-heavy effects (mesh gradients, aurora backgrounds).
    // We shift hue/saturation in-place, preserving the alpha and the percentage format.
    result = result.replace(
      /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/g,
      (match, h, s, l, a) => {
        const origH = parseFloat(h)
        const origS = parseFloat(s)
        const origL = parseFloat(l)
        // Same grayscale rule as above: skip hue shift on near-grayscale colors.
        const newHue = opts.hue === 0 ? origH : (origS < 5 ? origH : origH + opts.hue)
        const newSat = Math.max(0, Math.min(100, origS + opts.saturation))
        // Keep one decimal of precision on hue (hsla often uses fractional hues),
        // and round saturation to a clean integer.
        const hueStr = Number.isInteger(newHue) ? `${newHue}` : `${newHue.toFixed(1)}`
        const satStr = `${Math.round(newSat)}`
        const lightStr = `${Math.round(origL)}`
        return a !== undefined
          ? `hsla(${hueStr}, ${satStr}%, ${lightStr}%, ${a})`
          : `hsl(${hueStr}, ${satStr}%, ${lightStr}%)`
      },
    )
  }

  /* 2. Scale sizes -----------------------------------------------------
   * Match Xpx / Xrem (and X.X). Skip 0 values to avoid `0.00px`.
   * This catches padding, margin, width, height, border-radius,
   * box-shadow offsets, etc.
   */
  if (opts.scale !== 1) {
    result = result.replace(/(\d+(?:\.\d+)?)(px|rem)\b/g, (match, val, unit) => {
      const num = parseFloat(val)
      if (num === 0) return match
      return `${fmt(num * opts.scale)}${unit}`
    })
  }

  /* 3. Scale animation durations --------------------------------------
   * Match X.Xs or Xs (CSS time unit). Be careful not to match the
   * unit 's' inside words — require a digit prefix and word boundary.
   * Also handle millisecond values (Xms) for completeness.
   */
  if (opts.speed !== 1) {
    // Seconds: 1.4s, 0.6s, 2s
    result = result.replace(/(\d+(?:\.\d+)?)s\b/g, (match, val) => {
      const num = parseFloat(val)
      return `${fmt(num * opts.speed)}s`
    })
    // Milliseconds: 600ms, 1200ms
    result = result.replace(/(\d+(?:\.\d+)?)ms\b/g, (match, val) => {
      const num = parseFloat(val)
      return `${fmt(num * opts.speed)}ms`
    })
  }

  return result
}

/* HSL → RGB helper for the rgba() branch */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360 / 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}
