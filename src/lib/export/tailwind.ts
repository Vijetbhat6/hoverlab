/**
 * CSS → Tailwind conversion.
 *
 * The honest framing: a general CSS-to-Tailwind compiler is not a solved
 * problem, and anything claiming to be one is lying somewhere. What *is*
 * tractable is this specific job — converting a self-contained effect
 * whose markup we already have — because knowing the DOM collapses most
 * of the hard cases:
 *
 *   `.card .title`        → resolved statically, utilities land on .title
 *   `span:nth-child(2)`   → resolved statically, no variant needed
 *   `.card:hover .title`  → `group` on .card, `group-hover:` on .title
 *   `input:checked + .tr` → `peer` on input, `peer-checked:` on .track
 *   `.btn::before`        → `before:` variant
 *
 * Every declaration converts: common properties map to real utilities
 * (`flex`, `items-center`, `cursor-pointer`), value-carrying ones use
 * arbitrary values (`bg-[#f43f5e]`, `rounded-[0.4rem]`), and anything else
 * falls back to arbitrary properties (`[backdrop-filter:blur(6px)]`).
 * Coverage is therefore total by construction.
 *
 * What does NOT convert is kept — never dropped, never guessed at — in a
 * companion stylesheet: `@keyframes` (which has no class form) and the
 * occasional selector whose relationship Tailwind can't express, such as
 * "peer of my ancestor". When that happens the original class names stay
 * on the elements the leftover rules target, so the output is still
 * correct; it's just not 100% utilities. Those cases are reported in
 * `notes` rather than hidden.
 */

import {
  type HtmlElement,
  type HtmlNode,
  classList,
  parseHtml,
  renderMarkup,
  setAttr,
  walkElements,
} from './html-parse'
import {
  type CssDeclaration,
  type CssRule,
  atBlockToCss,
  parseCss,
  ruleToCss,
} from './css-parse'
import { type ComplexSelector, matchComplex, parseSelector } from './selector'

export interface TailwindResult {
  /** Markup with utility classes applied. */
  markup: string
  /** Companion stylesheet: keyframes + anything not expressible as classes. */
  css: string
  /** Honest caveats about this specific conversion. */
  notes: string[]
  /** Fraction of declarations that became utilities, 0–1. */
  coverage: number
}

/* ------------------------------------------------------------------ *
 *  Arbitrary-value escaping
 * ------------------------------------------------------------------ */

/**
 * Encode a CSS value for use inside Tailwind's `[...]` syntax: whitespace
 * becomes `_`, and literal underscores are escaped so they survive the
 * round-trip.
 */
function arb(value: string): string {
  let v = value.trim()
  // `rgba(244, 63, 94, 0.35)` would otherwise become `rgba(244,_63,...)`.
  // The underscores decode back to spaces and the CSS is still valid, but
  // the class is far more readable without them. Skipped when the value
  // contains a string literal, where whitespace may be significant.
  if (!/["']/.test(v)) v = v.replace(/,\s+/g, ',')
  return v.replace(/_/g, '\\_').replace(/\s+/g, '_')
}

/** Count commas at parenthesis depth 0 — i.e. real value-list separators. */
function topLevelCommas(value: string): number {
  let depth = 0
  let count = 0
  let quote: string | null = null
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) count++
  }
  return count
}

/** Does this value look like a color rather than a length? */
function isColorValue(value: string): boolean {
  const v = value.trim().toLowerCase()
  return (
    /^#[0-9a-f]{3,8}$/.test(v) ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(/.test(v) ||
    ['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'white', 'black'].includes(v)
  )
}

/* ------------------------------------------------------------------ *
 *  Declaration → utility mapping
 * ------------------------------------------------------------------ */

/** Properties whose common values have first-class utilities. */
const EXACT_VALUE_UTILITIES: Record<string, Record<string, string>> = {
  display: {
    flex: 'flex', 'inline-flex': 'inline-flex', block: 'block',
    'inline-block': 'inline-block', inline: 'inline', grid: 'grid',
    'inline-grid': 'inline-grid', none: 'hidden', contents: 'contents',
    table: 'table', 'flow-root': 'flow-root', 'list-item': 'list-item',
  },
  position: {
    static: 'static', relative: 'relative', absolute: 'absolute',
    fixed: 'fixed', sticky: 'sticky',
  },
  'flex-direction': {
    row: 'flex-row', 'row-reverse': 'flex-row-reverse',
    column: 'flex-col', 'column-reverse': 'flex-col-reverse',
  },
  'flex-wrap': {
    wrap: 'flex-wrap', nowrap: 'flex-nowrap', 'wrap-reverse': 'flex-wrap-reverse',
  },
  'align-items': {
    center: 'items-center', 'flex-start': 'items-start', start: 'items-start',
    'flex-end': 'items-end', end: 'items-end', stretch: 'items-stretch',
    baseline: 'items-baseline',
  },
  'justify-content': {
    center: 'justify-center', 'flex-start': 'justify-start', start: 'justify-start',
    'flex-end': 'justify-end', end: 'justify-end', 'space-between': 'justify-between',
    'space-around': 'justify-around', 'space-evenly': 'justify-evenly',
  },
  'align-self': {
    center: 'self-center', 'flex-start': 'self-start', 'flex-end': 'self-end',
    stretch: 'self-stretch', baseline: 'self-baseline', auto: 'self-auto',
  },
  'text-align': {
    left: 'text-left', center: 'text-center', right: 'text-right',
    justify: 'text-justify',
  },
  cursor: {
    pointer: 'cursor-pointer', default: 'cursor-default', text: 'cursor-text',
    move: 'cursor-move', wait: 'cursor-wait', help: 'cursor-help',
    'not-allowed': 'cursor-not-allowed', grab: 'cursor-grab', none: 'cursor-none',
  },
  overflow: {
    hidden: 'overflow-hidden', auto: 'overflow-auto', scroll: 'overflow-scroll',
    visible: 'overflow-visible', clip: 'overflow-clip',
  },
  'overflow-x': {
    hidden: 'overflow-x-hidden', auto: 'overflow-x-auto',
    scroll: 'overflow-x-scroll', visible: 'overflow-x-visible',
  },
  'overflow-y': {
    hidden: 'overflow-y-hidden', auto: 'overflow-y-auto',
    scroll: 'overflow-y-scroll', visible: 'overflow-y-visible',
  },
  'text-transform': {
    uppercase: 'uppercase', lowercase: 'lowercase',
    capitalize: 'capitalize', none: 'normal-case',
  },
  'text-decoration': {
    none: 'no-underline', underline: 'underline', 'line-through': 'line-through',
    overline: 'overline',
  },
  'text-decoration-line': {
    none: 'no-underline', underline: 'underline', 'line-through': 'line-through',
  },
  'white-space': {
    normal: 'whitespace-normal', nowrap: 'whitespace-nowrap', pre: 'whitespace-pre',
    'pre-wrap': 'whitespace-pre-wrap', 'pre-line': 'whitespace-pre-line',
    'break-spaces': 'whitespace-break-spaces',
  },
  'pointer-events': { none: 'pointer-events-none', auto: 'pointer-events-auto' },
  'user-select': {
    none: 'select-none', text: 'select-text', all: 'select-all', auto: 'select-auto',
  },
  'box-sizing': { 'border-box': 'box-border', 'content-box': 'box-content' },
  visibility: { visible: 'visible', hidden: 'invisible', collapse: 'collapse' },
  isolation: { isolate: 'isolate', auto: 'isolation-auto' },
  'object-fit': {
    contain: 'object-contain', cover: 'object-cover', fill: 'object-fill',
    none: 'object-none', 'scale-down': 'object-scale-down',
  },
  'font-style': { italic: 'italic', normal: 'not-italic' },
  'font-weight': {
    '100': 'font-thin', '200': 'font-extralight', '300': 'font-light',
    '400': 'font-normal', '500': 'font-medium', '600': 'font-semibold',
    '700': 'font-bold', '800': 'font-extrabold', '900': 'font-black',
    normal: 'font-normal', bold: 'font-bold',
  },
  border: { none: 'border-none', '0': 'border-0' },
  outline: { none: 'outline-none', '0': 'outline-none' },
  'border-style': {
    solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted',
    double: 'border-double', none: 'border-none', hidden: 'border-hidden',
  },
  'flex-shrink': { '0': 'shrink-0', '1': 'shrink' },
  'flex-grow': { '0': 'grow-0', '1': 'grow' },
  flex: { '1': 'flex-1', auto: 'flex-auto', none: 'flex-none', initial: 'flex-initial' },
  'mix-blend-mode': {
    multiply: 'mix-blend-multiply', screen: 'mix-blend-screen',
    overlay: 'mix-blend-overlay', normal: 'mix-blend-normal',
  },
}

/**
 * Properties that take a single value and have a natural utility prefix,
 * used with Tailwind's arbitrary-value syntax (`w-[240px]`).
 */
const PREFIX_UTILITIES: Record<string, string> = {
  width: 'w', height: 'h',
  'min-width': 'min-w', 'min-height': 'min-h',
  'max-width': 'max-w', 'max-height': 'max-h',
  top: 'top', right: 'right', bottom: 'bottom', left: 'left', inset: 'inset',
  gap: 'gap', 'column-gap': 'gap-x', 'row-gap': 'gap-y',
  'border-radius': 'rounded',
  'border-top-left-radius': 'rounded-tl', 'border-top-right-radius': 'rounded-tr',
  'border-bottom-left-radius': 'rounded-bl', 'border-bottom-right-radius': 'rounded-br',
  'font-size': 'text', 'line-height': 'leading', 'letter-spacing': 'tracking',
  color: 'text',
  'background-color': 'bg',
  'box-shadow': 'shadow',
  opacity: 'opacity',
  'z-index': 'z',
  'border-width': 'border', 'border-color': 'border',
  'border-top-color': 'border-t', 'border-right-color': 'border-r',
  'border-bottom-color': 'border-b', 'border-left-color': 'border-l',
  'border-top-width': 'border-t', 'border-right-width': 'border-r',
  'border-bottom-width': 'border-b', 'border-left-width': 'border-l',
  'outline-color': 'outline', 'outline-width': 'outline',
  'transform-origin': 'origin',
  'flex-basis': 'basis',
  'grid-template-columns': 'grid-cols', 'grid-template-rows': 'grid-rows',
  'padding-top': 'pt', 'padding-right': 'pr',
  'padding-bottom': 'pb', 'padding-left': 'pl',
  'margin-top': 'mt', 'margin-right': 'mr',
  'margin-bottom': 'mb', 'margin-left': 'ml',
}

/** Expansion order for 1–4 value box shorthands: top, right, bottom, left. */
function expandBoxShorthand(value: string): [string, string, string, string] | null {
  // Bail if the value contains functions/commas — `margin: calc(1px + 2%)` etc.
  if (/[(),]/.test(value)) return null
  const parts = value.trim().split(/\s+/)
  switch (parts.length) {
    case 1: return [parts[0], parts[0], parts[0], parts[0]]
    case 2: return [parts[0], parts[1], parts[0], parts[1]]
    case 3: return [parts[0], parts[1], parts[2], parts[1]]
    case 4: return [parts[0], parts[1], parts[2], parts[3]]
    default: return null
  }
}

/** `p`/`m` + sides, collapsing to the `x`/`y` forms where possible. */
function boxUtilities(base: 'p' | 'm', value: string): string[] | null {
  const box = expandBoxShorthand(value)
  if (!box) return null
  const [t, r, b, l] = box
  const size = (v: string) => (v === '0' ? '0' : `[${arb(v)}]`)

  if (t === r && r === b && b === l) return [`${base}-${size(t)}`]
  if (t === b && r === l) return [`${base}y-${size(t)}`, `${base}x-${size(r)}`]

  const out: string[] = []
  if (t === b) out.push(`${base}y-${size(t)}`)
  else {
    out.push(`${base}t-${size(t)}`)
    out.push(`${base}b-${size(b)}`)
  }
  if (r === l) out.push(`${base}x-${size(r)}`)
  else {
    out.push(`${base}r-${size(r)}`)
    out.push(`${base}l-${size(l)}`)
  }
  return out
}

/**
 * Convert one declaration into Tailwind classes (without variants).
 *
 * Always returns at least one class: the arbitrary-property form
 * (`[prop:value]`) is a universal fallback, so no declaration is ever
 * silently dropped.
 */
export function declarationToUtilities(decl: CssDeclaration): string[] {
  const prop = decl.prop.toLowerCase().trim()
  const raw = decl.value.trim()
  const value = raw.toLowerCase()
  const bang = decl.important ? '!' : ''
  const mark = (classes: string[]) => classes.map((c) => `${bang}${c}`)

  // Custom properties keep their exact casing and can't be utilities.
  if (prop.startsWith('--')) return mark([`[${prop}:${arb(raw)}]`])

  const exact = EXACT_VALUE_UTILITIES[prop]?.[value]
  if (exact) return mark([exact])

  if (prop === 'padding') {
    const utils = boxUtilities('p', raw)
    if (utils) return mark(utils)
  }
  if (prop === 'margin') {
    const utils = boxUtilities('m', raw)
    if (utils) return mark(utils)
  }

  if (prop === 'inset' && raw === '0') return mark(['inset-0'])

  if (prop === 'content') {
    // `content: ''` → `content-['']`; Tailwind needs the quotes kept.
    return mark([`content-[${arb(raw)}]`])
  }

  if (prop === 'background' || prop === 'background-image') {
    // `bg-[...]` infers background-color vs background-image from the
    // value. That inference is wrong for the `background` shorthand when
    // it carries layers plus a color, so only use it when unambiguous.
    if (isColorValue(raw)) return mark([`bg-[${arb(raw)}]`])
    // A single gradient/url layer maps cleanly onto `bg-[...]`. Multiple
    // comma-separated layers — or layers plus a trailing colour, which the
    // `background` shorthand allows — do not, because Tailwind would
    // resolve the whole thing to background-image and drop the colour.
    const singleLayer =
      topLevelCommas(raw) === 0 &&
      /^(url|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient|image-set)\(/i.test(raw)
    if (singleLayer) return mark([`bg-[${arb(raw)}]`])
    return mark([`[${prop}:${arb(raw)}]`])
  }

  const prefix = PREFIX_UTILITIES[prop]
  if (prefix) {
    if (raw === '0') return mark([`${prefix}-0`])
    // `text-` is overloaded (color and size); hint when inference can't
    // see a literal, e.g. `var(--brand)`.
    if (prefix === 'text' && raw.startsWith('var(')) {
      const hint = prop === 'color' ? 'color' : 'length'
      return mark([`text-[${hint}:${arb(raw)}]`])
    }
    return mark([`${prefix}-[${arb(raw)}]`])
  }

  // Universal fallback — arbitrary property.
  return mark([`[${prop}:${arb(raw)}]`])
}

/**
 * The "slot" a utility occupies — roughly, which CSS property it controls.
 * `py-[0.4rem]` → `py`, `bg-[#f43f5e]` → `bg`, `flex` → `flex`,
 * `[transition:all_.2s]` → `[transition`.
 *
 * Used to decide when a later declaration should replace an earlier one
 * rather than sit alongside it and lose to the cascade unpredictably.
 */
function utilitySlot(utility: string): string {
  const bare = utility.startsWith('!') ? utility.slice(1) : utility
  if (bare.startsWith('[')) {
    const colon = bare.indexOf(':')
    return colon === -1 ? bare : bare.slice(0, colon)
  }
  const arbitrary = bare.indexOf('-[')
  return arbitrary === -1 ? bare : bare.slice(0, arbitrary)
}

/* ------------------------------------------------------------------ *
 *  Variant mapping
 * ------------------------------------------------------------------ */

/** Pseudo-elements with a first-class Tailwind variant. */
const PSEUDO_ELEMENT_VARIANTS = new Set([
  'before', 'after', 'placeholder', 'selection', 'first-line',
  'first-letter', 'marker', 'backdrop', 'file',
])

/** State pseudo-classes with a first-class variant on the element itself. */
const SELF_STATE_VARIANTS = new Set([
  'hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited',
  'target', 'checked', 'indeterminate', 'disabled', 'enabled', 'required',
  'optional', 'valid', 'invalid', 'in-range', 'out-of-range',
  'placeholder-shown', 'read-only', 'autofill', 'default', 'open',
])

/** States with a first-class `group-*` / `peer-*` form. */
const RELATIONAL_STATE_VARIANTS = new Set([
  'hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited',
  'target', 'checked', 'indeterminate', 'disabled', 'enabled', 'required',
  'valid', 'invalid', 'placeholder-shown', 'read-only', 'open',
])

interface PseudoLike {
  name: string
  arg: string | null
}

/** Render a pseudo-class as the selector text used inside `[...]`. */
function pseudoSelector(pseudo: PseudoLike): string {
  return pseudo.arg ? `:${pseudo.name}(${pseudo.arg})` : `:${pseudo.name}`
}

function selfVariant(pseudo: PseudoLike): string {
  if (!pseudo.arg && SELF_STATE_VARIANTS.has(pseudo.name)) return pseudo.name
  return `[&${pseudoSelector(pseudo)}]`
}

function relationalVariant(kind: 'group' | 'peer', pseudo: PseudoLike, name: string | null): string {
  const suffix = name ? `/${name}` : ''
  if (!pseudo.arg && RELATIONAL_STATE_VARIANTS.has(pseudo.name)) {
    return `${kind}-${pseudo.name}${suffix}`
  }
  return `${kind}-[${pseudoSelector(pseudo)}]${suffix}`
}

/* ------------------------------------------------------------------ *
 *  Conversion
 * ------------------------------------------------------------------ */

/** Per-element accumulator: ordered utilities keyed by variant+property. */
interface ElementStyles {
  /** key → class string, insertion-ordered so cascade order is preserved. */
  utilities: Map<string, string>
  /** Set when some rule needs this element to act as a `group`. */
  groupName: string | null | undefined
  /** Set when some rule needs this element to act as a `peer`. */
  peerName: string | null | undefined
  /** Original classes that leftover CSS still depends on. */
  keptClasses: Set<string>
}

function emptyStyles(): ElementStyles {
  return {
    utilities: new Map(),
    groupName: undefined,
    peerName: undefined,
    keptClasses: new Set(),
  }
}

/**
 * Work out how a non-subject part of a selector relates to the subject.
 *
 * Only two relationships have a Tailwind form: an ancestor (`group`) and a
 * directly-preceding sibling (`peer`). Anything else — "peer of my
 * ancestor", most notably — returns null, and the whole rule goes to the
 * companion stylesheet instead of being approximated.
 */
function relationToSubject(
  selector: ComplexSelector,
  index: number,
): 'group' | 'peer' | null {
  const parts = selector.parts
  const lastIdx = parts.length - 1
  if (index >= lastIdx) return null

  // Sibling of the subject: must be immediately before it in the chain.
  const combinatorIntoSubject = parts[lastIdx].combinator
  if (combinatorIntoSubject === 'adjacent' || combinatorIntoSubject === 'sibling') {
    return index === lastIdx - 1 ? 'peer' : null
  }

  // Ancestor: every combinator from here down to the subject must be
  // descendant/child, otherwise this part isn't on the ancestor chain.
  for (let i = index + 1; i <= lastIdx; i++) {
    const c = parts[i].combinator
    if (c !== 'descendant' && c !== 'child') return null
  }
  return 'group'
}

export interface TailwindOptions {
  /** Used only to name the companion stylesheet in comments. */
  effectId?: string
}

export function cssToTailwind(
  html: string,
  css: string,
  options: TailwindOptions = {},
): TailwindResult {
  const roots: HtmlNode[] = parseHtml(html)
  const rootElements = roots.filter((n): n is HtmlElement => n.type === 'element')
  const elements = walkElements(roots)
  const parsed = parseCss(css)

  const styles = new Map<HtmlElement, ElementStyles>()
  const styleFor = (el: HtmlElement): ElementStyles => {
    let s = styles.get(el)
    if (!s) {
      s = emptyStyles()
      styles.set(el, s)
    }
    return s
  }

  const leftoverRules: CssRule[] = []
  const notes: string[] = []
  let totalDeclarations = 0
  let convertedDeclarations = 0

  /* Pass 1 — decide, per (rule, selector), whether it can be expressed. */

  interface Pending {
    subject: HtmlElement
    /**
     * Group/peer variant sources, already resolved to the elements they
     * bound to. The variant *string* can't be built yet: whether it needs
     * a `/name` suffix depends on how many distinct groups the whole
     * effect ends up with, which isn't known until every rule is seen.
     */
    relational: Array<{ el: HtmlElement; kind: 'group' | 'peer'; pseudo: PseudoLike }>
    /** Variants that don't depend on naming: self states, then pseudo-element. */
    selfVariants: string[]
    declarations: CssDeclaration[]
  }

  const pending: Pending[] = []
  /** Selector strings that had to fall back, for the notes. */
  const fellBack = new Set<string>()

  for (const rule of parsed.rules) {
    for (const selectorText of rule.selectors) {
      totalDeclarations += rule.declarations.length
      const selector = parseSelector(selectorText)

      // Conditional at-rules (@media/@supports) have Tailwind variants in
      // principle, but the catalog contains none — rather than ship an
      // untested breakpoint mapping, these go to the stylesheet.
      if (selector.unsupported || rule.atContext.length > 0) {
        leftoverRules.push({ ...rule, selectors: [selectorText] })
        fellBack.add(selectorText)
        continue
      }

      const parts = selector.parts
      const subjectPart = parts[parts.length - 1]

      // Work out the variant chain, bailing if any relationship is one
      // Tailwind can't name.
      const relationalPseudos: Array<{ index: number; kind: 'group' | 'peer'; pseudo: PseudoLike }> = []
      let expressible = true

      for (let i = 0; i < parts.length - 1; i++) {
        for (const state of parts[i].compound.states) {
          const kind = relationToSubject(selector, i)
          if (!kind) {
            expressible = false
            break
          }
          relationalPseudos.push({ index: i, kind, pseudo: state })
        }
        if (!expressible) break
      }

      if (!expressible) {
        leftoverRules.push({ ...rule, selectors: [selectorText] })
        fellBack.add(selectorText)
        continue
      }

      const matches = elements
        .map((el) => ({ el, bindings: matchComplex(el, selector, rootElements) }))
        .filter((m): m is { el: HtmlElement; bindings: HtmlElement[] } => m.bindings !== null)

      if (matches.length === 0) {
        // Selector matches nothing in this markup — e.g. an effect whose
        // CSS covers optional variants. Keep it as CSS so users who add
        // the markup themselves still get the styling.
        leftoverRules.push({ ...rule, selectors: [selectorText] })
        continue
      }

      convertedDeclarations += rule.declarations.length

      for (const { el, bindings } of matches) {
        const selfVariants: string[] = []
        for (const state of subjectPart.compound.states) {
          selfVariants.push(selfVariant(state))
        }
        // The pseudo-element variant goes last so it sits closest to the
        // utility: `group-hover:before:opacity-100`.
        if (subjectPart.compound.pseudoElement) {
          const pe = subjectPart.compound.pseudoElement
          selfVariants.push(PSEUDO_ELEMENT_VARIANTS.has(pe) ? pe : `[&::${pe}]`)
        }

        pending.push({
          subject: el,
          relational: relationalPseudos.map((rel) => ({
            el: bindings[rel.index],
            kind: rel.kind,
            pseudo: rel.pseudo,
          })),
          selfVariants,
          declarations: rule.declarations,
        })
      }
    }
  }

  /* Pass 2 — assign group/peer names now that all markers are known. */

  const groupElements: HtmlElement[] = []
  const peerElements: HtmlElement[] = []
  for (const p of pending) {
    for (const m of p.relational) {
      const list = m.kind === 'group' ? groupElements : peerElements
      if (!list.includes(m.el)) list.push(m.el)
    }
  }

  // A single group/peer can stay anonymous. Two or more must be named, or
  // `group-hover:` on a nested element would fire for the wrong ancestor.
  const groupName = (el: HtmlElement): string | null =>
    groupElements.length > 1 ? `g${groupElements.indexOf(el) + 1}` : null
  const peerName = (el: HtmlElement): string | null =>
    peerElements.length > 1 ? `p${peerElements.indexOf(el) + 1}` : null

  for (const el of groupElements) {
    const s = styleFor(el)
    s.groupName = groupName(el)
  }
  for (const el of peerElements) {
    const s = styleFor(el)
    s.peerName = peerName(el)
  }

  /* Pass 3 — attach utilities. */

  for (const p of pending) {
    const variants = [
      ...p.relational.map((r) =>
        relationalVariant(
          r.kind,
          r.pseudo,
          r.kind === 'group' ? groupName(r.el) : peerName(r.el),
        ),
      ),
      ...p.selfVariants,
    ]
    const variantPrefix = variants.length ? variants.join(':') + ':' : ''

    const s = styleFor(p.subject)
    for (const decl of p.declarations) {
      for (const utility of declarationToUtilities(decl)) {
        // Key on variant + property + utility slot, so a later rule
        // overrides an earlier one in place (matching the cascade) while
        // keeping genuinely distinct utilities apart. Property is part of
        // the key because `color` and `font-size` share the `text-` slot.
        s.utilities.set(
          `${variantPrefix}|${decl.prop}|${utilitySlot(utility)}`,
          `${variantPrefix}${utility}`,
        )
      }
    }
  }

  return finalize({
    roots,
    elements,
    styles,
    styleFor,
    leftoverRules,
    parsed,
    notes,
    fellBack,
    totalDeclarations,
    convertedDeclarations,
    options,
  })
}

/* ------------------------------------------------------------------ *
 *  Output assembly
 * ------------------------------------------------------------------ */

interface FinalizeInput {
  roots: HtmlNode[]
  elements: HtmlElement[]
  styles: Map<HtmlElement, ElementStyles>
  styleFor: (el: HtmlElement) => ElementStyles
  leftoverRules: CssRule[]
  parsed: ReturnType<typeof parseCss>
  notes: string[]
  fellBack: Set<string>
  totalDeclarations: number
  convertedDeclarations: number
  options: TailwindOptions
}

function finalize(input: FinalizeInput): TailwindResult {
  const {
    roots, elements, styles, styleFor, leftoverRules,
    parsed, notes, fellBack, totalDeclarations, convertedDeclarations, options,
  } = input

  /* Which original class names must survive for the leftover CSS? */
  const neededClasses = new Set<string>()
  for (const rule of leftoverRules) {
    for (const selectorText of rule.selectors) {
      for (const m of selectorText.matchAll(/\.([-\w]+)/g)) {
        neededClasses.add(m[1])
      }
    }
  }

  for (const el of elements) {
    const s = styleFor(el)
    for (const c of classList(el)) {
      if (neededClasses.has(c)) s.keptClasses.add(c)
    }
  }

  /* Build the final class attribute for each element. */
  const classOverride = (el: HtmlElement): string | undefined => {
    const s = styles.get(el)
    if (!s) return classList(el).filter((c) => neededClasses.has(c)).join(' ')

    const out: string[] = []
    if (s.groupName !== undefined) out.push(s.groupName ? `group/${s.groupName}` : 'group')
    if (s.peerName !== undefined) out.push(s.peerName ? `peer/${s.peerName}` : 'peer')
    out.push(...s.keptClasses)
    out.push(...s.utilities.values())
    return out.join(' ')
  }

  const markup = renderMarkup(roots, { classOverride })

  /* Companion stylesheet: keyframes first, then leftover rules. */
  const cssParts: string[] = []
  for (const block of parsed.atBlocks) {
    cssParts.push(atBlockToCss(block))
  }
  for (const statement of parsed.statements) {
    cssParts.push(`${statement};`)
  }
  for (const rule of leftoverRules) {
    cssParts.push(ruleToCss(rule))
  }

  /* Honest notes. */
  if (parsed.atBlocks.some((b) => b.name === 'keyframes')) {
    notes.push(
      'Keyframes have no class equivalent, so they live in the companion stylesheet. Import it once (or paste the @keyframes into your global CSS) and the animate-[…] utilities will resolve.',
    )
  }
  if (fellBack.size > 0) {
    notes.push(
      `${fellBack.size} selector${fellBack.size === 1 ? '' : 's'} could not be expressed as utilities and stayed in the companion stylesheet (${[...fellBack].slice(0, 3).join(', ')}${fellBack.size > 3 ? ', …' : ''}). The original class names those rules target are preserved in the markup, so the result still renders correctly.`,
    )
  }
  const usesPeer = [...styles.values()].some((s) => s.peerName !== undefined)
  if (usesPeer) {
    notes.push(
      "Tailwind's peer-* variants compile to the general sibling combinator (~) where the source CSS used the adjacent one (+). For this markup the matched elements are the same, but keep it in mind if you add siblings.",
    )
  }
  notes.push(
    'Arbitrary values must appear as complete literal strings for Tailwind to detect them — do not build these class names by concatenation.',
  )

  const header = options.effectId
    ? `/* Companion styles for the "${options.effectId}" effect.\n   Everything else is expressed as Tailwind utilities in the markup. */\n\n`
    : ''

  return {
    markup,
    css: cssParts.length ? header + cssParts.join('\n\n') + '\n' : '',
    notes,
    coverage: totalDeclarations === 0 ? 1 : Math.min(1, convertedDeclarations / totalDeclarations),
  }
}
