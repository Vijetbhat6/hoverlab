/**
 * Tailwind ↔ CSS translation.
 *
 * Three tools here already *emit* a Tailwind config — the token generator,
 * the palette generator, the spacing scale — and nothing reads one back.
 * The traffic runs both ways in practice: you inherit a stylesheet and want
 * it as utilities, or you inherit a component and want to know what its
 * classes actually do before you change one.
 *
 * What this is honest about, and what the tool says on the page: it is a
 * translator for the common utility surface, not a compiler. Tailwind is a
 * build step with a config, variants, plugins and a theme that a text box
 * cannot see. So:
 *
 *   - Declarations with a known utility map to it.
 *   - Everything else becomes an arbitrary value (`w-[37px]`) or, failing
 *     that, an arbitrary property (`[mask-image:linear-gradient(...)]`),
 *     which is always correct and never a guess.
 *   - Nothing is silently dropped. A line this cannot place comes back
 *     flagged, because a converter that quietly loses a declaration is
 *     worse than one that refuses it.
 *
 * The scales below are Tailwind's defaults. A project with a customised
 * theme will differ, which is stated on the page rather than guessed at.
 */

/** Tailwind's default spacing scale: the number is rem/0.25, so 4 = 1rem. */
const SPACING: Array<[string, number]> = [
  ['0', 0],
  ['px', 1],
  ['0.5', 2],
  ['1', 4],
  ['1.5', 6],
  ['2', 8],
  ['2.5', 10],
  ['3', 12],
  ['3.5', 14],
  ['4', 16],
  ['5', 20],
  ['6', 24],
  ['7', 28],
  ['8', 32],
  ['9', 36],
  ['10', 40],
  ['11', 44],
  ['12', 48],
  ['14', 56],
  ['16', 64],
  ['20', 80],
  ['24', 96],
  ['28', 112],
  ['32', 128],
  ['36', 144],
  ['40', 160],
  ['44', 176],
  ['48', 192],
  ['52', 208],
  ['56', 224],
  ['60', 240],
  ['64', 256],
  ['72', 288],
  ['80', 320],
  ['96', 384],
]

const RADIUS: Array<[string, string]> = [
  ['-none', '0px'],
  ['-sm', '0.125rem'],
  ['', '0.25rem'],
  ['-md', '0.375rem'],
  ['-lg', '0.5rem'],
  ['-xl', '0.75rem'],
  ['-2xl', '1rem'],
  ['-3xl', '1.5rem'],
  ['-full', '9999px'],
]

const FONT_SIZE: Array<[string, string]> = [
  ['xs', '0.75rem'],
  ['sm', '0.875rem'],
  ['base', '1rem'],
  ['lg', '1.125rem'],
  ['xl', '1.25rem'],
  ['2xl', '1.5rem'],
  ['3xl', '1.875rem'],
  ['4xl', '2.25rem'],
  ['5xl', '3rem'],
  ['6xl', '3.75rem'],
  ['7xl', '4.5rem'],
  ['8xl', '6rem'],
  ['9xl', '8rem'],
]

const FONT_WEIGHT: Array<[string, string]> = [
  ['thin', '100'],
  ['extralight', '200'],
  ['light', '300'],
  ['normal', '400'],
  ['medium', '500'],
  ['semibold', '600'],
  ['bold', '700'],
  ['extrabold', '800'],
  ['black', '900'],
]

/**
 * Properties whose whole value is a keyword that maps to one utility.
 *
 * Kept as data rather than a switch so both directions read from the same
 * table — a mapping that exists in one direction and not the other is the
 * classic way a converter like this rots.
 */
const KEYWORDS: Record<string, Record<string, string>> = {
  display: {
    block: 'block',
    'inline-block': 'inline-block',
    inline: 'inline',
    flex: 'flex',
    'inline-flex': 'inline-flex',
    grid: 'grid',
    'inline-grid': 'inline-grid',
    contents: 'contents',
    table: 'table',
    none: 'hidden',
  },
  position: {
    static: 'static',
    fixed: 'fixed',
    absolute: 'absolute',
    relative: 'relative',
    sticky: 'sticky',
  },
  'flex-direction': {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    column: 'flex-col',
    'column-reverse': 'flex-col-reverse',
  },
  'flex-wrap': {
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
    nowrap: 'flex-nowrap',
  },
  'justify-content': {
    'flex-start': 'justify-start',
    start: 'justify-start',
    'flex-end': 'justify-end',
    end: 'justify-end',
    center: 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
    stretch: 'justify-stretch',
  },
  'align-items': {
    'flex-start': 'items-start',
    start: 'items-start',
    'flex-end': 'items-end',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  },
  'align-self': {
    auto: 'self-auto',
    'flex-start': 'self-start',
    'flex-end': 'self-end',
    center: 'self-center',
    stretch: 'self-stretch',
    baseline: 'self-baseline',
  },
  'text-align': {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },
  'text-transform': {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    none: 'normal-case',
  },
  'font-style': { italic: 'italic', normal: 'not-italic' },
  'text-decoration-line': {
    underline: 'underline',
    'line-through': 'line-through',
    none: 'no-underline',
  },
  overflow: {
    auto: 'overflow-auto',
    hidden: 'overflow-hidden',
    visible: 'overflow-visible',
    scroll: 'overflow-scroll',
    clip: 'overflow-clip',
  },
  'overflow-x': {
    auto: 'overflow-x-auto',
    hidden: 'overflow-x-hidden',
    visible: 'overflow-x-visible',
    scroll: 'overflow-x-scroll',
  },
  'overflow-y': {
    auto: 'overflow-y-auto',
    hidden: 'overflow-y-hidden',
    visible: 'overflow-y-visible',
    scroll: 'overflow-y-scroll',
  },
  cursor: {
    pointer: 'cursor-pointer',
    default: 'cursor-default',
    'not-allowed': 'cursor-not-allowed',
    wait: 'cursor-wait',
    text: 'cursor-text',
    move: 'cursor-move',
    grab: 'cursor-grab',
  },
  'object-fit': {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  },
  visibility: { visible: 'visible', hidden: 'invisible', collapse: 'collapse' },
  'white-space': {
    normal: 'whitespace-normal',
    nowrap: 'whitespace-nowrap',
    pre: 'whitespace-pre',
    'pre-line': 'whitespace-pre-line',
    'pre-wrap': 'whitespace-pre-wrap',
  },
  'box-sizing': { 'border-box': 'box-border', 'content-box': 'box-content' },
  'flex-grow': { '0': 'grow-0', '1': 'grow' },
  'flex-shrink': { '0': 'shrink-0', '1': 'shrink' },
  flex: { '1 1 0%': 'flex-1', auto: 'flex-auto', initial: 'flex-initial', none: 'flex-none' },
}

/** Property → utility prefix, for the properties that take a spacing value. */
const SPACING_PROPS: Record<string, string> = {
  padding: 'p',
  'padding-top': 'pt',
  'padding-right': 'pr',
  'padding-bottom': 'pb',
  'padding-left': 'pl',
  margin: 'm',
  'margin-top': 'mt',
  'margin-right': 'mr',
  'margin-bottom': 'mb',
  'margin-left': 'ml',
  gap: 'gap',
  'column-gap': 'gap-x',
  'row-gap': 'gap-y',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  width: 'w',
  height: 'h',
  'min-width': 'min-w',
  'min-height': 'min-h',
  'max-width': 'max-w',
  'max-height': 'max-h',
}

/** Property → prefix, for the ones that take a colour. */
const COLOR_PROPS: Record<string, string> = {
  color: 'text',
  'background-color': 'bg',
  'border-color': 'border',
  'outline-color': 'outline',
  fill: 'fill',
  stroke: 'stroke',
}

/** Sizes that have a named utility rather than a number. */
const NAMED_SIZES: Record<string, string> = {
  '100%': 'full',
  auto: 'auto',
  '100vw': 'screen',
  '100vh': 'screen',
  'min-content': 'min',
  'max-content': 'max',
  'fit-content': 'fit',
  '50%': '1/2',
  '33.333333%': '1/3',
  '66.666667%': '2/3',
  '25%': '1/4',
  '75%': '3/4',
}

export interface ConvertedLine {
  /** The source line, as given. */
  source: string
  /** The utilities it became, or null when it could not be placed at all. */
  output: string | null
  /**
   * How it was translated, so the page can say which lines are exact and
   * which fell back — a converter people trust is one that shows its work.
   */
  kind: 'exact' | 'arbitrary-value' | 'arbitrary-property' | 'unsupported'
  note?: string
}

export interface ConvertResult {
  lines: ConvertedLine[]
  /** Everything joined, ready to paste into a className. */
  classes: string
}

/** A px length as a number, or null when the value is not a plain px length. */
function pxOf(value: string): number | null {
  const m = /^(-?[\d.]+)px$/.exec(value.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** A rem length converted to px at the 16px root Tailwind's scale assumes. */
function remPx(value: string): number | null {
  const m = /^(-?[\d.]+)rem$/.exec(value.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n * 16 : null
}

function spacingToken(px: number): string | null {
  const abs = Math.abs(px)
  const hit = SPACING.find(([, size]) => size === abs)
  if (!hit) return null
  return px < 0 ? `-${hit[0]}` : hit[0]
}

/** Values Tailwind cannot have inside a bracket: spaces become underscores. */
function bracket(value: string): string {
  return value.trim().replace(/\s+/g, '_')
}

/**
 * One declaration → one or more utilities.
 *
 * Exported for the tests, which is the point of this living in lib rather
 * than in the page: the mapping table is the part that will rot, and it is
 * the part a test can pin down.
 */
export function declarationToUtilities(
  property: string,
  rawValue: string,
): ConvertedLine {
  const prop = property.trim().toLowerCase()
  const value = rawValue.trim().replace(/;$/, '')
  const source = `${prop}: ${value};`

  if (!prop || !value) {
    return { source, output: null, kind: 'unsupported', note: 'Not a declaration.' }
  }

  // Custom properties are values, not utilities — they belong in a
  // stylesheet or a theme, and pretending otherwise would be a wrong answer
  // rather than a missing one.
  if (prop.startsWith('--')) {
    return {
      source,
      output: null,
      kind: 'unsupported',
      note: 'A custom property belongs in your CSS or your Tailwind theme, not in a class.',
    }
  }

  // 1. Whole-value keywords.
  const keyword = KEYWORDS[prop]?.[value]
  if (keyword) return { source, output: keyword, kind: 'exact' }

  // 2. Colours.
  const colorPrefix = COLOR_PROPS[prop]
  if (colorPrefix && /^(#|rgb|hsl|oklch|var\()/i.test(value)) {
    return {
      source,
      output: `${colorPrefix}-[${bracket(value)}]`,
      kind: 'arbitrary-value',
      note: 'A literal colour. If it is in your theme, the named utility is better — this is always correct but never semantic.',
    }
  }

  // 3. Lengths on the spacing/sizing scale.
  const spacingPrefix = SPACING_PROPS[prop]
  if (spacingPrefix) {
    const named = NAMED_SIZES[value]
    if (named) return { source, output: `${spacingPrefix}-${named}`, kind: 'exact' }

    const px = pxOf(value) ?? remPx(value)
    if (px !== null) {
      const token = spacingToken(px)
      if (token) {
        // Negative margins put the minus on the utility, not the number.
        return token.startsWith('-')
          ? { source, output: `-${spacingPrefix}-${token.slice(1)}`, kind: 'exact' }
          : { source, output: `${spacingPrefix}-${token}`, kind: 'exact' }
      }
      return {
        source,
        output: `${spacingPrefix}-[${bracket(value)}]`,
        kind: 'arbitrary-value',
        note: `${value} is not on the default spacing scale — the nearest are ${nearestSpacing(px)}.`,
      }
    }
    return {
      source,
      output: `${spacingPrefix}-[${bracket(value)}]`,
      kind: 'arbitrary-value',
    }
  }

  // 4. The scales with their own named steps.
  if (prop === 'border-radius') {
    const hit = RADIUS.find(([, v]) => sameLength(v, value))
    if (hit) return { source, output: `rounded${hit[0]}`, kind: 'exact' }
    return { source, output: `rounded-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'font-size') {
    const hit = FONT_SIZE.find(([, v]) => sameLength(v, value))
    if (hit) return { source, output: `text-${hit[0]}`, kind: 'exact' }
    return { source, output: `text-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'font-weight') {
    const hit = FONT_WEIGHT.find(([, v]) => v === value)
    if (hit) return { source, output: `font-${hit[0]}`, kind: 'exact' }
    return { source, output: `font-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'opacity') {
    const n = Number(value)
    if (Number.isFinite(n)) {
      const pct = Math.round(n * 100)
      // Tailwind's opacity scale runs in fives.
      if (pct % 5 === 0) return { source, output: `opacity-${pct}`, kind: 'exact' }
    }
    return { source, output: `opacity-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'z-index') {
    const n = Number(value)
    if (Number.isFinite(n) && [0, 10, 20, 30, 40, 50].includes(n)) {
      return { source, output: `z-${n}`, kind: 'exact' }
    }
    return { source, output: `z-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'border-width') {
    const px = pxOf(value)
    if (px === 1) return { source, output: 'border', kind: 'exact' }
    if (px !== null && [0, 2, 4, 8].includes(px)) {
      return { source, output: `border-${px}`, kind: 'exact' }
    }
    return { source, output: `border-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'box-shadow') {
    return {
      source,
      output: `shadow-[${bracket(value)}]`,
      kind: 'arbitrary-value',
      note: 'Tailwind’s named shadows are a different set of values — this preserves yours exactly rather than picking the closest.',
    }
  }

  if (prop === 'grid-template-columns' || prop === 'grid-template-rows') {
    const prefix = prop.endsWith('columns') ? 'grid-cols' : 'grid-rows'
    const simple = /^repeat\((\d+),\s*minmax\(0(?:px)?,\s*1fr\)\)$/.exec(value)
    if (simple) return { source, output: `${prefix}-${simple[1]}`, kind: 'exact' }
    const bare = /^(?:1fr\s*)+$/.test(value)
    if (bare) {
      return { source, output: `${prefix}-${value.trim().split(/\s+/).length}`, kind: 'exact' }
    }
    return { source, output: `${prefix}-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  if (prop === 'line-height') {
    const px = pxOf(value) ?? remPx(value)
    if (px !== null) {
      const token = spacingToken(px)
      if (token) return { source, output: `leading-${token}`, kind: 'exact' }
    }
    return { source, output: `leading-[${bracket(value)}]`, kind: 'arbitrary-value' }
  }

  /*
    5. The universal fallback.

    Arbitrary properties take any declaration at all, so nothing needs to be
    dropped — `[mask-image:linear-gradient(...)]` is a valid class. It is
    reported as such rather than as an exact translation, because it is a
    literal escape hatch and a reader should know that is what they have.
  */
  return {
    source,
    output: `[${prop}:${bracket(value)}]`,
    kind: 'arbitrary-property',
    note: 'No utility covers this property — emitted as an arbitrary property, which is valid and exact.',
  }
}

/** Two nearest scale steps, for the "not on the scale" note. */
function nearestSpacing(px: number): string {
  const abs = Math.abs(px)
  const sorted = [...SPACING].sort(
    (a, b) => Math.abs(a[1] - abs) - Math.abs(b[1] - abs),
  )
  return sorted
    .slice(0, 2)
    .map(([token, size]) => `${token} (${size}px)`)
    .join(' and ')
}

/**
 * Whether two length strings denote the same length.
 *
 * `8px` and `0.5rem` are the same, so a table written in rem has to match a
 * value written in px. Compared literally first, because the tables also
 * hold values that are not convertible at all — `9999px` for `rounded-full`
 * is a sentinel, not a measurement, and converting it to 624.9375rem made
 * it match nothing.
 */
function sameLength(a: string, b: string): boolean {
  const x = a.trim()
  const y = b.trim()
  if (x === y) return true
  const px = (v: string) => pxOf(v) ?? remPx(v)
  const pa = px(x)
  const pb = px(y)
  return pa !== null && pb !== null && Math.abs(pa - pb) < 0.001
}

/**
 * A block of CSS declarations → Tailwind utilities.
 *
 * Accepts a bare list of declarations or a full rule — the selector and
 * braces are stripped, because people paste what they have rather than what
 * a parser wants. Nested rules and at-rules are reported rather than
 * guessed at: a media query is a variant prefix, and which one depends on
 * a config this cannot see.
 */
export function cssToTailwind(input: string): ConvertResult {
  const lines: ConvertedLine[] = []

  // Strip comments first so a declaration inside one is not converted.
  const body = input.replace(/\/\*[\s\S]*?\*\//g, '')

  for (const raw of body.split(/[;\n]/)) {
    const chunk = raw.trim()
    if (!chunk) continue

    if (/^@/.test(chunk)) {
      lines.push({
        source: chunk,
        output: null,
        kind: 'unsupported',
        note: 'An at-rule. Media and container queries become variant prefixes (sm:, md:) whose breakpoints come from your config.',
      })
      continue
    }

    // A selector line, or a stray brace from a pasted rule.
    if (/[{}]/.test(chunk)) {
      const inner = chunk.replace(/^[^{]*\{/, '').replace(/\}\s*$/, '').trim()
      if (!inner) continue
      const idx = inner.indexOf(':')
      if (idx === -1) continue
      lines.push(declarationToUtilities(inner.slice(0, idx), inner.slice(idx + 1)))
      continue
    }

    const idx = chunk.indexOf(':')
    if (idx === -1) {
      lines.push({
        source: chunk,
        output: null,
        kind: 'unsupported',
        note: 'Not a declaration — no colon.',
      })
      continue
    }

    lines.push(declarationToUtilities(chunk.slice(0, idx), chunk.slice(idx + 1)))
  }

  return {
    lines,
    classes: lines
      .map((l) => l.output)
      .filter(Boolean)
      .join(' '),
  }
}

/* --------------------------------------------------------- the other way */

/** Reverse of KEYWORDS, built once. */
const UTILITY_TO_DECL = new Map<string, string>()
for (const [prop, table] of Object.entries(KEYWORDS)) {
  for (const [value, utility] of Object.entries(table)) {
    if (!UTILITY_TO_DECL.has(utility)) UTILITY_TO_DECL.set(utility, `${prop}: ${value};`)
  }
}

export interface ExpandedClass {
  className: string
  css: string | null
  note?: string
}

/**
 * Tailwind utilities → the CSS they stand for.
 *
 * Variants are reported rather than expanded — `hover:` is a pseudo-class
 * and `md:` is a media query whose breakpoint lives in a config this cannot
 * read, so naming them honestly beats emitting a breakpoint that might be
 * wrong.
 */
export function tailwindToCss(input: string): ExpandedClass[] {
  return input
    .split(/\s+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((className): ExpandedClass => {
      const variantSplit = className.lastIndexOf(':')
      // A colon inside brackets is part of an arbitrary property, not a variant.
      const bracketAt = className.indexOf('[')
      const hasVariant =
        variantSplit > -1 && (bracketAt === -1 || variantSplit < bracketAt)

      if (hasVariant) {
        const variant = className.slice(0, variantSplit)
        const base = className.slice(variantSplit + 1)
        const inner = tailwindToCss(base)[0]
        return {
          className,
          css: inner?.css ?? null,
          note: `Applies under the "${variant}" variant — a pseudo-class, or a breakpoint from your config.`,
        }
      }

      // Arbitrary property: the answer is written on the class.
      const arbitraryProp = /^\[([a-z-]+):(.+)\]$/.exec(className)
      if (arbitraryProp) {
        return {
          className,
          css: `${arbitraryProp[1]}: ${arbitraryProp[2].replace(/_/g, ' ')};`,
        }
      }

      // Arbitrary value on a known prefix. The prefix match is greedy —
      // `grid-cols-[…]` is one prefix, not `grid` plus a token beginning
      // `cols`, and a lazy match silently produced the latter.
      const arbitraryValue = /^(-?)([a-z-]+)-\[(.+)\]$/.exec(className)
      if (arbitraryValue) {
        const [, negative, prefix, value] = arbitraryValue
        const clean = value.replace(/_/g, ' ')
        const prop = propertyForPrefix(prefix, clean)
        if (prop) {
          return { className, css: `${prop}: ${negative}${clean};` }
        }
        return {
          className,
          css: null,
          note: `Arbitrary value "${clean}", on a prefix this does not know.`,
        }
      }

      const known = UTILITY_TO_DECL.get(className)
      if (known) return { className, css: known }

      // Scale steps: prefix plus a token. Greedy prefix, same reason; the
      // token is the last hyphen-free segment, which every scale step is.
      const scaled = /^(-?)([a-z-]+)-([^-]+)$/.exec(className)
      if (scaled) {
        const [, negative, prefix, token] = scaled
        const prop = propertyForPrefix(prefix, token)
        if (prop) {
          const value = valueForToken(prefix, token)
          if (value) return { className, css: `${prop}: ${negative}${value};` }
        }
      }

      return {
        className,
        css: null,
        note: 'Not in this translator’s table — it covers the common utilities, not every plugin and theme key.',
      }
    })
}

/** Whether a value is a colour rather than a length — the `text-` question. */
function looksLikeColor(value: string): boolean {
  return /^(#|rgb|hsl|oklch|oklab|color\(|var\()/i.test(value.trim())
}

/**
 * The property a utility prefix stands for.
 *
 * `token` disambiguates the two prefixes Tailwind overloads: `text-` is
 * font-size for a scale step and colour for a colour, and `border-` is
 * width for a length and colour for a colour. Guessing wrong here turned
 * `text-2xl` into `color: 1.5rem`, which is the kind of output that makes
 * a whole tool untrustworthy.
 */
function propertyForPrefix(prefix: string, token?: string): string | null {
  if (prefix === 'text') {
    if (token && FONT_SIZE.some(([name]) => name === token)) return 'font-size'
    if (token && looksLikeColor(token)) return 'color'
    // An arbitrary length — `text-[13px]` — is a size.
    if (token && (pxOf(token) !== null || remPx(token) !== null)) return 'font-size'
    return 'color'
  }

  if (prefix === 'border') {
    if (token && looksLikeColor(token)) return 'border-color'
    return 'border-width'
  }

  for (const [prop, p] of Object.entries(SPACING_PROPS)) if (p === prefix) return prop
  for (const [prop, p] of Object.entries(COLOR_PROPS)) if (p === prefix) return prop

  const extra: Record<string, string> = {
    rounded: 'border-radius',
    font: 'font-weight',
    leading: 'line-height',
    tracking: 'letter-spacing',
    opacity: 'opacity',
    z: 'z-index',
    shadow: 'box-shadow',
    'grid-cols': 'grid-template-columns',
    'grid-rows': 'grid-template-rows',
  }
  return extra[prefix] ?? null
}

function valueForToken(prefix: string, token: string): string | null {
  if (prefix === 'rounded') {
    const hit = RADIUS.find(([suffix]) => suffix === `-${token}`)
    return hit ? hit[1] : null
  }
  if (prefix === 'text') {
    const hit = FONT_SIZE.find(([name]) => name === token)
    return hit ? hit[1] : null
  }
  if (prefix === 'font') {
    const hit = FONT_WEIGHT.find(([name]) => name === token)
    return hit ? hit[1] : null
  }
  if (prefix === 'opacity' || prefix === 'z') {
    return /^\d+$/.test(token)
      ? prefix === 'opacity'
        ? String(Number(token) / 100)
        : token
      : null
  }
  if (prefix === 'grid-cols' || prefix === 'grid-rows') {
    return /^\d+$/.test(token) ? `repeat(${token}, minmax(0, 1fr))` : null
  }
  if (prefix === 'border') {
    return /^\d+$/.test(token) ? `${token}px` : null
  }

  // Spacing and sizing, which share one scale across a dozen prefixes.
  if (Object.values(SPACING_PROPS).includes(prefix)) {
    for (const [named, util] of Object.entries(NAMED_SIZES)) {
      if (util === token) return named
    }
    const hit = SPACING.find(([name]) => name === token)
    if (hit) return token === 'px' ? '1px' : `${hit[1] / 16}rem`
  }
  return null
}
