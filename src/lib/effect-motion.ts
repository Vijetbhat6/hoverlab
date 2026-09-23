/**
 * Motion-safety profile for one effect, computed from its shipped CSS.
 *
 * Four questions a person asks before pasting an animation into a product,
 * none of which a preview can answer:
 *
 *   1. Does it stop for someone who asked for less motion?
 *   2. Does it animate only what the compositor can do cheaply, or does it
 *      make the browser re-layout / re-paint every frame?
 *   3. Could it flash more than three times a second (WCAG 2.3.1)?
 *   4. Does it shove other content around (layout shift)?
 *
 * All four are decidable from the CSS text, so they are computed here and
 * stored per effect (see `scripts/build-effect-motion.mts`) instead of being
 * hand-annotated across 1,100 effects.
 *
 * WHAT IS MEASURED AND WHAT IS NOT. Everything in this file is a STATIC
 * ESTIMATE read out of the source text. Nothing here is a browser
 * measurement. The layout-shift half has been validated against Chromium's
 * `layout-shift` entries on a sample (see `scripts/validate-effect-motion.mts`
 * and `effect-motion-validation.json`), and that sample, not this file, is
 * the only place a numeric CLS figure may come from.
 *
 * ONE DEFINITION OF "GUARDED". The reduced-motion half does not re-derive
 * anything. `withMotionGuard` (effect-insights.ts) appends the guard when the
 * catalog is assembled, and `analyzeEffect().respectsReducedMotion` is the
 * predicate that `audit-motion-guard.mts` and `test-motion-guard.mts` both
 * use to decide an effect is guarded. This file calls the same function, so
 * the badge, the audit and the frame test cannot disagree about which
 * effects are guarded. Feed it the SHIPPED css (the value on `EFFECTS`), not
 * the raw generated JSON, or every looping effect will read as unguarded.
 *
 * Deliberately regex/tokeniser based, not a full CSS parser: the input is
 * our own generated CSS, whose shapes are known (a test walks the whole
 * catalog and the build gate fails on a property this file has not ruled on).
 *
 * Pure and dependency-free apart from effect-insights, so server and client
 * components can both import it.
 */

import { analyzeEffect } from './effect-insights'

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */

/**
 * What the animated properties cost the browser. Worst wins.
 *
 * - `none`        nothing animates.
 * - `compositor`  transform / opacity / filter only: the GPU can run it
 *                 without touching layout or paint.
 * - `paint`       colour, background, shadow, clip-path... no reflow, but a
 *                 repaint on every frame.
 * - `layout`      width, height, top/left, margin, padding... the browser
 *                 re-lays-out the page on every frame.
 */
export type PropertyClass = 'none' | 'compositor' | 'paint' | 'layout'

/**
 * - `guarded`    ships a `prefers-reduced-motion` block (looping motion).
 * - `brief`      animates, but only briefly / on interaction. The catalog
 *                deliberately ships no guard for these (see `withMotionGuard`).
 * - `unguarded`  loops forever and ships no guard. A real gap.
 * - `none`       nothing animates, so there is nothing to guard.
 */
export type ReducedMotionState = 'guarded' | 'brief' | 'unguarded' | 'none'

export type FlashVerdict = 'pass' | 'caution' | 'fail'

export type LayoutShift = 'none' | 'shifts'

export interface EffectMotionProfile {
  /** Same predicate as the Insights tab: any animation, transition or keyframes. */
  animates: boolean
  reducedMotion: ReducedMotionState
  propertyClass: PropertyClass
  /**
   * Every animated property that is NOT compositor-only, layout ones first,
   * de-duplicated. Empty for `none` and `compositor`.
   */
  offending: string[]
  flash: {
    verdict: FlashVerdict
    /**
     * Highest estimated flash rate, in flashes per second, among the
     * repeating animations that alternate luminance. `null` when nothing
     * alternates luminance. A static upper-bound estimate, never a
     * measurement.
     */
    hz: number | null
  }
  /** `shifts` iff the property class is `layout`. Static classification. */
  layoutShift: LayoutShift
  /**
   * Animated properties this file has no ruling for. Not stored; the build
   * gate fails when this is non-empty so a new property cannot silently be
   * counted as paint.
   */
  unclassified: string[]
}

/** WCAG 2.3.1: no more than three flashes in any one second. */
export const FLASH_LIMIT_HZ = 3

/* ------------------------------------------------------------------ *
 *  Property classification
 * ------------------------------------------------------------------ */

const COMPOSITOR = new Set([
  'transform',
  'transform-origin',
  'translate',
  'rotate',
  'scale',
  'opacity',
  'filter',
  '-webkit-filter',
  'will-change',
  'offset-distance',
  'offset-rotate',
])

const LAYOUT = new Set([
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'inline-size',
  'block-size',
  'top',
  'left',
  'right',
  'bottom',
  'inset',
  'inset-inline',
  'inset-block',
  'inset-inline-start',
  'inset-inline-end',
  'inset-block-start',
  'inset-block-end',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-inline',
  'margin-block',
  'margin-inline-start',
  'margin-inline-end',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-inline',
  'padding-block',
  'padding-inline-start',
  'padding-inline-end',
  'border',
  'border-width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'font-size',
  'font-weight',
  'font-stretch',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-indent',
  'gap',
  'row-gap',
  'column-gap',
  'flex',
  'flex-basis',
  'flex-grow',
  'flex-shrink',
  'grid-template-rows',
  'grid-template-columns',
  'aspect-ratio',
  'display',
  'position',
  'columns',
  'column-count',
  'content',
])

const PAINT = new Set([
  'color',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-position-x',
  'background-position-y',
  'background-size',
  'background-blend-mode',
  'box-shadow',
  'text-shadow',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'border-image',
  'border-style',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'background-clip',
  '-webkit-background-clip',
  'column-rule',
  'column-rule-color',
  'outline',
  'outline-color',
  'outline-width',
  'outline-offset',
  'clip-path',
  '-webkit-clip-path',
  'clip',
  'mask',
  'mask-image',
  'mask-position',
  'mask-size',
  '-webkit-mask',
  '-webkit-mask-image',
  '-webkit-mask-position',
  '-webkit-mask-size',
  'backdrop-filter',
  '-webkit-backdrop-filter',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'fill-opacity',
  'text-decoration',
  'text-decoration-color',
  'text-decoration-thickness',
  '-webkit-text-stroke',
  '-webkit-text-stroke-color',
  '-webkit-text-fill-color',
  'caret-color',
  'accent-color',
  'visibility',
  'z-index',
  'd',
  'r',
  'cx',
  'cy',
  'mix-blend-mode',
  'perspective',
  'perspective-origin',
])

/** Properties with no visual cost or no visual effect at all. */
const IGNORED = new Set([
  'animation-duration',
  'animation-delay',
  'animation-iteration-count',
  'transition-duration',
  'transition-delay',
  'animation-timing-function',
  'transition-timing-function',
  'animation-timeline',
  'pointer-events',
  'cursor',
  'transition-behavior',
  'animation-play-state',
  'user-select',
])

export type PropertyRuling = 'compositor' | 'paint' | 'layout' | 'ignored' | 'custom' | 'unknown'

/**
 * The ruling for one CSS property name. `custom` is a `--x` property: it can
 * drive anything (an @property angle feeding a conic-gradient, a size
 * feeding `width`), so it is costed as paint and reported by name.
 */
export function classifyProperty(prop: string): PropertyRuling {
  const p = prop.trim().toLowerCase()
  if (p.startsWith('--')) return 'custom'
  if (COMPOSITOR.has(p)) return 'compositor'
  if (LAYOUT.has(p)) return 'layout'
  if (PAINT.has(p)) return 'paint'
  if (IGNORED.has(p)) return 'ignored'
  return 'unknown'
}

const CLASS_RANK: Record<PropertyClass, number> = { none: 0, compositor: 1, paint: 2, layout: 3 }

/* ------------------------------------------------------------------ *
 *  Tokenising
 * ------------------------------------------------------------------ */

interface Decl {
  prop: string
  value: string
}

interface Rule {
  selector: string
  decls: Decl[]
}

interface KeyframeStop {
  offset: number
  decls: Decl[]
}

interface Parsed {
  rules: Rule[]
  keyframes: Map<string, KeyframeStop[]>
  customProps: Map<string, string>
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Index of the `}` that closes the `{` at `open`. Strings and comments are already gone. */
function matchBrace(src: string, open: number): number {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return src.length
}

/** Split on a delimiter that sits outside parentheses and quotes. */
function splitTop(value: string, delim: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of value) {
    if (quote) {
      cur += ch
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      cur += ch
    } else if (ch === '(') {
      depth++
      cur += ch
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1)
      cur += ch
    } else if (ch === delim && depth === 0) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function parseDecls(body: string): Decl[] {
  const out: Decl[] = []
  for (const part of splitTop(body, ';')) {
    const i = part.indexOf(':')
    if (i <= 0) continue
    const prop = part.slice(0, i).trim().toLowerCase()
    const value = part
      .slice(i + 1)
      .replace(/!important/gi, '')
      .trim()
    if (!prop || /[\s{}]/.test(prop)) continue
    out.push({ prop, value })
  }
  return out
}

const REDUCE_QUERY = /prefers-reduced-motion\s*:\s*reduce/

function parseBlocks(src: string, into: Parsed): void {
  let i = 0
  let start = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open === -1) return
    // A `;` between the last block and this prelude ends a statement
    // (`@import ...;`) rather than belonging to the prelude.
    const semi = src.lastIndexOf(';', open)
    const preludeStart = semi >= start ? semi + 1 : start
    const prelude = src.slice(preludeStart, open).trim()
    const close = matchBrace(src, open)
    const body = src.slice(open + 1, close)
    i = close + 1
    start = i

    if (prelude.startsWith('@')) {
      const at = /^@([\w-]+)\s*([\s\S]*)$/.exec(prelude)
      const kind = at?.[1].toLowerCase() ?? ''
      const arg = at?.[2].trim() ?? ''
      if (kind === 'keyframes' || kind === '-webkit-keyframes') {
        if (!into.keyframes.has(arg)) into.keyframes.set(arg, parseKeyframeStops(body))
      } else if (kind === 'media' && REDUCE_QUERY.test(arg)) {
        // The guard block is the thing being *reported on*, not motion.
        continue
      } else if (kind === 'media' || kind === 'supports' || kind === 'container' || kind === 'layer') {
        parseBlocks(body, into)
      }
      continue
    }

    if (!prelude) continue
    const decls = parseDecls(body)
    into.rules.push({ selector: prelude, decls })
    for (const d of decls) {
      if (d.prop.startsWith('--') && !into.customProps.has(d.prop)) into.customProps.set(d.prop, d.value)
    }
  }
}

function parseKeyframeStops(body: string): KeyframeStop[] {
  const stops: KeyframeStop[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const decls = parseDecls(m[2])
    for (const raw of m[1].split(',')) {
      const t = raw.trim().toLowerCase()
      const offset = t === 'from' ? 0 : t === 'to' ? 100 : Number.parseFloat(t)
      if (Number.isFinite(offset)) stops.push({ offset, decls })
    }
  }
  return stops.sort((a, b) => a.offset - b.offset)
}

function parse(css: string): Parsed {
  const into: Parsed = { rules: [], keyframes: new Map(), customProps: new Map() }
  parseBlocks(stripComments(css), into)
  return into
}

/** Resolve `var(--x, fallback)` against the effect's own custom properties. */
function resolveVars(value: string, props: Map<string, string>, depth = 0): string {
  if (depth > 4 || !value.includes('var(')) return value
  const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_m, name: string, fb?: string) => {
    const hit = props.get(name)
    if (hit !== undefined) return hit
    return fb !== undefined ? fb.trim() : ''
  })
  return out === value ? out : resolveVars(out, props, depth + 1)
}

/* ------------------------------------------------------------------ *
 *  Animations
 * ------------------------------------------------------------------ */

interface AnimationUse {
  name: string
  /** Seconds, or null when it could not be resolved (a `var()` with no value). */
  duration: number | null
  /** `Infinity` for `infinite`. */
  iterations: number
  alternates: boolean
  /** Scroll/view driven: no clock, so no flash rate. */
  scrollDriven: boolean
  selector: string
  ruleDecls: Decl[]
}

const TIME_RE = /^(-?\d*\.?\d+)(ms|s)$/i
const DIRECTIONS = new Set(['normal', 'reverse', 'alternate', 'alternate-reverse'])
const FILLS = new Set(['none', 'forwards', 'backwards', 'both'])
const TIMINGS = new Set(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'])

function seconds(token: string): number | null {
  const m = TIME_RE.exec(token)
  if (!m) return null
  const n = Number.parseFloat(m[1])
  return m[2].toLowerCase() === 'ms' ? n / 1000 : n
}

function parseAnimationItem(item: string): Partial<AnimationUse> & { name?: string } {
  const tokens = splitTop(item.trim().replace(/\s+/g, ' '), ' ').filter(Boolean)
  const out: Partial<AnimationUse> & { name?: string } = {}
  let times = 0
  for (const tok of tokens) {
    const lower = tok.toLowerCase()
    const s = seconds(lower)
    if (s !== null) {
      if (times === 0) out.duration = s
      times++
      continue
    }
    if (lower === 'infinite') out.iterations = Infinity
    else if (/^\d*\.?\d+$/.test(lower)) out.iterations = Number.parseFloat(lower)
    else if (DIRECTIONS.has(lower)) out.alternates = lower.startsWith('alternate')
    else if (FILLS.has(lower) && lower !== 'none') continue
    else if (TIMINGS.has(lower) || /^(?:steps|cubic-bezier|linear)\(/.test(lower)) continue
    else if (lower === 'running' || lower === 'paused') continue
    else if (lower === 'none') out.name = 'none'
    else if (out.name === undefined) out.name = tok
  }
  return out
}

function listOf(value: string | undefined): string[] {
  return value === undefined ? [] : splitTop(value, ',').map((s) => s.trim())
}

function collectAnimations(parsed: Parsed): AnimationUse[] {
  const uses: AnimationUse[] = []
  for (const rule of parsed.rules) {
    const get = (prop: string) => {
      for (let i = rule.decls.length - 1; i >= 0; i--) {
        if (rule.decls[i].prop === prop) return resolveVars(rule.decls[i].value, parsed.customProps)
      }
      return undefined
    }
    const shorthand = get('animation')
    const nameList = listOf(get('animation-name'))
    const durList = listOf(get('animation-duration'))
    const iterList = listOf(get('animation-iteration-count'))
    const dirList = listOf(get('animation-direction'))
    const timeline = get('animation-timeline')
    const scrollDriven = timeline !== undefined && timeline.trim().toLowerCase() !== 'auto'

    const items: Array<Partial<AnimationUse> & { name?: string }> = shorthand
      ? listOf(shorthand).map(parseAnimationItem)
      : nameList.map((n) => ({ name: n }))
    if (!items.length) continue

    items.forEach((item, idx) => {
      const pick = (list: string[]) => (list.length ? list[idx % list.length] : undefined)
      const name = nameList.length ? pick(nameList) : item.name
      const dur = pick(durList)
      const iter = pick(iterList)
      const dir = pick(dirList)
      const duration = dur !== undefined ? seconds(dur.toLowerCase()) : (item.duration ?? null)
      let iterations = item.iterations ?? 1
      if (iter !== undefined) iterations = iter.toLowerCase() === 'infinite' ? Infinity : Number.parseFloat(iter) || 1
      const alternates = dir !== undefined ? dir.toLowerCase().startsWith('alternate') : (item.alternates ?? false)
      if (!name || name === 'none') return
      uses.push({
        name,
        duration,
        iterations,
        alternates,
        scrollDriven,
        selector: rule.selector,
        ruleDecls: rule.decls,
      } as AnimationUse)
    })
  }
  return uses
}

/* ------------------------------------------------------------------ *
 *  Transitions
 * ------------------------------------------------------------------ */

/**
 * A rule that only applies in some state: hover, focus, checked, an
 * attribute toggle, an `.is-open` style class. The properties declared here
 * are the ones a `transition` can actually move between.
 */
const STATE_SELECTOR =
  /:(?:hover|focus|focus-visible|focus-within|active|checked|target|open|disabled|invalid|valid|placeholder-shown|has\(|not\()|\[(?:open|data-|aria-)|\.(?:is-|active|open|on\b|show|expanded|selected)/i

/** True when two property names are the same or one is a longhand of the other. */
function sameFamily(a: string, b: string): boolean {
  return a === b || a.startsWith(`${b}-`) || b.startsWith(`${a}-`)
}

function collectTransitionProps(parsed: Parsed): string[] {
  const stateProps = new Set<string>()
  for (const rule of parsed.rules) {
    if (!STATE_SELECTOR.test(rule.selector)) continue
    for (const d of rule.decls) {
      if (!d.prop.startsWith('transition') && !d.prop.startsWith('animation')) stateProps.add(d.prop)
    }
  }

  const listed = new Set<string>()
  for (const rule of parsed.rules) {
    for (const d of rule.decls) {
      if (d.prop === 'transition') {
        for (const item of splitTop(resolveVars(d.value, parsed.customProps), ',')) {
          const tokens = item.trim().split(/\s+/)
          const prop = tokens.find((t) => !TIME_RE.test(t) && !TIMINGS.has(t) && !/^(?:cubic-bezier|steps|linear)\(/.test(t))
          if (prop && prop !== 'none') listed.add(prop.toLowerCase())
        }
      } else if (d.prop === 'transition-property') {
        for (const p of listOf(d.value)) if (p && p !== 'none') listed.add(p.toLowerCase())
      }
    }
  }

  const out = new Set<string>()
  for (const prop of listed) {
    if (prop === 'all') {
      // `all` moves whatever the state rules change — and nothing else.
      for (const s of stateProps) out.add(s)
      continue
    }
    // No state rule at all means the state is toggled some other way (a
    // script adding a class); the listed property is the best evidence left.
    if (stateProps.size === 0) {
      out.add(prop)
      continue
    }
    // Listed but never changed by any state rule: nothing transitions.
    let changed = false
    for (const s of stateProps) {
      if (sameFamily(prop, s)) {
        changed = true
        out.add(s.length >= prop.length ? s : prop)
      }
    }
    if (!changed) continue
  }
  return [...out]
}

/* ------------------------------------------------------------------ *
 *  Flash-rate estimate
 * ------------------------------------------------------------------ */

const NAMED_COLORS: Record<string, [number, number, number]> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  red: [255, 0, 0],
  yellow: [255, 255, 0],
  lime: [0, 255, 0],
  blue: [0, 0, 255],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
}

function linear(c: number): number {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function luminanceOf(rgb: [number, number, number]): number {
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

/** Relative luminance of the first plain colour in a value, or null. */
function colorLuminance(value: string): number | null {
  const v = value.toLowerCase()
  if (/gradient\(|url\(/.test(v)) return null
  const hex = /#([0-9a-f]{3,8})\b/.exec(v)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
    if (h.length === 6 || h.length === 8) {
      if (h.length === 8 && Number.parseInt(h.slice(6), 16) === 0) return null
      return luminanceOf([0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [number, number, number])
    }
    return null
  }
  const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/.exec(v)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? Number.parseFloat(rgb[4]) / 100 : Number.parseFloat(rgb[4])
    if (alpha === 0) return null
    return luminanceOf([Number(rgb[1]), Number(rgb[2]), Number(rgb[3])])
  }
  const hsl = /hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?/.exec(v)
  if (hsl) {
    const alpha = hsl[4] === undefined ? 1 : hsl[4].endsWith('%') ? Number.parseFloat(hsl[4]) / 100 : Number.parseFloat(hsl[4])
    if (alpha === 0) return null
    return luminanceOf(hslToRgb(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100))
  }
  const named = /^\s*([a-z]+)\s*$/.exec(v)
  if (named && NAMED_COLORS[named[1]]) return luminanceOf(NAMED_COLORS[named[1]])
  return null
}

/**
 * A number in [0, 1] whose swings track how much the element's luminance
 * moves, or null when the value says nothing about luminance.
 *
 * Opacity, and invert() and brightness() in filter, are treated as an upper
 * bound on the luminance change: an element that is already the colour of
 * its backdrop changes nothing when its opacity moves. That is why the
 * verdict is called an estimate.
 */
function luminanceSignal(prop: string, value: string): number | null {
  if (prop === 'opacity') {
    const n = Number.parseFloat(value)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.min(1, value.trim().endsWith('%') ? n / 100 : n))
  }
  if (prop === 'filter' || prop === '-webkit-filter') {
    const b = /brightness\(\s*([\d.]+)(%?)\s*\)/i.exec(value)
    if (b) {
      const n = Number.parseFloat(b[1]) / (b[2] ? 100 : 1)
      return Math.max(0, Math.min(1, n / 2))
    }
    const inv = /invert\(\s*([\d.]+)(%?)\s*\)/i.exec(value)
    if (inv) return Math.max(0, Math.min(1, Number.parseFloat(inv[1]) / (inv[2] ? 100 : 1)))
    return null
  }
  if (prop === 'color' || prop === 'background-color' || prop === 'background') return colorLuminance(value)
  return null
}

/** The value a property has when a keyframe does not say. */
function implicitSignal(prop: string): number | null {
  if (prop === 'opacity') return 1
  if (prop === 'filter' || prop === '-webkit-filter') return 0.5
  return null
}

const LUMINANCE_PROPS = ['opacity', 'filter', '-webkit-filter', 'color', 'background-color', 'background']

/** Swing below this is not a WCAG "flash" (10% of max relative luminance). */
const MIN_SWING = 0.1
/** Swing at or above this is a big change of brightness. */
const STRONG_SWING = 0.5

interface FlashCount {
  /** Light-to-dark-to-light pairs in one period. */
  pairs: number
  /** Largest swing between a peak and a neighbouring trough. */
  swing: number
}

/**
 * Count opposing-change pairs in a cyclic sequence, ignoring wiggles smaller
 * than `MIN_SWING`.
 *
 * Rotating to the global minimum first guarantees the walk starts at a real
 * trough, so the wrap-around is handled like any other step instead of
 * being a special case.
 */
function countFlashes(values: number[]): FlashCount {
  const seq = values.filter((v, i) => i === 0 || v !== values[i - 1])
  if (seq.length > 1 && seq[0] === seq[seq.length - 1]) seq.pop()
  if (seq.length < 2) return { pairs: 0, swing: 0 }
  const min = seq.indexOf(Math.min(...seq))
  const rot = [...seq.slice(min), ...seq.slice(0, min)]
  rot.push(rot[0])

  let pairs = 0
  let swing = 0
  let low = rot[0]
  let high = rot[0]
  let rising = false
  for (let i = 1; i < rot.length; i++) {
    const v = rot[i]
    if (!rising) {
      if (v < low) low = v
      if (v - low >= MIN_SWING) {
        rising = true
        high = v
      }
    } else {
      if (v > high) high = v
      if (high - v >= MIN_SWING) {
        pairs++
        swing = Math.max(swing, high - low)
        rising = false
        low = v
      }
    }
  }
  return { pairs, swing }
}

/** True when the rule that runs the animation plainly covers a large area. */
function coversLargeArea(decls: Decl[], props: Map<string, string>): boolean {
  const get = (p: string) => {
    for (let i = decls.length - 1; i >= 0; i--) if (decls[i].prop === p) return resolveVars(decls[i].value, props).trim().toLowerCase()
    return undefined
  }
  const px = (v: string | undefined) => {
    const m = v ? /^([\d.]+)px$/.exec(v) : null
    return m ? Number.parseFloat(m[1]) : null
  }
  const w = get('width')
  const h = get('height') ?? get('min-height')
  const full = (v: string | undefined) => v === '100%' || v === '100vw' || v === '100vh' || v === '100dvh'
  const pinned =
    get('inset') === '0' ||
    (get('top') === '0' && get('left') === '0' && get('right') === '0' && get('bottom') === '0')
  if (pinned) return true
  if (full(w) && full(h)) return true
  const wp = px(w)
  const hp = px(h)
  // 341 x 256 px: a quarter of a 10-degree field on a 1024 x 768 window,
  // the area WCAG's general-flash definition uses.
  return wp !== null && hp !== null && wp >= 341 && hp >= 256
}

function estimateFlashes(
  uses: AnimationUse[],
  keyframes: Map<string, KeyframeStop[]>,
  props: Map<string, string>,
): EffectMotionProfile['flash'] {
  let worstHz: number | null = null
  let worstRank = 0
  const rank = { pass: 0, caution: 1, fail: 2 } as const
  let verdict: FlashVerdict = 'pass'

  for (const use of uses) {
    const stops = keyframes.get(use.name)
    if (!stops || use.scrollDriven || use.duration === null || use.duration <= 0) continue

    for (const prop of LUMINANCE_PROPS) {
      const series: number[] = []
      const hasProp = stops.some((s) => s.decls.some((d) => d.prop === prop))
      if (!hasProp) continue
      // A missing 0% or 100% stop means "whatever the element has already".
      const offsets = stops.map((s) => s.offset)
      const ends: KeyframeStop[] = []
      if (offsets[0] > 0) ends.push({ offset: 0, decls: [] })
      const filled = [...ends, ...stops]
      if (offsets[offsets.length - 1] < 100) filled.push({ offset: 100, decls: [] })

      let known = true
      for (const stop of filled) {
        const d = [...stop.decls].reverse().find((x) => x.prop === prop)
        const sig = d ? luminanceSignal(prop, resolveVars(d.value, props)) : implicitSignal(prop)
        if (sig === null) {
          if (d) known = false
          continue
        }
        series.push(sig)
      }
      if (!known || series.length < 2) continue

      let seq = series
      if (use.alternates) seq = [...series, ...series.slice(0, -1).reverse().slice(0, -1)]
      const { pairs, swing } = countFlashes(use.iterations === 1 ? series : seq)
      if (pairs === 0) continue

      const period = use.alternates && use.iterations !== 1 ? use.duration * 2 : use.duration
      const hz = pairs / period
      const total = Number.isFinite(use.iterations) ? pairs * use.iterations * (use.alternates ? 0.5 : 1) : Infinity
      // Three or fewer flashes in total can never exceed three in a second.
      if (total <= FLASH_LIMIT_HZ) continue

      if (worstHz === null || hz > worstHz) worstHz = hz

      let v: FlashVerdict = 'pass'
      if (hz > FLASH_LIMIT_HZ) {
        v = swing >= STRONG_SWING && coversLargeArea(use.ruleDecls, props) ? 'fail' : 'caution'
      } else if (hz > FLASH_LIMIT_HZ * 0.8) {
        v = 'caution'
      }
      if (rank[v] > worstRank) {
        worstRank = rank[v]
        verdict = v
      }
    }
  }

  return { verdict, hz: worstHz === null ? null : Math.round(worstHz * 10) / 10 }
}

/* ------------------------------------------------------------------ *
 *  The analysis
 * ------------------------------------------------------------------ */

/**
 * Profile one effect from the CSS that ships for it.
 *
 * `html` is accepted for signature parity with `analyzeEffect` and is passed
 * through to it; nothing here needs the markup.
 */
export function analyzeEffectMotion(css: string, html = ''): EffectMotionProfile {
  const insights = analyzeEffect(css, html)

  const reducedMotion: ReducedMotionState = !insights.animates
    ? 'none'
    : insights.respectsReducedMotion
      ? 'guarded'
      : insights.hasInfiniteAnimation
        ? 'unguarded'
        : 'brief'

  const parsed = parse(css)
  const uses = collectAnimations(parsed)

  const animated = new Set<string>()
  for (const use of uses) {
    const stops = parsed.keyframes.get(use.name)
    if (!stops) continue
    for (const stop of stops) for (const d of stop.decls) animated.add(d.prop)
  }
  for (const p of collectTransitionProps(parsed)) animated.add(p)

  let propertyClass: PropertyClass = 'none'
  const layout: string[] = []
  const paint: string[] = []
  const unclassified: string[] = []
  for (const prop of [...animated].sort()) {
    const ruling = classifyProperty(prop)
    let cls: PropertyClass
    if (ruling === 'ignored') continue
    if (ruling === 'unknown') {
      unclassified.push(prop)
      cls = 'paint'
    } else if (ruling === 'custom') {
      cls = 'paint'
    } else {
      cls = ruling
    }
    if (CLASS_RANK[cls] > CLASS_RANK[propertyClass]) propertyClass = cls
    if (cls === 'layout') layout.push(prop)
    else if (cls === 'paint') paint.push(prop)
  }

  return {
    animates: insights.animates,
    reducedMotion,
    propertyClass,
    offending: [...layout, ...paint],
    flash: estimateFlashes(uses, parsed.keyframes, parsed.customProps),
    layoutShift: propertyClass === 'layout' ? 'shifts' : 'none',
    unclassified,
  }
}

/* ------------------------------------------------------------------ *
 *  Compact storage form
 * ------------------------------------------------------------------ */

/**
 * The shape stored in `generated-effect-motion.json`: short keys and one
 * letter enums, because it carries an entry for every effect.
 *
 *   r  reduced motion   g guarded, b brief, u unguarded, n none
 *   c  property class   n none, c compositor, p paint, l layout
 *   p  offending properties (omitted when empty)
 *   f  flash verdict    p pass, c caution, f fail
 *   h  flashes/second   (omitted when nothing alternates luminance)
 *   s  layout shift     n none, s shifts
 *
 * A canvas/WebGL effect is `{ x: 1 }`: its deliverable is a shader, so a
 * reading of its CSS fallback would be a claim about the wrong thing.
 */
export interface CompactMotion {
  r?: 'g' | 'b' | 'u' | 'n'
  c?: 'n' | 'c' | 'p' | 'l'
  p?: string[]
  f?: 'p' | 'c' | 'f'
  h?: number
  s?: 'n' | 's'
  x?: 1
}

const R_OUT = { guarded: 'g', brief: 'b', unguarded: 'u', none: 'n' } as const
const C_OUT = { none: 'n', compositor: 'c', paint: 'p', layout: 'l' } as const
const F_OUT = { pass: 'p', caution: 'c', fail: 'f' } as const
const S_OUT = { none: 'n', shifts: 's' } as const

const invert = <K extends string, V extends string>(m: Record<K, V>): Record<V, K> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<V, K>

export function compactMotion(p: EffectMotionProfile): CompactMotion {
  const out: CompactMotion = {
    r: R_OUT[p.reducedMotion],
    c: C_OUT[p.propertyClass],
    f: F_OUT[p.flash.verdict],
    s: S_OUT[p.layoutShift],
  }
  if (p.offending.length) out.p = p.offending
  if (p.flash.hz !== null) out.h = p.flash.hz
  return out
}

/** The compact form of a canvas/WebGL effect. */
export const SHADER_MOTION: CompactMotion = { x: 1 }

export type ExpandedMotion =
  | { applicable: false; reason: string }
  | (Omit<EffectMotionProfile, 'unclassified'> & { applicable: true })

export function expandMotion(c: CompactMotion): ExpandedMotion {
  if (c.x || !c.r || !c.c || !c.f || !c.s) {
    return {
      applicable: false,
      reason:
        'Canvas / WebGL effect: its deliverable is a shader, and the motion profile only reads CSS.',
    }
  }
  const r = invert(R_OUT)[c.r]
  const cls = invert(C_OUT)[c.c]
  return {
    applicable: true,
    animates: r !== 'none',
    reducedMotion: r,
    propertyClass: cls,
    offending: c.p ?? [],
    flash: { verdict: invert(F_OUT)[c.f], hz: c.h ?? null },
    layoutShift: invert(S_OUT)[c.s],
  }
}

/** Compare two compact rows structurally (the gate's equality). */
export function sameMotion(a: CompactMotion, b: CompactMotion): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
