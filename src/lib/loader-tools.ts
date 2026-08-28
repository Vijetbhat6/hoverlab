/**
 * The loader generator's families, and the bridge back to the catalog.
 *
 * Two halves that only make sense together.
 *
 * The first is a set of parametric loader families — ring, dual ring, dots,
 * bars, pulse, ping, orbit, conic, bar, shimmer — each emitted as pure CSS
 * with no SVG, no image and no JavaScript. That much is a generator like any
 * other. What it also emits, always, is the part hand-written loaders skip:
 * a `role="status"` on the element so a screen reader announces that
 * something is happening, and a `prefers-reduced-motion` guard, built by the
 * same function the catalog's own 835 effects are guarded by. A spinner is
 * the single most common piece of unstoppable infinite motion on the web,
 * and it is routinely shipped without either.
 *
 * The second half is `seedFromCss`, which reads the size, colour, duration
 * and family back OUT of a loader — so the 35 loaders already in the catalog
 * are starting points rather than a separate gallery you copy from and then
 * hand-edit. Pick the one that looks right, and the sliders open on its
 * actual numbers.
 */

import { reducedMotionGuard } from './effect-insights'

/* ============================================================
 *  Families
 * ============================================================ */

export type LoaderFamily =
  | 'ring'
  | 'dual-ring'
  | 'dots'
  | 'bars'
  | 'pulse'
  | 'ping'
  | 'orbit'
  | 'conic'
  | 'bar'
  | 'shimmer'

export interface LoaderFamilyMeta {
  id: LoaderFamily
  name: string
  /** What this one is for — the reason to pick it over the next one. */
  note: string
  /** Whether `count` and `gap` mean anything here. */
  multiplied: boolean
}

export const LOADER_FAMILIES: LoaderFamilyMeta[] = [
  {
    id: 'ring',
    name: 'Ring',
    note: 'The default spinner: a border with one coloured side, rotated. Four declarations, works everywhere, and the one people recognise as "loading".',
    multiplied: false,
  },
  {
    id: 'dual-ring',
    name: 'Dual ring',
    note: 'Two arcs turning against each other. Reads as busier than a single ring, which suits a slower operation.',
    multiplied: false,
  },
  {
    id: 'dots',
    name: 'Bouncing dots',
    note: 'The friendliest of the set, and the right one inline next to text — a spinner in a sentence looks like an error.',
    multiplied: true,
  },
  {
    id: 'bars',
    name: 'Equalizer bars',
    note: 'Bars at staggered heights. Suggests work in progress rather than waiting, which suits streaming and processing.',
    multiplied: true,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    note: 'One disc breathing. The quietest option, and the only one that does not rotate — worth reaching for when several are on screen.',
    multiplied: false,
  },
  {
    id: 'ping',
    name: 'Ping',
    note: 'A ring expanding out of a dot. Reads as a live signal rather than as waiting: presence, a heartbeat, a poll landing.',
    multiplied: false,
  },
  {
    id: 'orbit',
    name: 'Orbit',
    note: 'A dot travelling round a track. Slower and more mechanical than a ring — good for a long job with no progress to report.',
    multiplied: false,
  },
  {
    id: 'conic',
    name: 'Conic sweep',
    note: 'A gradient sweep masked into a ring — one element, no borders, and the smoothest of the spinners. Needs a browser from 2022 or later.',
    multiplied: false,
  },
  {
    id: 'bar',
    name: 'Indeterminate bar',
    note: 'The strip that slides across the top of a page. The only family here that belongs at the edge of a layout rather than in the middle of one.',
    multiplied: false,
  },
  {
    id: 'shimmer',
    name: 'Skeleton shimmer',
    note: 'Not a spinner: the shape of the content that is coming, with a sheen passing over it. The right answer whenever you know the layout in advance.',
    multiplied: false,
  },
]

export interface LoaderState {
  family: LoaderFamily
  /** Class name the CSS is written against, without the dot. */
  className: string
  /** Overall size in px. For the bar and shimmer families, the height. */
  size: number
  /** Stroke, border or bar width in px. */
  thickness: number
  /** One full cycle, in seconds. */
  speed: number
  /** Dots or bars. Ignored by the families where it means nothing. */
  count: number
  /** Space between them in px. */
  gap: number
  color: string
  /** The unlit part — the track behind a ring, the dim state of a dot. */
  trackColor: string
  /** The text a screen reader announces. */
  label: string
}

export const DEFAULT_LOADER: LoaderState = {
  family: 'ring',
  className: 'loader',
  size: 40,
  thickness: 4,
  speed: 1,
  count: 3,
  gap: 6,
  color: '#4f46e5',
  trackColor: 'rgba(79, 70, 229, 0.2)',
  label: 'Loading',
}

/** Round to two decimals and drop the tail — CSS does not need more. */
const n = (value: number) => Math.round(value * 100) / 100

export interface LoaderOutput {
  html: string
  css: string
  /** Keyframe names the CSS defines, for the "what this costs" note. */
  keyframes: string[]
}

/**
 * The markup for one loader.
 *
 * `role="status"` and an accessible name, always.
 *
 * A spinner communicates one thing — "wait" — and it communicates it
 * visually only. Without the role, a screen reader user gets silence during
 * the exact interval where sighted users are being told to hold on; with it,
 * the name is announced when the element appears. `aria-live` is implied by
 * `role="status"`, so it is not repeated here, and the visually-hidden span
 * carries the text rather than `aria-label` because a label on a container
 * whose contents are decorative is inconsistently announced.
 */
function loaderHtml(state: LoaderState): string {
  const { className, family, count, label } = state
  const hidden = `<span class="${className}-label">${label}…</span>`

  if (family === 'dots' || family === 'bars') {
    const children = Array.from({ length: count }, () => '<span></span>').join('')
    return `<div class="${className}" role="status">${children}${hidden}</div>`
  }
  if (family === 'dual-ring' || family === 'orbit') {
    return `<div class="${className}" role="status"><span></span><span></span>${hidden}</div>`
  }
  if (family === 'shimmer') {
    return `<div class="${className}" role="status">
  <span class="${className}-line"></span>
  <span class="${className}-line"></span>
  <span class="${className}-line"></span>
  ${hidden}
</div>`
  }
  return `<div class="${className}" role="status">${hidden}</div>`
}

/**
 * The CSS for one loader, before the reduced-motion guard is appended.
 *
 * Every family is written to be sized by one number. Anything derived from
 * `size` is derived here rather than exposed as another slider — a loader
 * with nine independent measurements is a loader nobody gets right.
 */
function loaderCss(state: LoaderState): { css: string; keyframes: string[] } {
  const { className: c, size, thickness, speed, count, gap, color, trackColor } = state
  const anim = `${c}-anim`
  const keyframes: string[] = []
  const k = (name: string) => {
    keyframes.push(name)
    return name
  }

  /*
    The visually-hidden label.

    The 1px-clip pattern rather than `display: none` or `visibility: hidden`,
    both of which remove the text from the accessibility tree along with the
    layout — which would leave the role announcing an empty status.
  */
  const labelCss = `.${c}-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`

  switch (state.family) {
    case 'ring':
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
  border: ${thickness}px solid ${trackColor};
  border-top-color: ${color};
  border-radius: 50%;
  animation: ${k(anim)} ${speed}s linear infinite;
}

@keyframes ${anim} {
  to { transform: rotate(360deg); }
}

${labelCss}`,
        keyframes,
      }

    case 'dual-ring':
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
}

.${c} span {
  position: absolute;
  inset: 0;
  border: ${thickness}px solid transparent;
  border-radius: 50%;
  /* Two arcs on opposite sides, turning opposite ways. Same duration, so
     they cross at the same two points every cycle — which is what reads as
     one object rather than two. */
  border-top-color: ${color};
  animation: ${k(anim)} ${speed}s linear infinite;
}

.${c} span:nth-child(2) {
  inset: ${thickness * 2}px;
  border-top-color: transparent;
  border-bottom-color: ${color};
  animation-direction: reverse;
  animation-duration: ${n(speed * 1.4)}s;
}

@keyframes ${anim} {
  to { transform: rotate(360deg); }
}

${labelCss}`,
        keyframes,
      }

    case 'dots': {
      const dot = Math.max(4, Math.round(size / 4))
      const stagger = n(speed / (count + 1))
      const delays = Array.from(
        { length: count },
        (_, i) =>
          `.${c} span:nth-child(${i + 1}) { animation-delay: ${n(stagger * i)}s; }`,
      ).join('\n')
      return {
        css: `.${c} {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${gap}px;
  height: ${size}px;
}

.${c} span {
  width: ${dot}px;
  height: ${dot}px;
  border-radius: 50%;
  background: ${color};
  animation: ${k(anim)} ${speed}s ease-in-out infinite;
}

${delays}

@keyframes ${anim} {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
  40% { transform: translateY(-${Math.round(dot * 0.8)}px); opacity: 1; }
}

${labelCss}`,
        keyframes,
      }
    }

    case 'bars': {
      const stagger = n(speed / (count + 2))
      const delays = Array.from(
        { length: count },
        (_, i) =>
          `.${c} span:nth-child(${i + 1}) { animation-delay: ${n(stagger * i)}s; }`,
      ).join('\n')
      return {
        css: `.${c} {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  gap: ${gap}px;
  height: ${size}px;
}

.${c} span {
  width: ${thickness + 1}px;
  height: 100%;
  border-radius: ${Math.round((thickness + 1) / 2)}px;
  background: ${color};
  /* Scaled from the bottom rather than animating height: a transform is
     composited, a height is a layout pass on every frame. */
  transform-origin: bottom;
  animation: ${k(anim)} ${speed}s ease-in-out infinite;
}

${delays}

@keyframes ${anim} {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

${labelCss}`,
        keyframes,
      }
    }

    case 'pulse':
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
  border-radius: 50%;
  background: ${color};
  animation: ${k(anim)} ${speed}s ease-in-out infinite;
}

@keyframes ${anim} {
  0%, 100% { transform: scale(0.75); opacity: 0.6; }
  50% { transform: scale(1); opacity: 1; }
}

${labelCss}`,
        keyframes,
      }

    case 'ping':
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
}

.${c}::before {
  content: '';
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: ${color};
}

.${c}::after {
  content: '';
  position: absolute;
  inset: 0;
  border: ${thickness}px solid ${color};
  border-radius: 50%;
  animation: ${k(anim)} ${speed}s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ${anim} {
  0% { transform: scale(0.4); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0; }
}

${labelCss}`,
        keyframes,
      }

    case 'orbit': {
      const dot = Math.max(5, Math.round(size / 5))
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
}

.${c} span:first-child {
  position: absolute;
  inset: 0;
  border: ${thickness}px solid ${trackColor};
  border-radius: 50%;
}

.${c} span:last-child {
  position: absolute;
  top: -${Math.round(dot / 2 - thickness / 2)}px;
  left: calc(50% - ${dot / 2}px);
  width: ${dot}px;
  height: ${dot}px;
  border-radius: 50%;
  background: ${color};
  /* Rotated about the centre of the track, not its own centre — which is
     what the second translate undoes. */
  transform-origin: ${dot / 2}px ${n(size / 2 + dot / 2 - thickness / 2)}px;
  animation: ${k(anim)} ${speed}s linear infinite;
}

@keyframes ${anim} {
  to { transform: rotate(360deg); }
}

${labelCss}`,
        keyframes,
      }
    }

    case 'conic':
      return {
        css: `.${c} {
  position: relative;
  display: inline-block;
  width: ${size}px;
  height: ${size}px;
  border-radius: 50%;
  background: conic-gradient(from 0turn, ${trackColor} 0 25%, ${color} 100%);
  /* The mask is what turns the disc into a ring. Both spellings: Safari
     shipped the prefixed one for years and still needs it on older iOS. */
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px));
  mask: radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px));
  animation: ${k(anim)} ${speed}s linear infinite;
}

@keyframes ${anim} {
  to { transform: rotate(360deg); }
}

${labelCss}`,
        keyframes,
      }

    case 'bar':
      return {
        css: `.${c} {
  position: relative;
  display: block;
  width: 100%;
  height: ${thickness}px;
  overflow: hidden;
  border-radius: ${thickness}px;
  background: ${trackColor};
}

.${c}::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  border-radius: inherit;
  background: ${color};
  animation: ${k(anim)} ${speed}s ease-in-out infinite;
}

@keyframes ${anim} {
  /* Percentages of the bar's own width would stop at its right edge; the
     two 250%s are what carry the segment fully off both ends. */
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}

${labelCss}`,
        keyframes,
      }

    case 'shimmer':
      return {
        css: `.${c} {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${gap}px;
  width: 100%;
}

.${c}-line {
  height: ${thickness * 3}px;
  border-radius: ${thickness}px;
  /* The sheen is a moving background rather than an overlaid element, so
     the skeleton stays one box in the layout. */
  background: linear-gradient(90deg, ${trackColor} 25%, ${color} 37%, ${trackColor} 63%);
  background-size: 400% 100%;
  animation: ${k(anim)} ${n(speed * 1.4)}s ease infinite;
}

.${c}-line:last-of-type { width: 60%; }

@keyframes ${anim} {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

${labelCss}`,
        keyframes,
      }
  }
}

/**
 * A complete loader: markup, CSS, and the guard.
 *
 * The guard is not optional and not a toggle. Every family here animates
 * forever, which is precisely what `prefers-reduced-motion` exists to stop,
 * and a generator that made it a checkbox would ship unguarded loaders by
 * default — the same default that put the guard-adding pass into this
 * codebase in the first place. It is built by `reducedMotionGuard`, the same
 * function the catalog's own effects are guarded by, so the rule here and
 * the rule on 835 catalog entries cannot drift apart.
 */
export function buildLoader(state: LoaderState): LoaderOutput {
  const { css, keyframes } = loaderCss(state)
  const guard = reducedMotionGuard(css)
  return {
    html: loaderHtml(state),
    css: guard ? `${css}\n\n${guard}` : css,
    keyframes,
  }
}

/* ============================================================
 *  Reading a loader back out of the catalog
 * ============================================================ */

/**
 * Tag or name fragment → family, most specific first.
 *
 * Order is the whole design here. Catalog loaders carry several tags each —
 * "Ocean Percentage Ring" is tagged progress, ring, determinate and
 * percentage — so what matters is which hint gets to answer first. The rule
 * is: shape before behaviour. A percentage *ring* is closer to a ring than to
 * a progress bar, however accurate "progress" is as a description.
 *
 * The ten hand-written loaders carry no tags at all, so for those this reads
 * the name — which is why every pattern has to survive being matched against
 * ordinary English rather than a controlled vocabulary. Hence the word
 * boundaries: without them "typing" contains "ping", and the catalog's typing
 * indicator (three bouncing dots) came back as a sonar ripple.
 */
const FAMILY_HINTS: Array<[pattern: RegExp, family: LoaderFamily]> = [
  [/dual[- ]?ring/, 'dual-ring'],
  [/conic|mask/, 'conic'],
  [/\borbit/, 'orbit'],
  // "Pulse Ring" is three expanding rings, not a breathing disc — it belongs
  // to this family rather than to the one its first word names.
  [/\b(ping|ripple|sonar|radar)\b|pulse[- ]ring/, 'ping'],
  [/shimmer|skeleton/, 'shimmer'],
  [/\bring\b/, 'ring'],
  [/progress|upload|liquid|\bfill|\bbar\b/, 'bar'],
  [/\bbars|equalizer|audio/, 'bars'],
  [/\bdots|typing|bounce|helix/, 'dots'],
  [/pulse|heartbeat/, 'pulse'],
  [/spinner|\bring|\brot/, 'ring'],
]

/** The nearest family to a catalog loader, by its tags and its name. */
export function familyFromTags(tags: string[], name = ''): LoaderFamily {
  const haystack = [...tags, name].join(' ').toLowerCase()
  for (const [pattern, family] of FAMILY_HINTS) {
    if (pattern.test(haystack)) return family
  }
  return 'ring'
}

/** Every colour literal in a stylesheet, in source order. */
const COLOR_PATTERN =
  /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)|oklch\([^)]*\)|hsla?\([^)]*\)/gi

/** Whether a colour literal carries an alpha below 1. */
function isTranslucent(color: string): boolean {
  return /rgba?\([^)]*,\s*0?\.\d+\s*\)|\/\s*0?\.\d+\s*\)/i.test(color)
}

/**
 * How saturated a colour is, on a scale nothing else needs to agree with.
 *
 * The colour a loader is *about* is its most vivid one, not its first. Half
 * the catalog's loaders are drawn for a dark surface and open with the
 * surface colour — `#0f172a` on line one, the actual cyan four lines down —
 * so taking the first literal seeds the tool with a colour the loader is
 * merely sitting on. Chroma separates the two without needing to know which
 * property either was written to.
 *
 * Only hex and `rgb()` can be measured here; a colour written as `oklch()` or
 * `hsl()` scores mid, which puts it above a grey and below a measured vivid.
 * Parsing every colour syntax to rank them would be a colour library, and the
 * result is a slider default.
 */
function vividness(color: string): number {
  let r: number, g: number, b: number
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((d) => d + d)
            .join('')
        : hex[1]
    r = parseInt(digits.slice(0, 2), 16)
    g = parseInt(digits.slice(2, 4), 16)
    b = parseInt(digits.slice(4, 6), 16)
  } else {
    const rgb = color.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
    if (!rgb) return 0.35
    r = Number(rgb[1])
    g = Number(rgb[2])
    b = Number(rgb[3])
  }
  // Saturation as max-minus-min over max: 0 for any grey, 1 for a pure hue,
  // and it needs no colour-space conversion to be right about which is which.
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

/**
 * The colour a loader is drawn in.
 *
 * Opaque colours are preferred over translucent ones — an `rgba(…, 0.2)` at
 * the top of a ring rule is the track, not the loader — and among those, the
 * most saturated wins. Ties break on source order, so a two-colour gradient
 * seeds from the first stop rather than from whichever the sort happened to
 * put first.
 */
export function dominantColorIn(css: string): string | null {
  const colors = css.match(COLOR_PATTERN)
  if (!colors || colors.length === 0) return null

  const opaque = colors.filter((color) => !isTranslucent(color))
  const candidates = opaque.length ? opaque : colors

  let best = candidates[0]
  let bestScore = vividness(best)
  for (const color of candidates.slice(1)) {
    const score = vividness(color)
    if (score > bestScore) {
      best = color
      bestScore = score
    }
  }
  return best
}

/**
 * Recover a generator state from a catalog loader's own CSS.
 *
 * This is what "wired into the catalog" means. The 35 loaders in the catalog
 * are hand-written and generated CSS with no parameters attached; rather than
 * maintain a second table pairing each one with a set of slider positions —
 * which would be wrong within two additions, the way every hand-kept mapping
 * in this repo has been — the numbers are read back out of the stylesheet.
 * Size from the first `width`, thickness from the first `border` or bar
 * width, duration from the animation shorthand, count from how many children
 * the markup has.
 *
 * It is an approximation and is described as one in the UI: the result is the
 * nearest member of a family, not a reproduction. What it has to be is a
 * better starting point than the defaults, which it always is.
 */
export function seedFromCss(
  css: string,
  html: string,
  tags: string[],
  name = '',
): Partial<LoaderState> {
  const seed: Partial<LoaderState> = { family: familyFromTags(tags, name) }

  /*
    Size is the LARGEST dimension in the stylesheet, not the first one.

    Taking the first `width` reads an equalizer's 5px bar rather than its
    32px container, and opens the tool on a loader the size of a full stop.
    Anything over 200px is a full-width track (the indeterminate bar's 220px)
    rather than the size of an object, and is left to the family's own
    layout.
  */
  const dimensions = [...css.matchAll(/(?:width|height):\s*(\d+(?:\.\d+)?)px/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value > 0 && value <= 200)
  if (dimensions.length) {
    seed.size = Math.min(120, Math.max(12, Math.round(Math.max(...dimensions))))
  }

  /*
    Thickness from a border width — and not from `border-radius`, which is
    the same prefix and routinely 999px. Reading that gave the indeterminate
    bar a 16px stroke, which is the clamp rather than a measurement.
  */
  const border = css.match(/border(?!-radius)(?:-\w+)?:\s*(\d+(?:\.\d+)?)px/i)
  if (border) {
    seed.thickness = Math.min(16, Math.max(1, Math.round(Number(border[1]))))
  } else if (seed.family === 'bar' || seed.family === 'shimmer') {
    // Neither family has a border: for them the thin dimension IS the
    // thickness, and the size slider governs the other axis.
    const thin = dimensions.filter((value) => value <= 24)
    if (thin.length) seed.thickness = Math.max(1, Math.round(Math.min(...thin)))
  }

  /*
    Duration from the animation shorthand.

    `0s` is excluded deliberately: a delay written before the duration in the
    shorthand would otherwise be read as the duration and open the tool on a
    loader that does not move.
  */
  const seconds = css.match(/animation:[^;]*?(\d+(?:\.\d+)?)(m?s)/i)
  if (seconds) {
    const value = Number(seconds[1]) / (seconds[2].toLowerCase() === 'ms' ? 1000 : 1)
    if (value > 0.05) seed.speed = Math.min(6, Math.round(value * 100) / 100)
  }

  const children = html.match(/<span/g)?.length
  if (children && children > 1) seed.count = Math.min(8, children)

  const gap = css.match(/gap:\s*(\d+(?:\.\d+)?)px/i)
  if (gap) seed.gap = Math.min(32, Math.round(Number(gap[1])))

  const color = dominantColorIn(css)
  if (color) seed.color = color

  return seed
}
