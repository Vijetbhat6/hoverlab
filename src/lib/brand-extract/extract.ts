/**
 * Read a brand out of a website: its colour, its typeface and its corners.
 *
 * Pure. Takes the HTML and CSS text of a page and returns findings; it never
 * touches the network. That split is the point of the file — the fetching is
 * the dangerous half (a server that fetches visitor-supplied URLs is an SSRF
 * primitive until proven otherwise, see `safe-fetch.ts`), and everything that
 * can be wrong about *reading* a brand is testable here against a string.
 *
 * ── HONESTY IS THE FEATURE ──────────────────────────────────────────────
 *
 * A "paste your URL" tool that always returns a confident answer is worse
 * than none: half the sites on the web have no single brand colour, and a
 * tool that picks one anyway sends somebody away with a theme that is not
 * theirs. So every finding carries where it came from and how much to trust
 * it, and the extractor is allowed to say "nothing found":
 *
 *   high     the site itself named it — a `--primary` or `--brand` variable
 *            on the page's default scope, a `--radius`. Somebody decided
 *            this and wrote it down.
 *   medium   a deliberate but indirect signal — `<meta name="theme-color">`,
 *            a Safari pinned-tab colour, an `--accent`, the base font-family.
 *   low      inferred by counting. The most-used chromatic colour is often
 *            the brand and often a syntax highlighter, so it is labelled as
 *            a guess and the UI says so.
 *
 * ── WHAT WILL FOOL IT, stated rather than hoped away ────────────────────
 *
 * A site that styles itself at runtime from JavaScript (CSS-in-JS) ships
 * almost no colour in its CSS — Linear's stylesheet has none at all — and is
 * reported as "nothing found", with the reason. A site whose brand is black
 * and white has no chromatic colour to find. A page dominated by a
 * third-party widget votes for the widget's blue, which is why frequency
 * counting is the last resort and never called "declared".
 *
 * ── LESSONS FROM RUNNING IT AGAINST REAL SITES ──────────────────────────
 *
 * Each of these was a bug the synthetic tests did not catch and a live run
 * did, and each is now a test:
 *
 *   • A variable only speaks for the site on the page's DEFAULT scope
 *     (`:root`, `html`, `body`). shadcn's own docs define fifteen `.theme-*`
 *     classes with fifteen `--primary`s; the first one found is nobody's brand.
 *   • `@media (prefers-color-scheme: dark)` is stripped before reading, or
 *     its `:root` overrides the light one and a white site reports its
 *     dark-mode colour.
 *   • `var(--font-sans)` is followed. `body { font-family: var(--font-sans) }`
 *     is how most modern sites name their typeface, and it resolves to
 *     nothing without this.
 *   • `--font-weight-light: 300` is not a typeface. Nor is `--font-size-*`.
 *   • A neutral `--primary` is an answer, not a gap: counting colours after
 *     it would crown whichever chart colour is used most.
 *   • Tailwind's own `--tw-*` variables are ignored. Every Tailwind site
 *     ships `--tw-ring-color: rgb(59 130 246 / .5)`, the framework's default
 *     blue, and counting it would make half the web "brand blue".
 */

import { hexToRgb, rgbToHex, rgbToOklch, type RGB } from '@/lib/color-tools'

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */

export type Confidence = 'high' | 'medium' | 'low'

export interface Sourced<T> {
  value: T
  /** Where it was found, in words a person can check: "--primary in the site's CSS". */
  source: string
  confidence: Confidence
}

export interface PaletteEntry {
  hex: string
  /** Relative weight, comparable only within one extraction. */
  weight: number
  source: string
}

export interface FontFinding {
  /** The family as the site names it, cleaned of build-tool hashes. */
  name: string
  kind: 'sans' | 'serif' | 'mono'
  /** True for system stacks, which need no download. */
  system: boolean
}

export interface RadiusFinding {
  rem: number
  /** "12px", or "pill" — how the site wrote it. */
  label: string
}

export interface BrandExtraction {
  url: string
  title: string | null
  primary: Sourced<{ hex: string }> | null
  /** Distinct chromatic colours, strongest first. Never includes the greys. */
  palette: PaletteEntry[]
  bodyFont: Sourced<FontFinding> | null
  headingFont: Sourced<FontFinding> | null
  radius: Sourced<RadiusFinding> | null
  /** Things worth telling the person, e.g. why nothing was found. */
  notes: string[]
  scanned: { stylesheets: number; bytes: number }
}

export interface ExtractInput {
  url: string
  html: string
  stylesheets: Array<{ url: string; css: string }>
}

/* ------------------------------------------------------------------ *
 *  Colour parsing
 * ------------------------------------------------------------------ */

interface Parsed {
  rgb: RGB
  alpha: number
}

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`

function num(text: string): number {
  return Number.parseFloat(text)
}

/** Scale a `rgb()` channel that may be a percentage. */
function channel(text: string): number {
  return text.endsWith('%') ? (num(text) / 100) * 255 : num(text)
}

function alphaOf(text: string | undefined): number {
  if (!text) return 1
  return text.endsWith('%') ? num(text) / 100 : num(text)
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = (((h % 360) + 360) % 360) / 360
  const sat = Math.min(1, Math.max(0, s))
  const light = Math.min(1, Math.max(0, l))
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
  const p = 2 * light - q
  const at = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return {
    r: Math.round(at(hue + 1 / 3) * 255),
    g: Math.round(at(hue) * 255),
    b: Math.round(at(hue - 1 / 3) * 255),
  }
}

/** OKLCH → sRGB, clipped. A site's `oklch()` brand may sit outside the gamut. */
function oklchToSrgb(l: number, c: number, hDeg: number): RGB {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ ** 3
  const M = m_ ** 3
  const S = s_ ** 3
  const lin = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ]
  const gamma = (v: number) => {
    const x = Math.min(1, Math.max(0, v))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
  }
  return {
    r: Math.round(gamma(lin[0]!) * 255),
    g: Math.round(gamma(lin[1]!) * 255),
    b: Math.round(gamma(lin[2]!) * 255),
  }
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_FN = new RegExp(
  String.raw`^rgba?\(\s*(${NUMBER}%?)\s*[, ]\s*(${NUMBER}%?)\s*[, ]\s*(${NUMBER}%?)\s*(?:[,/]\s*(${NUMBER}%?)\s*)?\)$`,
  'i',
)
const HSL_FN = new RegExp(
  String.raw`^hsla?\(\s*(${NUMBER})(?:deg)?\s*[, ]\s*(${NUMBER})%\s*[, ]\s*(${NUMBER})%\s*(?:[,/]\s*(${NUMBER}%?)\s*)?\)$`,
  'i',
)
const OKLCH_FN = new RegExp(
  String.raw`^oklch\(\s*(${NUMBER}%?)\s+(${NUMBER}%?)\s+(${NUMBER})(?:deg)?\s*(?:/\s*(${NUMBER}%?)\s*)?\)$`,
  'i',
)
/** shadcn-era bare channels: `262 83% 58%`, the value of `--primary`. */
const BARE_HSL = new RegExp(String.raw`^(${NUMBER})\s+(${NUMBER})%\s+(${NUMBER})%$`)

/**
 * A CSS colour value → RGB, or null when it is not a literal colour.
 *
 * Deliberately does not resolve `var()`, `currentColor`, `color-mix()` or
 * named colours. Each of those needs the cascade to mean anything, and a
 * guess at one is a wrong brand delivered with confidence. (`var()` is
 * resolved by the caller, which knows the page's variables.) Returning null
 * and moving on to the next declaration is the cheaper mistake.
 */
export function parseCssColor(input: string): Parsed | null {
  const text = input.trim().replace(/\s*!important$/i, '')
  if (!text) return null

  if (HEX.test(text)) {
    const digits = text.slice(1)
    const expanded =
      digits.length <= 4
        ? digits
            .split('')
            .map((c) => c + c)
            .join('')
        : digits
    const rgb = hexToRgb(`#${expanded.slice(0, 6)}`)
    if (!rgb) return null
    const alpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1
    return { rgb, alpha }
  }

  let m = RGB_FN.exec(text)
  if (m) {
    return {
      rgb: {
        r: Math.round(Math.min(255, Math.max(0, channel(m[1]!)))),
        g: Math.round(Math.min(255, Math.max(0, channel(m[2]!)))),
        b: Math.round(Math.min(255, Math.max(0, channel(m[3]!)))),
      },
      alpha: alphaOf(m[4]),
    }
  }

  m = HSL_FN.exec(text)
  if (m) {
    return { rgb: hslToRgb(num(m[1]!), num(m[2]!) / 100, num(m[3]!) / 100), alpha: alphaOf(m[4]) }
  }

  m = OKLCH_FN.exec(text)
  if (m) {
    const l = m[1]!.endsWith('%') ? num(m[1]!) / 100 : num(m[1]!)
    const c = m[2]!.endsWith('%') ? (num(m[2]!) / 100) * 0.4 : num(m[2]!)
    return { rgb: oklchToSrgb(l, c, num(m[3]!)), alpha: alphaOf(m[4]) }
  }

  m = BARE_HSL.exec(text)
  if (m) {
    return { rgb: hslToRgb(num(m[1]!), num(m[2]!) / 100, num(m[3]!) / 100), alpha: 1 }
  }

  return null
}

/** OKLCH lightness/chroma/hue of an RGB colour. */
function lch(rgb: RGB): { l: number; c: number; h: number } {
  const { l, c, h } = rgbToOklch(rgb)
  return { l, c, h: ((h % 360) + 360) % 360 }
}

/**
 * Is this a colour a person would call a brand colour?
 *
 * Chroma is the test, not saturation: an HSL-saturated near-white or
 * near-black is a tinted neutral, and OKLCH chroma is what says "grey".
 * The lightness window drops the pale washes (`#f0f7ff`, a hover
 * background) and the near-blacks (`#0a0a1a`) that carry a hue but are
 * neutrals in every design system.
 */
function isChromatic(rgb: RGB): boolean {
  const { l, c } = lch(rgb)
  return c >= 0.07 && l >= 0.25 && l <= 0.88
}

/* ------------------------------------------------------------------ *
 *  Reading the page
 * ------------------------------------------------------------------ */

interface Rule {
  selector: string
  /** True for `:root`, `html`, `body` — the values the site wears by default. */
  base: boolean
  declarations: Array<{ property: string; value: string }>
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Delete every `@media (prefers-color-scheme: dark) { … }` block.
 *
 * `parseRules` reads innermost rules and so cannot see that a `:root` sits
 * inside a dark media query. Left in, the dark palette's `:root` would be read
 * as the site's own and — last one wins — replace the light one, so a site
 * with a white page and a dark-mode brand would report the dark-mode brand.
 */
function stripDarkMedia(css: string): string {
  let out = ''
  let i = 0
  const marker = /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi
  for (let m = marker.exec(css); m; m = marker.exec(css)) {
    out += css.slice(i, m.index)
    let depth = 1
    let j = m.index + m[0].length
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') depth -= 1
      j += 1
    }
    i = j
    marker.lastIndex = j
  }
  return out + css.slice(i)
}

/**
 * The page's default scope: `:root`, `html`, `body`, or a light-theme
 * attribute — including GitHub's chained
 * `[data-color-mode=light][data-light-theme=light]`, which a single-attribute
 * test read as a component and so found no colours on github.com at all.
 */
const BASE_SELECTOR_PART =
  /^(?:(?::root|html|body|:host)(?::not\([^)]*\))?|(?:\[data-[\w-]+=["']?[\w-]*light[\w-]*["']?\])+|\.light)$/i

/** Is any comma-separated part of this selector the page's default scope? */
function isBaseSelector(selector: string): boolean {
  return selector.split(',').some((part) => BASE_SELECTOR_PART.test(part.trim()))
}

/**
 * Innermost rules of a stylesheet: `selector { property: value; … }`.
 *
 * A regex over a stylesheet is not a CSS parser and this does not pretend
 * to be one. It matches the innermost `{…}` pairs, which is every ordinary
 * rule and, inside an `@media` block, the rules within it — the at-rule's
 * own prelude is never captured as a selector. What it gets wrong (a `}`
 * inside a string, an unbalanced file) it gets wrong by dropping a rule,
 * which for a tool that counts is noise rather than error.
 */
function parseRules(css: string): Rule[] {
  const rules: Rule[] = []
  const clean = stripDarkMedia(stripComments(css))
  const block = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = block.exec(clean))) {
    const selector = match[1]!.trim()
    if (!selector || selector.startsWith('@font-face')) continue
    const declarations: Rule['declarations'] = []
    for (const part of match[2]!.split(';')) {
      const colon = part.indexOf(':')
      if (colon < 1) continue
      const property = part.slice(0, colon).trim().toLowerCase()
      const value = part.slice(colon + 1).trim()
      if (property && value) declarations.push({ property, value })
    }
    rules.push({ selector, base: isBaseSelector(selector), declarations })
  }
  return rules
}

/**
 * Custom properties, so `var(--x)` can be followed to what it means.
 *
 * Two maps, because colours and fonts want different things. A colour
 * variable has to come from the page's default scope and the LAST such
 * declaration wins, as in the cascade — a theme class's `--primary` is not
 * the site's. A font variable has no such theme, and `next/font` declares its
 * variables on a generated class, not on `:root`, so those fall back to any
 * scope, first declaration.
 */
interface Vars {
  base: Map<string, string>
  any: Map<string, string>
}

function collectVars(rules: Rule[]): Vars {
  const base = new Map<string, string>()
  const any = new Map<string, string>()
  for (const rule of rules) {
    for (const { property, value } of rule.declarations) {
      if (!property.startsWith('--')) continue
      if (rule.base) base.set(property, value)
      if (!any.has(property)) any.set(property, value)
    }
  }
  return { base, any }
}

const VAR_CALL = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g

/** Replace `var(--x, fallback)` with what it resolves to, a few levels deep. */
function resolveVars(value: string, vars: Vars, depth = 0): string {
  if (depth > 4 || !value.includes('var(')) return value
  const resolved = value.replace(
    VAR_CALL,
    (_all, name: string, fallback?: string) =>
      vars.base.get(name) ?? vars.any.get(name) ?? fallback ?? '',
  )
  return resolved === value ? value : resolveVars(resolved, vars, depth + 1)
}

/** Attributes of one tag, lower-cased by name. */
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag))) out[m[1]!.toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return out
}

function tagsOf(html: string, name: string): Array<Record<string, string>> {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]))
}

/** Text of every `<style>` block, so inline CSS is read like a file. */
function inlineStyles(html: string): string[] {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]!)
}

/* ------------------------------------------------------------------ *
 *  Colour
 * ------------------------------------------------------------------ */

/** A custom property that means "this is the brand". */
const BRAND_VAR = /^--(?:[a-z]+-)?(?:brand|primary)(?:-(?:color|colour|base|default|500|600))?$/i
/** The looser family: `--brand-400`, `--primary-hover`. Worth less. */
const BRAND_VAR_LOOSE = /^--(?:[a-z]+-)?(?:brand|primary)(?:-[a-z0-9]+)?$/i
/**
 * `--accent`, `--main`, `--theme`. Ambiguous: in shadcn's convention `--accent`
 * is the subtle hover fill, not the brand. Read, but never as "declared".
 */
const AMBIGUOUS_VAR = /^--(?:[a-z]+-)?(?:accent|main|theme)(?:-(?:color|colour|base|default))?$/i
/** Selectors where a background colour is very likely the brand's. */
const ACTION_SELECTOR =
  /\b(?:btn|button|cta|primary|brand)\b|button|\.btn|\.primary|\[type=["']?submit/i

const COLOR_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'border-color',
  'fill',
  'stroke',
])

interface Candidate {
  rgb: RGB
  weight: number
  source: string
  /** Strongest evidence class this colour was seen under. */
  confidence: Confidence
}

/** Merge candidates that are perceptually the same colour, summing weight. */
function cluster(candidates: Candidate[]): Candidate[] {
  const out: Array<Candidate & { l: number; c: number; h: number }> = []
  const rank: Record<Confidence, number> = { high: 3, medium: 2, low: 1 }

  for (const candidate of candidates) {
    const here = lch(candidate.rgb)
    const near = out.find(
      (o) =>
        Math.abs(o.l - here.l) < 0.08 &&
        Math.abs(o.c - here.c) < 0.05 &&
        Math.min(Math.abs(o.h - here.h), 360 - Math.abs(o.h - here.h)) < 8,
    )
    if (near) {
      near.weight += candidate.weight
      // The representative is the strongest-evidence member, not the first.
      if (rank[candidate.confidence] > rank[near.confidence]) {
        near.rgb = candidate.rgb
        near.source = candidate.source
        near.confidence = candidate.confidence
        Object.assign(near, here)
      }
    } else {
      out.push({ ...candidate, ...here })
    }
  }
  return out.sort((a, b) => b.weight - a.weight)
}

/** Colour literals inside a shorthand value, in order. */
function colorTokens(value: string): string[] {
  return [...value.matchAll(/#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch)\([^)]*\)/gi)].map((m) => m[0])
}

interface ColorFindings {
  candidates: Candidate[]
  /**
   * The site's own `--primary`/`--brand` is a grey. That is an answer, not a
   * gap: shadcn's default is a near-black primary, and counting colours after
   * that would crown whichever chart colour happens to be used most.
   */
  declaredNeutral: string | null
  /** Colour literals in colour-bearing properties, chromatic or not. */
  literals: number
}

function findColors(html: string, rules: Rule[], vars: Vars): ColorFindings {
  const candidates: Candidate[] = []
  let declaredNeutral: string | null = null
  let literals = 0

  const add = (raw: string | undefined, weight: number, source: string, confidence: Confidence) => {
    if (!raw) return
    const parsed = parseCssColor(resolveVars(raw, vars))
    if (!parsed || parsed.alpha < 0.6) return
    if (!isChromatic(parsed.rgb)) return
    candidates.push({ rgb: parsed.rgb, weight, source, confidence })
  }

  // <meta name="theme-color"> — often `#ffffff`, which the chroma test drops,
  // so what survives is a deliberate brand colour.
  for (const meta of tagsOf(html, 'meta')) {
    const name = meta.name?.toLowerCase()
    if (name === 'theme-color') add(meta.content, 60, '<meta name="theme-color">', 'medium')
    if (name === 'msapplication-tilecolor') add(meta.content, 40, 'the Windows tile colour', 'medium')
  }
  for (const link of tagsOf(html, 'link')) {
    if (link.rel?.toLowerCase().includes('mask-icon')) {
      add(link.color, 50, 'the Safari pinned-tab colour', 'medium')
    }
  }

  for (const rule of rules) {
    const action = ACTION_SELECTOR.test(rule.selector)
    for (const { property, value } of rule.declarations) {
      if (property.startsWith('--tw-')) continue

      if (property.startsWith('--')) {
        // Only the page's default scope speaks for the site. A `.theme-rose`
        // class or a component's local `--primary` is one option among many.
        if (!rule.base) continue
        if (BRAND_VAR.test(property)) {
          const resolved = parseCssColor(resolveVars(value, vars))
          if (!resolved || resolved.alpha < 0.6) continue
          if (isChromatic(resolved.rgb)) add(value, 100, `${property} in the site's CSS`, 'high')
          else declaredNeutral ??= property
        } else if (BRAND_VAR_LOOSE.test(property)) {
          add(value, 45, `${property} in the site's CSS`, 'high')
        } else if (AMBIGUOUS_VAR.test(property)) {
          add(value, 50, `${property} in the site's CSS`, 'medium')
        }
        continue
      }

      if (!COLOR_PROPERTIES.has(property)) continue
      literals += colorTokens(resolveVars(value, vars)).length
      // `background` is a shorthand: the colour is one token among several.
      const candidate =
        property === 'background' ? (colorTokens(resolveVars(value, vars))[0] ?? value) : value
      const weight = action && property !== 'color' ? 6 : property === 'color' ? 1 : 2
      add(candidate, weight, 'the most-used colour', 'low')
    }
  }

  return { candidates, declaredNeutral, literals }
}

/* ------------------------------------------------------------------ *
 *  Fonts
 * ------------------------------------------------------------------ */

const GENERIC_FAMILY =
  /^(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|emoji|math|fangsong|inherit|initial|unset|revert|-apple-system|blinkmacsystemfont)$/i

/** System faces that are a fallback rather than a choice. */
const SYSTEM_FAMILY =
  /^(?:segoe ui|helvetica(?: neue)?|arial|tahoma|verdana|roboto|oxygen(?:-sans)?|ubuntu|cantarell|fira sans|droid sans|noto sans|apple color emoji|segoe ui emoji|segoe ui symbol|noto color emoji)$/i

const ICON_FONT =
  /icon|awesome|glyph|symbol|emoji|material|lucide|feather|dashicons|codicon|fontello|^fa[sbrl]?$/i

const SERIF_NAMES =
  /^(?:georgia|times(?: new roman)?|palatino|garamond|baskerville|cambria|playfair display|merriweather|lora|source serif(?: pro| 4)?|libre baskerville|pt serif|crimson(?: text| pro)?|eb garamond|cormorant(?: garamond)?|fraunces|dm serif (?:display|text)|noto serif|spectral|newsreader|instrument serif|bitter|literata)$/i
const MONO_NAMES =
  /^(?:jetbrains mono|fira code|source code pro|ibm plex mono|space mono|roboto mono|dm mono|menlo|consolas|monaco|courier(?: new)?|sf mono|ui-monospace|geist mono|inconsolata)$/i

/** A stack that reaches for the platform's own font. */
const SYSTEM_STACK = /system-ui|ui-sans-serif|-apple-system|blinkmacsystemfont/i

/**
 * A `--font-*` variable is a typeface only if it is not one of the many
 * font-shaped things that are not: `--font-weight-light: 300`,
 * `--font-size-lg`, `--font-display: swap`.
 */
const NOT_A_FAMILY_VAR =
  /weight|size|style|feature|variation|stretch|smoothing|display|leading|height|spacing|optical|kerning|variant|synthesis|palette|width|rendering/i

/** `__Inter_a1b2c3` and `Inter Fallback` are `next/font` internals. */
function cleanFamily(raw: string): string | null {
  let name = raw.trim().replace(/^["']|["']$/g, '').trim()
  if (!name || name.startsWith('var(') || name.includes('(')) return null
  const next = /^__(.+?)_(?:[0-9a-f]{6,}|Fallback.*)$/i.exec(name)
  if (next) name = next[1]!.replace(/_/g, ' ')
  if (/ fallback$/i.test(name)) return null
  if (GENERIC_FAMILY.test(name)) return null
  // A number, a length or a keyword is a value that leaked out of the wrong
  // variable, not a family.
  if (/^[\d.]+(?:px|rem|em|%)?$/.test(name) || /^(?:normal|bold|swap|block|auto)$/i.test(name)) {
    return null
  }
  // Build tools hand over `GeistSans`, `plexMono` and `SpotifyMixUI`. A family
  // is not written that way anywhere a person reads it, so space the humps.
  if (/^[A-Za-z]+$/.test(name) && /[a-z][A-Z]/.test(name)) {
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  // `next/font` lower-cases a single word (`__inter_…`) as well.
  if (/^[a-z]/.test(name)) name = name[0]!.toUpperCase() + name.slice(1)
  return name
}

function splitStack(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    else if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current)
  return parts
}

function classifyFont(name: string, stack: string[]): FontFinding {
  const generics = stack.map((s) => s.trim().replace(/^["']|["']$/g, '').toLowerCase())
  const kind: FontFinding['kind'] =
    MONO_NAMES.test(name) || generics.includes('monospace')
      ? 'mono'
      : SERIF_NAMES.test(name) || (generics.includes('serif') && !generics.includes('sans-serif'))
        ? 'serif'
        : 'sans'
  return { name, kind, system: SYSTEM_FAMILY.test(name) }
}

interface FontVote {
  finding: FontFinding
  weight: number
  role: 'body' | 'heading' | 'other'
}

const BASE_SELECTOR = /^(?:html|body|:root|\*)$|^html\s*,\s*body$/i
const HEADING_SELECTOR = /(?:^|[\s,>])h[1-3](?:[\s,.:{[]|$)|\.(?:heading|title|display)\b/i

function findFonts(html: string, rules: Rule[], vars: Vars, cssText: string): FontVote[] {
  const votes: FontVote[] = []

  for (const rule of rules) {
    for (const { property, value } of rule.declarations) {
      const isFamily =
        property === 'font-family' || (property.startsWith('--font') && !NOT_A_FAMILY_VAR.test(property))
      if (!isFamily) continue
      const stack = splitStack(resolveVars(value, vars))
      // The first family that is a real name, not a generic or a variable —
      // the one the browser will use if it loads, which is the one the
      // designer chose.
      let name: string | null = null
      for (const family of stack) {
        name = cleanFamily(family)
        if (name) break
      }

      const selector = rule.selector
      let role: FontVote['role'] = BASE_SELECTOR.test(selector)
        ? 'body'
        : HEADING_SELECTOR.test(selector)
          ? 'heading'
          : 'other'
      let weight = role === 'body' ? 8 : role === 'heading' ? 5 : property.startsWith('--') ? 3 : 1

      // A variable's own name says what it is for. `--font-sans` is the body
      // face and `--font-mono` is not the brand, whatever its count.
      if (property.startsWith('--')) {
        if (/mono|code/i.test(property)) weight = 1
        else if (/sans|body|text|base|primary|default/i.test(property)) [role, weight] = ['body', 6]
        else if (/display|heading|title|head/i.test(property)) [role, weight] = ['heading', 5]
      }

      // A base font-family that names nothing downloadable — `system-ui,
      // sans-serif` — is a finding, not an absence: the site chose the
      // system font, which is exactly what most Tailwind sites ship.
      if (!name && role === 'body' && property === 'font-family' && SYSTEM_STACK.test(value)) {
        votes.push({ finding: { name: 'System UI', kind: 'sans', system: true }, weight, role })
        continue
      }
      if (!name || ICON_FONT.test(name)) continue
      votes.push({ finding: classifyFont(name, stack), weight, role })
    }
  }

  // Google Fonts: the families a page *asks to download* are deliberate.
  const googleUrls = [
    ...tagsOf(html, 'link').map((l) => l.href ?? ''),
    ...[...cssText.matchAll(/@import\s+(?:url\()?["']?([^"')\s]+)/gi)].map((m) => m[1]!),
  ].filter((href) => href.includes('fonts.googleapis.com'))
  for (const href of googleUrls) {
    for (const family of [...href.matchAll(/[?&]family=([^&:;]+)/g)].map((m) => m[1]!)) {
      const name = decodeURIComponent(family.replace(/\+/g, ' ')).trim()
      if (name && !ICON_FONT.test(name)) {
        votes.push({ finding: classifyFont(name, []), weight: 4, role: 'other' })
      }
    }
  }

  return votes
}

function topFont(votes: FontVote[], role?: FontVote['role']): { vote: FontVote; total: number } | null {
  const totals = new Map<string, { vote: FontVote; total: number }>()
  for (const vote of votes) {
    if (role && vote.role !== role) continue
    const key = vote.finding.name.toLowerCase()
    const entry = totals.get(key)
    if (entry) entry.total += vote.weight
    else totals.set(key, { vote, total: vote.weight })
  }
  return [...totals.values()].sort((a, b) => b.total - a.total)[0] ?? null
}

/* ------------------------------------------------------------------ *
 *  Radius
 * ------------------------------------------------------------------ */

/**
 * Site-wide radius names only — no free prefix. A prefix is how a component
 * says it is local: Stripe declares `--navigation-border-radius: 0` and
 * `--card-radius`, and reading either as "the site's radius" reported a
 * square brand for one of the most rounded sites on the web.
 */
const RADIUS_VAR =
  /^--(?:radius|rounded|border-?radius|corner-?radius)(?:-(?:base|default|md|medium|lg|large))?$/i
const COMPONENT_SELECTOR = /btn|button|card|input|field|select|modal|panel|badge/i
const PILL_PX = 200

/** A CSS length → rem, for the units a radius is written in. */
function lengthToRem(token: string): number | null {
  // Unitless zero is the one length CSS lets you write without a unit, and it
  // is how nearly every square design says "square".
  if (/^0+(?:\.0+)?$/.test(token.trim())) return 0
  const m = /^(-?\d*\.?\d+)(px|rem|em)$/i.exec(token.trim())
  if (!m) return null
  const value = Number(m[1])
  return m[2]!.toLowerCase() === 'px' ? value / 16 : value
}

function findRadius(rules: Rule[], vars: Vars): Sourced<RadiusFinding> | null {
  // px-rounded histogram of ordinary component radii, and a separate tally
  // for pills and squares so neither is lost to the noise of resets.
  const histogram = new Map<number, number>()
  let pills = 0
  let squares = 0
  let variable: number | null = null

  for (const rule of rules) {
    const component = COMPONENT_SELECTOR.test(rule.selector)
    for (const { property, value } of rule.declarations) {
      if (RADIUS_VAR.test(property)) {
        // Default scope only, like colour variables: `--radius: 0` on a
        // `.theme-sharp` class is an option the site offers, not its own.
        if (!rule.base) continue
        const rem = lengthToRem(resolveVars(value, vars).split(/\s+/)[0] ?? '')
        if (rem !== null && rem >= 0 && rem <= 3) variable ??= rem
        continue
      }
      if (property.startsWith('--')) continue
      if (property !== 'border-radius') continue

      const first = resolveVars(value, vars).split(/\s+/)[0] ?? ''
      const rem = lengthToRem(first)
      if (rem === null) continue
      const px = rem * 16
      if (px >= PILL_PX) {
        if (component) pills += 1
      } else if (px === 0) {
        // `border-radius: 0` is in every reset. Only a component that is
        // *deliberately* square counts as an answer.
        if (component) squares += 1
      } else if (px >= 2 && px <= 32) {
        const bucket = Math.round(px)
        histogram.set(bucket, (histogram.get(bucket) ?? 0) + (component ? 3 : 1))
      }
    }
  }

  if (variable !== null) {
    const rem = Math.round(Math.min(2, variable) * 8) / 8
    return {
      value: { rem, label: `${Math.round(variable * 16)}px` },
      source: "the --radius variable in the site's CSS",
      confidence: 'high',
    }
  }

  const modal = [...histogram.entries()].sort((a, b) => b[1] - a[1])[0]
  const modalWeight = modal?.[1] ?? 0
  if (pills > modalWeight && pills >= 2) {
    return { value: { rem: 1.5, label: 'pill' }, source: 'button and card corners', confidence: 'low' }
  }
  if (squares > modalWeight && squares >= 2) {
    return { value: { rem: 0, label: 'square' }, source: 'button and card corners', confidence: 'low' }
  }
  if (modal && modalWeight >= 3) {
    const rem = Math.round((modal[0] / 16) * 8) / 8
    return {
      value: { rem: Math.min(2, rem), label: `${modal[0]}px` },
      source: 'the most-used corner radius',
      confidence: 'low',
    }
  }
  return null
}

/* ------------------------------------------------------------------ *
 *  The whole extraction
 * ------------------------------------------------------------------ */

/** Below this much CSS, the page is almost certainly styled at runtime. */
const THIN_CSS_BYTES = 4000
/** Fewer colour literals than this in real CSS means colours are set at runtime. */
const FEW_LITERALS = 8

export function extractBrand(input: ExtractInput): BrandExtraction {
  const notes: string[] = []
  const cssTexts = [...inlineStyles(input.html), ...input.stylesheets.map((s) => s.css)]
  const cssText = cssTexts.join('\n')
  const rules = cssTexts.flatMap(parseRules)
  const vars = collectVars(rules)
  const bytes = cssText.length

  // ── colour ──
  const found = findColors(input.html, rules, vars)
  const clustered = cluster(found.candidates)
  const palette: PaletteEntry[] = clustered.slice(0, 6).map((c) => ({
    hex: rgbToHex(c.rgb),
    weight: Math.round(c.weight),
    source: c.source,
  }))

  // The primary is the strongest *evidence*, not the highest count: a site
  // that names `--primary` has told us, and a heavier tally of some other
  // colour should not overrule it.
  const rank: Record<Confidence, number> = { high: 3, medium: 2, low: 1 }
  const best = [...clustered].sort(
    (a, b) => rank[b.confidence] - rank[a.confidence] || b.weight - a.weight,
  )[0]

  let primary: BrandExtraction['primary'] = best
    ? { value: { hex: rgbToHex(best.rgb) }, source: best.source, confidence: best.confidence }
    : null

  // A neutral `--primary` outranks a count. See `ColorFindings`.
  if (found.declaredNeutral && (!best || best.confidence === 'low')) {
    primary = null
    notes.push(
      `The site's own ${found.declaredNeutral} is a neutral — black, white or grey — so there is no brand colour to read. The colours listed are other colours it uses.`,
    )
  } else if (!primary) {
    notes.push(
      bytes < THIN_CSS_BYTES || found.literals < FEW_LITERALS
        ? 'No brand colour found, and the site declares almost no colours in its CSS. That usually means it sets them at runtime from JavaScript, where a page scan cannot see them. Pick one by hand instead.'
        : 'No brand colour found. The site looks monochrome. Pick one by hand instead.',
    )
  } else if (primary.confidence === 'low') {
    notes.push(
      'The colour is a guess from counting, not something the site declares. Check it against the logo before you build on it.',
    )
  }

  if (bytes < THIN_CSS_BYTES) {
    notes.push(
      'Very little CSS was readable, which usually means the site styles itself with JavaScript at runtime. What is shown comes from the page head only.',
    )
  }

  // ── fonts ──
  const votes = findFonts(input.html, rules, vars, cssText)
  // A monospace face is almost never the brand's: with no explicit base font,
  // prefer any other family over the most-declared `--font-mono`.
  const body =
    topFont(votes, 'body') ??
    topFont(votes.filter((v) => v.finding.kind !== 'mono')) ??
    topFont(votes)
  const heading = topFont(votes, 'heading')
  const bodyFont: BrandExtraction['bodyFont'] = body
    ? {
        value: body.vote.finding,
        source: body.vote.role === 'body' ? "the page's base font-family" : 'the most-used font-family',
        confidence: body.vote.role === 'body' ? 'medium' : 'low',
      }
    : null
  const headingFont: BrandExtraction['headingFont'] =
    heading &&
    (!body || heading.vote.finding.name.toLowerCase() !== body.vote.finding.name.toLowerCase())
      ? { value: heading.vote.finding, source: 'the heading font-family', confidence: 'medium' }
      : null

  // ── radius ──
  const radius = findRadius(rules, vars)

  const title =
    /<title[^>]*>([\s\S]*?)<\/title>/i.exec(input.html)?.[1]?.replace(/\s+/g, ' ').trim() ?? null

  return {
    url: input.url,
    title: title ? title.slice(0, 120) : null,
    primary,
    palette,
    bodyFont,
    headingFont,
    radius,
    notes,
    scanned: { stylesheets: input.stylesheets.length, bytes },
  }
}
