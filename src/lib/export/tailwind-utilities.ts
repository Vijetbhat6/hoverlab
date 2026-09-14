/**
 * Tailwind utility classes → a stylesheet, for the Verify tab.
 *
 * ── WHY THIS EXISTS AT ALL ──────────────────────────────────────────────
 *
 * `tailwind.ts` turns an effect's CSS into utility classes. Nothing on the
 * site has ever *rendered* that output — the markup is shown as text and
 * the reader is trusted to believe it. The Verify tab renders it instead,
 * which needs the CSS those class names stand for, and Tailwind itself
 * cannot supply it: the compiler is a Node build step, the classes depend
 * on whatever the customization sliders are set to this second, and the
 * whole panel runs in the visitor's tab.
 *
 * So this reads the class names back.
 *
 * ── WHY IT IS NOT `EXACT_VALUE_UTILITIES` INVERTED ──────────────────────
 *
 * That would be the obvious three lines, and it would make the Verify tab
 * a machine that agrees with itself. If the forward table said
 * `display: flex` → `block`, an inverted table would say `block` →
 * `display: flex`, the two frames would match, and the tab would certify a
 * broken export.
 *
 * Every entry below is therefore written out from what Tailwind emits, not
 * derived from the table it is checking. Where the two disagree the
 * rendering differs and the tab says so, which is the entire point. Please
 * do not "de-duplicate" this against `tailwind.ts` — the duplication *is*
 * the test.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────
 *
 * It is not a Tailwind implementation. It resolves the vocabulary our own
 * converter emits — the exact-value utilities, the `prefix-[value]` and
 * `[property:value]` arbitrary forms, `!` important, and the group/peer/
 * state/pseudo-element variants — and reports anything else as unresolved
 * rather than guessing. An unresolved class is a gap in this reader, and
 * the panel labels it that way; it is not evidence against the conversion.
 */

import { type HtmlElement, classList, parseHtml, walkElements } from './html-parse'

/* ------------------------------------------------------------------ *
 *  Class-name escaping
 * ------------------------------------------------------------------ */

/**
 * Escape a class name for use in a selector.
 *
 * `CSS.escape` would do this, and is not used: this module runs in
 * `node --test` as well as in the browser, and a verifier that cannot be
 * tested outside a DOM is a verifier nobody will trust. The rule is the
 * one CSS actually specifies — backslash-escape anything that is not an
 * identifier character, and hex-escape a leading digit.
 */
export function escapeClass(name: string): string {
  let out = ''
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]
    if (/[A-Za-z_-]/.test(ch) || ch.charCodeAt(0) > 0x7f) {
      out += ch
    } else if (/[0-9]/.test(ch)) {
      // A digit is only a problem in the first position, and there it has
      // to be a hex escape — `\1` is not a way to write "1".
      out += i === 0 ? `\\3${ch} ` : ch
    } else {
      out += `\\${ch}`
    }
  }
  return out
}

/**
 * Decode Tailwind's arbitrary-value spelling back to CSS.
 *
 * `_` stands for a space and `\_` for a literal underscore, which is the
 * inverse of `arb()` in `tailwind.ts`. The backslash is consumed for any
 * escaped character, not just `_`, because that is what Tailwind's own
 * parser does.
 */
export function decodeArbitrary(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && i + 1 < value.length) {
      out += value[++i]
    } else if (ch === '_') {
      out += ' '
    } else {
      out += ch
    }
  }
  return out
}

/**
 * Undo the attribute escaping a class name picked up on its way into HTML.
 *
 * An arbitrary variant is written `[&::before]:opacity-0`, and `&` cannot
 * appear raw in an attribute, so the markup carries `&amp;`. The browser
 * decodes that before it ever becomes a class, and a selector built from
 * the undecoded text would match nothing — which would look exactly like a
 * conversion that lost the rule.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/* ------------------------------------------------------------------ *
 *  The utility vocabulary
 * ------------------------------------------------------------------ */

/**
 * Bare utilities, written from Tailwind's emitted CSS.
 *
 * Read these against the docs rather than against `EXACT_VALUE_UTILITIES`
 * — see the header. A few are worth knowing about:
 *
 *  - `items-start` is `flex-start`, never `start`. Source CSS that said
 *    `start` comes back as `flex-start`, and the differ knows the pair is
 *    behaviourally identical (see `EQUIVALENT_VALUES` in `computed-diff`).
 *  - `border-none` and `outline-none` set a *style*, not a width. The used
 *    width of a `none` border is zero either way, which is why this is not
 *    a difference you can see.
 *  - `underline` and friends are `text-decoration-line`, the longhand.
 */
const UTILITY_DECLARATIONS: Record<string, string> = {
  /* display */
  flex: 'display: flex',
  'inline-flex': 'display: inline-flex',
  block: 'display: block',
  'inline-block': 'display: inline-block',
  inline: 'display: inline',
  grid: 'display: grid',
  'inline-grid': 'display: inline-grid',
  hidden: 'display: none',
  contents: 'display: contents',
  table: 'display: table',
  'flow-root': 'display: flow-root',
  'list-item': 'display: list-item',

  /* position */
  static: 'position: static',
  relative: 'position: relative',
  absolute: 'position: absolute',
  fixed: 'position: fixed',
  sticky: 'position: sticky',

  /* flex box */
  'flex-row': 'flex-direction: row',
  'flex-row-reverse': 'flex-direction: row-reverse',
  'flex-col': 'flex-direction: column',
  'flex-col-reverse': 'flex-direction: column-reverse',
  'flex-wrap': 'flex-wrap: wrap',
  'flex-nowrap': 'flex-wrap: nowrap',
  'flex-wrap-reverse': 'flex-wrap: wrap-reverse',
  'items-center': 'align-items: center',
  'items-start': 'align-items: flex-start',
  'items-end': 'align-items: flex-end',
  'items-stretch': 'align-items: stretch',
  'items-baseline': 'align-items: baseline',
  'justify-center': 'justify-content: center',
  'justify-start': 'justify-content: flex-start',
  'justify-end': 'justify-content: flex-end',
  'justify-between': 'justify-content: space-between',
  'justify-around': 'justify-content: space-around',
  'justify-evenly': 'justify-content: space-evenly',
  'self-center': 'align-self: center',
  'self-start': 'align-self: flex-start',
  'self-end': 'align-self: flex-end',
  'self-stretch': 'align-self: stretch',
  'self-baseline': 'align-self: baseline',
  'self-auto': 'align-self: auto',
  'shrink-0': 'flex-shrink: 0',
  shrink: 'flex-shrink: 1',
  'grow-0': 'flex-grow: 0',
  grow: 'flex-grow: 1',
  'flex-1': 'flex: 1 1 0%',
  'flex-auto': 'flex: 1 1 auto',
  'flex-none': 'flex: none',
  'flex-initial': 'flex: 0 1 auto',

  /* text */
  'text-left': 'text-align: left',
  'text-center': 'text-align: center',
  'text-right': 'text-align: right',
  'text-justify': 'text-align: justify',
  uppercase: 'text-transform: uppercase',
  lowercase: 'text-transform: lowercase',
  capitalize: 'text-transform: capitalize',
  'normal-case': 'text-transform: none',
  underline: 'text-decoration-line: underline',
  'line-through': 'text-decoration-line: line-through',
  overline: 'text-decoration-line: overline',
  'no-underline': 'text-decoration-line: none',
  italic: 'font-style: italic',
  'not-italic': 'font-style: normal',
  'font-thin': 'font-weight: 100',
  'font-extralight': 'font-weight: 200',
  'font-light': 'font-weight: 300',
  'font-normal': 'font-weight: 400',
  'font-medium': 'font-weight: 500',
  'font-semibold': 'font-weight: 600',
  'font-bold': 'font-weight: 700',
  'font-extrabold': 'font-weight: 800',
  'font-black': 'font-weight: 900',
  'whitespace-normal': 'white-space: normal',
  'whitespace-nowrap': 'white-space: nowrap',
  'whitespace-pre': 'white-space: pre',
  'whitespace-pre-wrap': 'white-space: pre-wrap',
  'whitespace-pre-line': 'white-space: pre-line',
  'whitespace-break-spaces': 'white-space: break-spaces',

  /* overflow */
  'overflow-hidden': 'overflow: hidden',
  'overflow-auto': 'overflow: auto',
  'overflow-scroll': 'overflow: scroll',
  'overflow-visible': 'overflow: visible',
  'overflow-clip': 'overflow: clip',
  'overflow-x-hidden': 'overflow-x: hidden',
  'overflow-x-auto': 'overflow-x: auto',
  'overflow-x-scroll': 'overflow-x: scroll',
  'overflow-x-visible': 'overflow-x: visible',
  'overflow-y-hidden': 'overflow-y: hidden',
  'overflow-y-auto': 'overflow-y: auto',
  'overflow-y-scroll': 'overflow-y: scroll',
  'overflow-y-visible': 'overflow-y: visible',

  /* interaction and painting */
  'cursor-pointer': 'cursor: pointer',
  'cursor-default': 'cursor: default',
  'cursor-text': 'cursor: text',
  'cursor-move': 'cursor: move',
  'cursor-wait': 'cursor: wait',
  'cursor-help': 'cursor: help',
  'cursor-not-allowed': 'cursor: not-allowed',
  'cursor-grab': 'cursor: grab',
  'cursor-none': 'cursor: none',
  'pointer-events-none': 'pointer-events: none',
  'pointer-events-auto': 'pointer-events: auto',
  'select-none': 'user-select: none',
  'select-text': 'user-select: text',
  'select-all': 'user-select: all',
  'select-auto': 'user-select: auto',
  'box-border': 'box-sizing: border-box',
  'box-content': 'box-sizing: content-box',
  visible: 'visibility: visible',
  invisible: 'visibility: hidden',
  collapse: 'visibility: collapse',
  isolate: 'isolation: isolate',
  'isolation-auto': 'isolation: auto',
  'object-contain': 'object-fit: contain',
  'object-cover': 'object-fit: cover',
  'object-fill': 'object-fit: fill',
  'object-none': 'object-fit: none',
  'object-scale-down': 'object-fit: scale-down',
  'mix-blend-multiply': 'mix-blend-mode: multiply',
  'mix-blend-screen': 'mix-blend-mode: screen',
  'mix-blend-overlay': 'mix-blend-mode: overlay',
  'mix-blend-normal': 'mix-blend-mode: normal',

  /* backgrounds */
  'bg-transparent': 'background-color: transparent',

  /* borders and outlines */
  'border-none': 'border-style: none',
  'border-solid': 'border-style: solid',
  'border-dashed': 'border-style: dashed',
  'border-dotted': 'border-style: dotted',
  'border-double': 'border-style: double',
  'border-hidden': 'border-style: hidden',
  'outline-none': 'outline-style: none',
}

/**
 * `prefix-[value]` → the property the value lands on.
 *
 * A `string` is unambiguous. A pair is Tailwind's own inference: a value
 * that looks like a colour takes the first property, anything else the
 * second. That inference is Tailwind's, not ours — `bg-[#fff]` really is a
 * background colour and the same prefix with an image value really is an
 * image.
 *
 * That second example is written out in words rather than as the class it
 * describes, deliberately. Tailwind v4 scans every source file in the
 * project for candidates and cannot tell a docblock from markup, so the
 * literal class compiled to `background-image: url(x)`, which webpack's
 * css-loader then tried to resolve as a module — a "Can't resolve './x'"
 * that names `globals.css`, not this file, and 500s every route on the
 * site. A class name in a comment is a class name.
 */
const PREFIX_PROPERTIES: Record<string, string | [color: string, other: string]> = {
  w: 'width',
  h: 'height',
  'min-w': 'min-width',
  'min-h': 'min-height',
  'max-w': 'max-width',
  'max-h': 'max-height',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  inset: 'inset',
  gap: 'gap',
  'gap-x': 'column-gap',
  'gap-y': 'row-gap',
  rounded: 'border-radius',
  'rounded-tl': 'border-top-left-radius',
  'rounded-tr': 'border-top-right-radius',
  'rounded-bl': 'border-bottom-left-radius',
  'rounded-br': 'border-bottom-right-radius',
  leading: 'line-height',
  tracking: 'letter-spacing',
  shadow: 'box-shadow',
  opacity: 'opacity',
  z: 'z-index',
  origin: 'transform-origin',
  basis: 'flex-basis',
  'grid-cols': 'grid-template-columns',
  'grid-rows': 'grid-template-rows',
  content: 'content',
  text: ['color', 'font-size'],
  bg: ['background-color', 'background-image'],
  border: ['border-color', 'border-width'],
  'border-t': ['border-top-color', 'border-top-width'],
  'border-r': ['border-right-color', 'border-right-width'],
  'border-b': ['border-bottom-color', 'border-bottom-width'],
  'border-l': ['border-left-color', 'border-left-width'],
  outline: ['outline-color', 'outline-width'],
  p: 'padding',
  px: 'padding-inline',
  py: 'padding-block',
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',
  pl: 'padding-left',
  m: 'margin',
  mx: 'margin-inline',
  my: 'margin-block',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',
  ml: 'margin-left',
}

/**
 * Prefixes whose bare `-0` is a real utility.
 *
 * Tailwind's `0` comes from a *scale*, and only some prefixes have one
 * that contains it. `p-0`, `top-0`, `z-0`, `border-0` and `opacity-0` are
 * all real; `rounded-0`, `text-0`, `leading-0` and `shadow-0` are not —
 * Tailwind spells those zeroes `rounded-none`, `text-xs`, `leading-none`
 * and `shadow-none`, and a class it has no rule for emits nothing at all.
 *
 * So this set is the difference between "the verifier is missing a rule"
 * and "this class will silently do nothing in a real project", and
 * `utilityStylesheet` reports the two differently.
 */
const ZERO_SCALE_PREFIXES = new Set([
  'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h',
  'top', 'right', 'bottom', 'left', 'inset',
  'gap', 'gap-x', 'gap-y',
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
  'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
  'border', 'border-t', 'border-r', 'border-b', 'border-l',
  'outline', 'z', 'opacity', 'basis',
])

/**
 * Properties in the zero set whose zero carries no unit.
 *
 * Everything else in `ZERO_SCALE_PREFIXES` is a length, and Tailwind's
 * spacing scale spells its zero `0px`. These two are numbers, and `0px` is
 * invalid for both — the declaration is discarded and the element falls
 * back to `opacity: 1`, which is the difference between a hidden checkbox
 * and a visible one.
 */
const UNITLESS_ZERO = new Set(['opacity', 'z-index'])

/** Does this value read as a colour rather than a length? */
function looksLikeColor(value: string): boolean {
  const v = value.trim().toLowerCase()
  return (
    /^#[0-9a-f]{3,8}$/.test(v) ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(/.test(v) ||
    ['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'white', 'black'].includes(v)
  )
}

/* ------------------------------------------------------------------ *
 *  Parsing one class name
 * ------------------------------------------------------------------ */

export interface ParsedUtility {
  /** Variant segments in source order, e.g. `['group-hover/g1', 'before']`. */
  variants: string[]
  /** The utility itself, `!` already stripped. */
  utility: string
  important: boolean
}

/**
 * Split a class on its variant colons.
 *
 * Colons inside `[...]` are not separators — `text-[color:var(--x)]` and
 * `[&:hover]:opacity-0` both depend on that, and a naive `split(':')`
 * mangles each of them in a different direction.
 */
export function parseUtilityClass(cls: string): ParsedUtility {
  const segments: string[] = []
  let depth = 0
  let current = ''

  for (const ch of cls) {
    if (ch === '[') depth++
    else if (ch === ']') depth = Math.max(0, depth - 1)

    if (ch === ':' && depth === 0) {
      segments.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  segments.push(current)

  let utility = segments.pop() ?? ''
  const important = utility.startsWith('!')
  if (important) utility = utility.slice(1)

  return { variants: segments, utility, important }
}

/* ------------------------------------------------------------------ *
 *  Utility → declarations
 * ------------------------------------------------------------------ */

/** Why a class produced no CSS. */
export type UnresolvedReason =
  /** This reader has no rule for it — a gap here, not a conversion fault. */
  | 'unknown'
  /** Tailwind has no such class either, so it will do nothing in a build. */
  | 'not-a-utility'

export interface UtilityResolution {
  /** `color: red`, or null when nothing could be resolved. */
  declarations: string | null
  reason?: UnresolvedReason
}

/** Resolve one bare utility (no variants, no `!`) to a declaration list. */
export function resolveUtility(utility: string): UtilityResolution {
  /* Arbitrary property: `[mask-image:linear-gradient(...)]`. */
  if (utility.startsWith('[') && utility.endsWith(']')) {
    const body = utility.slice(1, -1)
    const colon = body.indexOf(':')
    if (colon <= 0) return { declarations: null, reason: 'not-a-utility' }
    const prop = body.slice(0, colon).trim()
    const value = decodeArbitrary(body.slice(colon + 1)).trim()
    if (!prop || !value) return { declarations: null, reason: 'not-a-utility' }
    return { declarations: `${prop}: ${value}` }
  }

  const exact = UTILITY_DECLARATIONS[utility]
  if (exact) return { declarations: exact }

  /* Arbitrary value: `w-[240px]`, `text-[color:var(--brand)]`. */
  const arbitrary = utility.match(/^(.+?)-\[([\s\S]*)\]$/)
  if (arbitrary) {
    const prefix = arbitrary[1]
    let raw = arbitrary[2]
    const target = PREFIX_PROPERTIES[prefix]
    if (!target) return { declarations: null, reason: 'unknown' }

    /* `text-[length:1.2rem]` — the hint names the property directly. */
    let hint: string | null = null
    const hinted = raw.match(/^(color|length|percentage|number|image|url|family-name):([\s\S]*)$/)
    if (hinted) {
      hint = hinted[1]
      raw = hinted[2]
    }

    const value = decodeArbitrary(raw).trim()
    if (!value) return { declarations: null, reason: 'not-a-utility' }

    let prop: string
    if (typeof target === 'string') {
      prop = target
    } else if (hint) {
      prop = hint === 'color' ? target[0] : target[1]
    } else {
      prop = looksLikeColor(value) ? target[0] : target[1]
    }

    return { declarations: `${prop}: ${value}` }
  }

  /* The bare zero forms, `p-0` and friends. */
  const zero = utility.match(/^(.+)-0$/)
  if (zero) {
    const prefix = zero[1]
    const target = PREFIX_PROPERTIES[prefix]
    if (!target) return { declarations: null, reason: 'unknown' }
    if (!ZERO_SCALE_PREFIXES.has(prefix)) {
      return { declarations: null, reason: 'not-a-utility' }
    }
    // Every prefix in the zero set that is ambiguous is a border or an
    // outline, where the zero is a width — a colour of `0` is not a thing.
    const prop = typeof target === 'string' ? target : target[1]
    // `opacity: 0px` and `z-index: 0px` are not declarations — the browser
    // throws both away and the element renders at the property's initial
    // value, which is how a hidden checkbox came back visible.
    return { declarations: `${prop}: ${UNITLESS_ZERO.has(prop) ? '0' : '0px'}` }
  }

  return { declarations: null, reason: 'unknown' }
}

/* ------------------------------------------------------------------ *
 *  Variants → selector
 * ------------------------------------------------------------------ */

/**
 * Pseudo-elements with a bare variant. Kept separate from the state list
 * because a pseudo-element has to be the *last* thing in the selector, and
 * because `::` is two colons.
 */
const PSEUDO_ELEMENT_VARIANTS = new Set([
  'before', 'after', 'placeholder', 'selection', 'first-line',
  'first-letter', 'marker', 'backdrop', 'file',
])

interface VariantSelector {
  /** Text that goes before the subject, e.g. `.group:hover `. */
  prefix: string
  /** Text that goes after it, e.g. `:hover`. */
  suffix: string
  /** A pseudo-element suffix, which must come last of all. */
  pseudoElement: string
}

/**
 * Turn one variant segment into selector text.
 *
 * Returns null for a variant this reader does not know, which propagates
 * up as an unresolved class rather than as a selector that is quietly
 * wrong — a `hover:` silently dropped would make the two frames agree for
 * the wrong reason.
 */
function variantToSelector(variant: string): VariantSelector | null {
  /* `group-hover`, `peer-checked/p2`, `group-[:has(a)]` */
  const relational = variant.match(/^(group|peer)-(.+)$/)
  if (relational) {
    const kind = relational[1] as 'group' | 'peer'
    let rest = relational[2]

    /* The `/name` suffix binds this variant to one named group or peer. */
    let name: string | null = null
    const slash = rest.lastIndexOf('/')
    if (slash !== -1 && !rest.slice(slash).includes(']')) {
      name = rest.slice(slash + 1)
      rest = rest.slice(0, slash)
    }

    const state =
      rest.startsWith('[') && rest.endsWith(']')
        ? decodeArbitrary(rest.slice(1, -1))
        : `:${rest}`
    if (!state.startsWith(':')) return null

    const marker = name ? `${kind}\\/${escapeClass(name)}` : kind
    // `group` is an ancestor, `peer` a preceding sibling. Tailwind's peer
    // uses the general sibling combinator, which `tailwind.ts` already
    // notes when it converts a `+` rule.
    const combinator = kind === 'group' ? ' ' : ' ~ '
    return { prefix: `.${marker}${state}${combinator}`, suffix: '', pseudoElement: '' }
  }

  /* `[&:nth-child(2)]`, `[&::-webkit-slider-thumb]` */
  if (variant.startsWith('[') && variant.endsWith(']')) {
    const body = decodeArbitrary(variant.slice(1, -1))
    if (!body.includes('&')) return null
    const [before, after] = body.split('&')
    if (after === undefined) return null
    return { prefix: before, suffix: after, pseudoElement: '' }
  }

  if (PSEUDO_ELEMENT_VARIANTS.has(variant)) {
    return { prefix: '', suffix: '', pseudoElement: `::${variant}` }
  }

  /* Everything else is a state on the element itself, and only from a
     list — see `STATE_VARIANT_SELECTORS`. */
  const state = STATE_VARIANT_SELECTORS[variant]
  if (state) return { prefix: '', suffix: state, pseudoElement: '' }

  return null
}

/**
 * State variants, spelled as the selector Tailwind compiles them to.
 *
 * An allowlist rather than `:${variant}`, which is what this was and which
 * is wrong in both directions. `md:` and `dark:` are media queries, and
 * `:md` is not a selector at all — but neither is `:first`, and Tailwind's
 * `first:` compiles to `:first-child`. Emitting `:first` produces CSS the
 * browser parses, discards as unknown, and never applies: the rule
 * disappears, the two frames differ, and the panel blames the conversion
 * for a defect in its own reader.
 *
 * Anything absent is reported as an unresolved class, which says "this
 * reader does not know that one" — the true statement.
 */
const STATE_VARIANT_SELECTORS: Record<string, string> = {
  hover: ':hover',
  focus: ':focus',
  'focus-visible': ':focus-visible',
  'focus-within': ':focus-within',
  active: ':active',
  visited: ':visited',
  target: ':target',
  checked: ':checked',
  indeterminate: ':indeterminate',
  disabled: ':disabled',
  enabled: ':enabled',
  required: ':required',
  optional: ':optional',
  valid: ':valid',
  invalid: ':invalid',
  'in-range': ':in-range',
  'out-of-range': ':out-of-range',
  'placeholder-shown': ':placeholder-shown',
  'read-only': ':read-only',
  autofill: ':autofill',
  default: ':default',
  empty: ':empty',
  // Tailwind's `open:` is an attribute selector, not the `:open`
  // pseudo-class — `<details open>` is what it was built for.
  open: '[open]',
  first: ':first-child',
  last: ':last-child',
  only: ':only-child',
  odd: ':nth-child(odd)',
  even: ':nth-child(even)',
  'first-of-type': ':first-of-type',
  'last-of-type': ':last-of-type',
  'only-of-type': ':only-of-type',
  rtl: '[dir="rtl"]',
  ltr: '[dir="ltr"]',
}

/* ------------------------------------------------------------------ *
 *  The stylesheet
 * ------------------------------------------------------------------ */

export interface UnresolvedClass {
  className: string
  reason: UnresolvedReason
}

export interface UtilityStylesheet {
  /** CSS for every class that resolved, in cascade order. */
  css: string
  /** How many classes produced a rule. */
  resolved: number
  unresolved: UnresolvedClass[]
}

/** Marker classes that carry no declarations of their own. */
function isMarkerClass(cls: string): boolean {
  return cls === 'group' || cls === 'peer' || /^(group|peer)\/[\w-]+$/.test(cls)
}

/** Class names a stylesheet's selectors mention. */
function classesReferencedBy(css: string): Set<string> {
  const found = new Set<string>()
  for (const m of css.matchAll(/\.([A-Za-z_-][\w-]*)/g)) found.add(m[1])
  return found
}

/**
 * Build the stylesheet that the utility classes in `html` stand for.
 *
 * `companionCss` is the leftover sheet the Tailwind export ships beside
 * the markup. It is read, not emitted: the original class names it targets
 * are still on the elements on purpose, and without this they would look
 * like a wall of unresolved utilities.
 *
 * ── ORDER ───────────────────────────────────────────────────────────────
 *
 * Base utilities first, then variants, and within each group the order the
 * classes appear on the element. Real Tailwind sorts its output by
 * property, so two utilities setting the *same* property could resolve the
 * other way round there — which is why `tailwind.ts` collapses same-slot
 * utilities instead of relying on their order, and why this is a footnote
 * rather than a problem.
 */
export function utilityStylesheet(html: string, companionCss = ''): UtilityStylesheet {
  const elements: HtmlElement[] = walkElements(parseHtml(html))
  const kept = classesReferencedBy(companionCss)

  const base: string[] = []
  const variantRules: string[] = []
  const unresolved: UnresolvedClass[] = []
  const seen = new Set<string>()
  let resolved = 0

  for (const el of elements) {
    for (const raw of classList(el)) {
      const cls = decodeEntities(raw)
      if (seen.has(cls)) continue
      seen.add(cls)
      if (isMarkerClass(cls) || kept.has(cls)) continue

      const { variants, utility, important } = parseUtilityClass(cls)
      const { declarations, reason } = resolveUtility(utility)

      if (!declarations) {
        unresolved.push({ className: cls, reason: reason ?? 'unknown' })
        continue
      }

      const selectors = variants.map(variantToSelector)
      if (selectors.some((s) => s === null)) {
        unresolved.push({ className: cls, reason: 'unknown' })
        continue
      }

      let prefix = ''
      let suffix = ''
      let pseudoElement = ''
      for (const part of selectors as VariantSelector[]) {
        prefix += part.prefix
        suffix += part.suffix
        if (part.pseudoElement) pseudoElement = part.pseudoElement
      }

      const selector = `${prefix}.${escapeClass(cls)}${suffix}${pseudoElement}`
      // Every resolution above is a single declaration, so `!important`
      // goes on the end whole — splitting on `;` first would cut a value
      // like `url(a;b.png)` in half.
      const body = important ? `${declarations} !important` : declarations

      const rule = `${selector} { ${body} }`
      if (variants.length) variantRules.push(rule)
      else base.push(rule)
      resolved++
    }
  }

  return {
    css: [...base, ...variantRules].join('\n'),
    resolved,
    unresolved,
  }
}
