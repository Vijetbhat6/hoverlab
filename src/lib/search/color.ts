/**
 * Which colour an effect is, read off its own source.
 *
 * ── WHY THIS IS A BUILD-TIME GUESS THAT REFUSES TO GUESS ────────────────
 *
 * "Show me the blue ones" is one of the few searches a designer makes with
 * no words at all, and nothing in the catalog answers it: an effect's tags
 * name what it *does* ("pulse", "shimmer"), not what colour it is. The only
 * place the colour lives is the CSS, so that is where this reads it — every
 * hex, rgb(), hsl() and oklch() literal, converted to a hue and bucketed.
 *
 * The rule that shapes everything below: an effect is tagged only when the
 * source makes the answer plain, and left untagged otherwise. A colour
 * filter that is right for 60% of effects and quietly wrong for the rest is
 * worse than one that covers 60% and says so, because the wrong ones are the
 * ones a designer pastes into a client's project. So:
 *
 *   - Colours the CSS never spells out — `currentColor`, `var(--accent)`,
 *     `hsl(var(--primary))` — are invisible to this, and an effect made only
 *     of them is untagged. That is the honest answer; the colour is whatever
 *     the consuming project says it is.
 *   - Near-greys and near-whites carry no usable hue (the hue of #f5f5f7 is
 *     noise), so they are not counted as a colour at all.
 *   - A bucket only counts when it holds at least 40% of the effect's
 *     coloured weight, so an effect has at most two: a sky-to-indigo gradient
 *     is blue and purple, and a rainbow, which clears nothing, is untagged
 *     rather than filed under whichever hue won by a point.
 *   - "Mono" is the riskiest label — a black shadow under a `var(--x)` fill
 *     is not a monochrome effect — so it needs several real neutral colours
 *     and no colour-bearing declaration hiding behind a variable.
 *
 * Pure and dependency-free so the same code runs in the build script and in
 * the tests, and so `tsx` can import it by relative path.
 */

export const COLOR_BUCKETS = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'mono',
] as const

export type ColorBucket = (typeof COLOR_BUCKETS)[number]

export function isColorBucket(value: string | null | undefined): value is ColorBucket {
  return (COLOR_BUCKETS as readonly string[]).includes(value ?? '')
}

/** Display names, and a representative swatch for the filter UI. */
export const COLOR_LABEL: Record<ColorBucket, { name: string; swatch: string }> = {
  red: { name: 'Red', swatch: '#ef4444' },
  orange: { name: 'Orange', swatch: '#f97316' },
  yellow: { name: 'Yellow', swatch: '#eab308' },
  green: { name: 'Green', swatch: '#22c55e' },
  cyan: { name: 'Cyan', swatch: '#06b6d4' },
  blue: { name: 'Blue', swatch: '#3b82f6' },
  purple: { name: 'Purple', swatch: '#a855f7' },
  pink: { name: 'Pink', swatch: '#ec4899' },
  mono: { name: 'Black & white', swatch: '#71717a' },
}

/* ------------------------------------------------------------------ *
 *  Colour maths
 * ------------------------------------------------------------------ */

export interface Oklch {
  l: number
  c: number
  /** Degrees, 0-360. Meaningless when `c` is near zero. */
  h: number
}

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** sRGB channels in 0..1 to OKLCH (Björn Ottosson's matrices). */
export function rgbToOklch(r: number, g: number, b: number): Oklch {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.hypot(A, B)
  let h = (Math.atan2(B, A) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360
  const k = (n: number) => (n + hue / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/* ------------------------------------------------------------------ *
 *  Hue buckets
 * ------------------------------------------------------------------ */

/**
 * OKLCH hue → bucket. The boundaries sit between the Tailwind hues people
 * name: rose (17°) and red (25°) are red; orange (50°) and amber (76°) are
 * orange; yellow is 78-118°; lime (131°) through emerald (163°) are green;
 * teal (181°) and cyan (215°) are cyan; sky (237°) and blue (260°) are blue;
 * indigo (277°) through fuchsia (322°) are purple; pink (354°) wraps round.
 */
export function bucketForHue(h: number): Exclude<ColorBucket, 'mono'> {
  const hue = ((h % 360) + 360) % 360
  if (hue >= 5 && hue < 38) return 'red'
  if (hue >= 38 && hue < 78) return 'orange'
  if (hue >= 78 && hue < 118) return 'yellow'
  if (hue >= 118 && hue < 175) return 'green'
  if (hue >= 175 && hue < 225) return 'cyan'
  if (hue >= 225 && hue < 275) return 'blue'
  if (hue >= 275 && hue < 335) return 'purple'
  return 'pink'
}

/* ------------------------------------------------------------------ *
 *  Literal extraction
 * ------------------------------------------------------------------ */

interface ColorUse {
  oklch: Oklch
  alpha: number
  /** True inside a shadow, where black at low alpha is depth, not design. */
  shadow: boolean
}

const NUM = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`

const HEX_RE = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-z_-])/gi
const RGB_RE = new RegExp(
  String.raw`rgba?\(\s*(${NUM}%?)[\s,]+(${NUM}%?)[\s,]+(${NUM}%?)(?:\s*[,/]\s*(${NUM}%?))?\s*\)`,
  'gi',
)
const HSL_RE = new RegExp(
  String.raw`hsla?\(\s*(${NUM})(?:deg)?[\s,]+(${NUM})%[\s,]+(${NUM})%(?:\s*[,/]\s*(${NUM}%?))?\s*\)`,
  'gi',
)
const OKLCH_RE = new RegExp(
  String.raw`oklch\(\s*(${NUM}%?)\s+(${NUM}%?)\s+(${NUM})(?:deg)?(?:\s*/\s*(${NUM}%?))?\s*\)`,
  'gi',
)

function alphaOf(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 1
  const v = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1
}

function channel(raw: string): number {
  return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw) / 255
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Every colour literal in one declaration value.
 *
 * Deliberately not named colours: `red` and `white` do appear, but a regex
 * over English words would also read "blue" out of a font name or a
 * `content` string, and the literals above already cover how this catalog
 * writes colour. Better to miss a rare `background: red` than to invent one.
 */
function literalsIn(value: string, shadow: boolean): ColorUse[] {
  const out: ColorUse[] = []

  for (const m of value.matchAll(HEX_RE)) {
    const hex = m[1]!
    const full =
      hex.length <= 4
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex
    const r = parseInt(full.slice(0, 2), 16) / 255
    const g = parseInt(full.slice(2, 4), 16) / 255
    const b = parseInt(full.slice(4, 6), 16) / 255
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1
    out.push({ oklch: rgbToOklch(r, g, b), alpha: a, shadow })
  }

  for (const m of value.matchAll(RGB_RE)) {
    out.push({
      oklch: rgbToOklch(
        clamp01(channel(m[1]!)),
        clamp01(channel(m[2]!)),
        clamp01(channel(m[3]!)),
      ),
      alpha: alphaOf(m[4]),
      shadow,
    })
  }

  for (const m of value.matchAll(HSL_RE)) {
    const [r, g, b] = hslToRgb(
      parseFloat(m[1]!),
      clamp01(parseFloat(m[2]!) / 100),
      clamp01(parseFloat(m[3]!) / 100),
    )
    out.push({ oklch: rgbToOklch(clamp01(r), clamp01(g), clamp01(b)), alpha: alphaOf(m[4]), shadow })
  }

  for (const m of value.matchAll(OKLCH_RE)) {
    const l = m[1]!.endsWith('%') ? parseFloat(m[1]!) / 100 : parseFloat(m[1]!)
    const c = m[2]!.endsWith('%') ? (parseFloat(m[2]!) / 100) * 0.4 : parseFloat(m[2]!)
    out.push({ oklch: { l, c, h: parseFloat(m[3]!) }, alpha: alphaOf(m[4]), shadow })
  }

  return out
}

/**
 * The declarations in a stylesheet, without its selectors.
 *
 * `#header {` is not a colour and `#fade {` is not #fade — hex digits are
 * also valid id characters — so selectors and at-rule preludes have to be
 * excluded, not filtered by pattern. A declaration ends at `;` or `}`; a
 * segment that ends at `{` is a prelude. `url(…)` and quoted strings are cut
 * first, because `data:` URIs contain semicolons and `content: "#fff"` is
 * text.
 */
export function declarationsOf(css: string): Array<{ prop: string; value: string }> {
  const cleaned = css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/url\([^)]*\)/gi, 'url()')
    .replace(/"[^"]*"|'[^']*'/g, '""')

  const out: Array<{ prop: string; value: string }> = []
  let buf = ''
  let depth = 0
  const flush = () => {
    const seg = buf.trim()
    buf = ''
    const i = seg.indexOf(':')
    if (i > 0) out.push({ prop: seg.slice(0, i).trim().toLowerCase(), value: seg.slice(i + 1) })
  }
  for (const ch of cleaned) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (depth === 0 && ch === '{') {
      buf = ''
    } else if (depth === 0 && (ch === ';' || ch === '}')) {
      flush()
    } else {
      buf += ch
    }
  }
  flush()
  return out
}

/** Colours in the inline `style=""` and SVG paint attributes of markup. */
function declarationsOfHtml(html: string): Array<{ prop: string; value: string }> {
  const out: Array<{ prop: string; value: string }> = []
  for (const m of html.matchAll(/style\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    out.push(...declarationsOf(`x{${m[1] ?? m[2] ?? ''}}`))
  }
  for (const m of html.matchAll(
    /\b(fill|stroke|stop-color|flood-color)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
  )) {
    out.push({ prop: m[1]!.toLowerCase(), value: m[2] ?? m[3] ?? '' })
  }
  return out
}

/* ------------------------------------------------------------------ *
 *  Dominant colour
 * ------------------------------------------------------------------ */

/**
 * Below this OKLCH chroma a colour is grey for our purposes.
 *
 * 0.06 and not the 0.04 an eyeballed "looks grey" would suggest: Tailwind's
 * slate scale (#0f172a, #1e293b, #64748b) sits at 0.04-0.05 and carries a
 * blue hue, so a lower floor tags every dark-navy card blue on the strength
 * of its background.
 */
const CHROMA_FLOOR = 0.06
/** Below or above these, lightness makes the hue unreadable. */
const L_MIN = 0.12
const L_MAX = 0.98
/**
 * A bucket is a main colour when it holds at least this share of the
 * coloured weight. At most two buckets can clear 0.4, which is the point:
 * an effect can be "blue and purple" (the sky-to-indigo gradient behind 200
 * of these), and a rainbow clears nothing and is left untagged.
 */
const MAIN_SHARE = 0.4
/** There must be at least this much coloured weight at all. */
const MIN_WEIGHT = 0.05
/** Neutral effects need this many real neutral colours to be called mono. */
const MONO_MIN_USES = 3

const COLOUR_PROPS = /^(color|background(-color|-image)?|border(-\w+)*-color|border(-\w+)?|outline(-color)?|fill|stroke|stop-color|caret-color|accent-color|--[\w-]+)$/

/**
 * The main colours of an effect — none, one or two — or `[]` when the source
 * does not say. Most-prominent first.
 *
 * "Main" is the reading a filter needs: "show me the blue ones" should
 * include the blue-to-indigo gradient, and does, because blue is one of its
 * two main colours. Forcing one label per effect would either mis-file that
 * gradient as purple by three points or drop it, and a filter that hides the
 * sky-blue "ocean" family from the blue results is the failure a reader
 * notices first.
 *
 * `html` is optional; effects carry inline styles and SVG fills that the
 * stylesheet never mentions.
 */
export function dominantColors(css: string, html = ''): ColorBucket[] {
  const decls = [...declarationsOf(css), ...declarationsOfHtml(html)]

  const weight = new Map<Exclude<ColorBucket, 'mono'>, number>()
  let coloured = 0
  let neutralUses = 0
  let hiddenBehindVar = false

  for (const { prop, value } of decls) {
    const shadow = /shadow/.test(prop) || /drop-shadow/.test(value)
    if (COLOUR_PROPS.test(prop) && /var\(/.test(value)) hiddenBehindVar = true

    for (const use of literalsIn(value, shadow)) {
      const { l, c, h } = use.oklch
      if (use.alpha < 0.15) continue
      if (c >= CHROMA_FLOOR && l >= L_MIN && l <= L_MAX) {
        // Chroma-weighted, so a vivid accent outweighs the pale tint beside
        // it, and shadows count for a quarter.
        const w = Math.min(c, 0.2) * use.alpha * (use.shadow ? 0.25 : 1)
        const bucket = bucketForHue(h)
        weight.set(bucket, (weight.get(bucket) ?? 0) + w)
        coloured += w
      } else if (!use.shadow && use.alpha >= 0.3) {
        neutralUses++
      }
    }
  }

  if (coloured >= MIN_WEIGHT) {
    return [...weight.entries()]
      .filter(([, w]) => w / coloured >= MAIN_SHARE)
      .sort((a, b) => b[1] - a[1])
      .map(([bucket]) => bucket)
  }

  if (coloured === 0 && neutralUses >= MONO_MIN_USES && !hiddenBehindVar) return ['mono']
  return []
}
