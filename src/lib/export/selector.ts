/**
 * CSS selector parsing and static matching.
 *
 * The Tailwind exporter rests on one observation: an effect's markup is
 * known at export time. So most of a selector doesn't need a runtime
 * equivalent at all — `.card .title`, `span:nth-child(2)`, `.row:last-child`
 * can simply be *resolved* against the parsed tree, and their declarations
 * attached to the elements they hit.
 *
 * Only the parts that vary at runtime need to survive as Tailwind
 * variants: state pseudo-classes (`:hover`, `:checked`, `:focus`) and
 * pseudo-elements (`::before`, `::after`). That split — structural
 * resolved statically, state kept as variants — is what makes the output
 * read like hand-written Tailwind instead of a wall of arbitrary
 * selectors.
 *
 * Supported: type/class/id/attribute selectors, `*`, the four combinators,
 * the common structural and state pseudo-classes, and `:not(...)`.
 * Anything outside that marks the selector `unsupported`, and the caller
 * falls back to emitting plain CSS for that rule rather than guessing.
 */

import {
  type HtmlElement,
  classList,
  elementChildren,
  getAttr,
} from './html-parse'

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */

export interface PseudoRef {
  name: string
  /** Raw contents of `(...)`, or null. */
  arg: string | null
}

export interface AttrSelector {
  name: string
  /** One of `=`, `~=`, `|=`, `^=`, `$=`, `*=`, or null for presence-only. */
  op: string | null
  value: string | null
}

export interface CompoundSelector {
  tag: string | null
  id: string | null
  classes: string[]
  attrs: AttrSelector[]
  /** Resolvable against static markup. */
  structural: PseudoRef[]
  /** Runtime state — becomes a Tailwind variant. */
  states: PseudoRef[]
  /** `before`, `after`, `placeholder`, … without colons. */
  pseudoElement: string | null
}

export type Combinator = 'descendant' | 'child' | 'adjacent' | 'sibling'

export interface SelectorPart {
  /** Combinator joining this compound to the one before it; null on the first. */
  combinator: Combinator | null
  compound: CompoundSelector
}

export interface ComplexSelector {
  parts: SelectorPart[]
  /** Set when parsing hit syntax we refuse to guess at. */
  unsupported: boolean
  /** The original text, for diagnostics and CSS fallback. */
  source: string
}

/* ------------------------------------------------------------------ *
 *  Pseudo-class classification
 * ------------------------------------------------------------------ */

/** Pseudo-classes that depend on runtime state. */
export const STATE_PSEUDOS = new Set([
  'hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited',
  'target', 'checked', 'indeterminate', 'disabled', 'enabled', 'required',
  'optional', 'valid', 'invalid', 'in-range', 'out-of-range',
  'placeholder-shown', 'read-only', 'read-write', 'autofill', 'default',
  'link', 'any-link', 'user-invalid', 'user-valid', 'open',
])

/** Pseudo-classes decidable from the static tree. */
export const STRUCTURAL_PSEUDOS = new Set([
  'first-child', 'last-child', 'only-child', 'nth-child', 'nth-last-child',
  'first-of-type', 'last-of-type', 'only-of-type', 'nth-of-type',
  'nth-last-of-type', 'empty', 'root', 'scope',
])

/* ------------------------------------------------------------------ *
 *  Parsing
 * ------------------------------------------------------------------ */

function emptyCompound(): CompoundSelector {
  return {
    tag: null,
    id: null,
    classes: [],
    attrs: [],
    structural: [],
    states: [],
    pseudoElement: null,
  }
}

/** Read a balanced `(...)` starting at `i` (which points at `(`). */
function readParen(src: string, i: number): { arg: string; end: number } {
  let depth = 0
  let quote: string | null = null
  for (let j = i; j < src.length; j++) {
    const ch = src[j]
    if (quote) {
      if (ch === '\\') j++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return { arg: src.slice(i + 1, j), end: j + 1 }
    }
  }
  return { arg: src.slice(i + 1), end: src.length }
}

/**
 * Characters valid inside a CSS identifier: `-`, `_`, alphanumerics,
 * escapes, and any non-ASCII codepoint. Deliberately excludes `.`, `#`,
 * `:`, `[`, and whitespace so the scanner stops at the next simple
 * selector instead of swallowing the rest of the compound.
 */
function isIdentChar(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return (
    ch === '-' ||
    ch === '_' ||
    ch === '\\' ||
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code >= 0xa0
  )
}

/**
 * Parse one complex selector (no commas — split the list first).
 */
export function parseSelector(source: string): ComplexSelector {
  const src = source.trim()
  const parts: SelectorPart[] = []
  let unsupported = false

  let compound = emptyCompound()
  let compoundStarted = false
  let pendingCombinator: Combinator | null = null
  let isFirst = true

  const flush = () => {
    if (!compoundStarted) return
    parts.push({ combinator: isFirst ? null : (pendingCombinator ?? 'descendant'), compound })
    isFirst = false
    compound = emptyCompound()
    compoundStarted = false
    pendingCombinator = null
  }

  let i = 0
  while (i < src.length) {
    const ch = src[i]

    // ---- combinators ----
    if (/\s/.test(ch)) {
      let j = i
      while (j < src.length && /\s/.test(src[j])) j++
      // A combinator symbol may follow the whitespace.
      const next = src[j]
      if (next === '>' || next === '+' || next === '~') {
        // handled on the next loop iteration
        i = j
        continue
      }
      if (j < src.length && compoundStarted) {
        flush()
        pendingCombinator = 'descendant'
      }
      i = j
      continue
    }

    if (ch === '>' || ch === '+' || ch === '~') {
      if (compoundStarted) flush()
      pendingCombinator = ch === '>' ? 'child' : ch === '+' ? 'adjacent' : 'sibling'
      i++
      continue
    }

    // ---- simple selectors ----
    compoundStarted = true

    if (ch === '.') {
      let j = i + 1
      while (j < src.length && isIdentChar(src[j])) j++
      compound.classes.push(src.slice(i + 1, j))
      i = j
      continue
    }

    if (ch === '#') {
      let j = i + 1
      while (j < src.length && isIdentChar(src[j])) j++
      compound.id = src.slice(i + 1, j)
      i = j
      continue
    }

    if (ch === '*') {
      compound.tag = compound.tag ?? null // universal — no constraint
      i++
      continue
    }

    if (ch === '[') {
      const close = src.indexOf(']', i)
      const body = src.slice(i + 1, close === -1 ? src.length : close)
      const m = /^\s*([-\w]+)\s*(?:([~|^$*]?=)\s*(.+?)\s*)?$/.exec(body)
      if (m) {
        const rawValue = m[3]
        const value = rawValue
          ? rawValue.replace(/^["']|["']$/g, '')
          : null
        compound.attrs.push({ name: m[1], op: m[2] ?? null, value })
      } else {
        unsupported = true
      }
      i = close === -1 ? src.length : close + 1
      continue
    }

    if (ch === ':') {
      const isDouble = src[i + 1] === ':'
      let j = i + (isDouble ? 2 : 1)
      const nameStart = j
      while (j < src.length && isIdentChar(src[j])) j++
      const name = src.slice(nameStart, j).toLowerCase()

      let arg: string | null = null
      if (src[j] === '(') {
        const read = readParen(src, j)
        arg = read.arg.trim()
        j = read.end
      }

      // `::before` and the legacy single-colon `:before` are both
      // pseudo-elements; everything else with one colon is a class.
      const isPseudoElement =
        isDouble || name === 'before' || name === 'after' ||
        name === 'first-line' || name === 'first-letter'

      if (isPseudoElement) {
        compound.pseudoElement = name
      } else if (name === 'not' || name === 'is' || name === 'where' || name === 'has') {
        // Classify by what's inside: `:not(:placeholder-shown)` is state,
        // `:not(.first)` is structural. `:has()` has no static answer for
        // state arguments, so it stays a variant either way.
        const inner = arg ?? ''
        const mentionsState = [...STATE_PSEUDOS].some((s) =>
          new RegExp(`:${s}\\b`).test(inner),
        )
        if (mentionsState || name === 'has') compound.states.push({ name, arg })
        else compound.structural.push({ name, arg })
      } else if (STATE_PSEUDOS.has(name)) {
        compound.states.push({ name, arg })
      } else if (STRUCTURAL_PSEUDOS.has(name)) {
        compound.structural.push({ name, arg })
      } else {
        // Unknown pseudo-class: keep it as a state variant rather than
        // silently dropping a constraint.
        compound.states.push({ name, arg })
      }

      i = j
      continue
    }

    if (isIdentChar(ch)) {
      let j = i
      while (j < src.length && isIdentChar(src[j])) j++
      compound.tag = src.slice(i, j).toLowerCase()
      i = j
      continue
    }

    // Anything else (`&`, `/deep/`, …) — bail out.
    unsupported = true
    i++
  }

  flush()

  if (parts.length === 0) unsupported = true

  return { parts, unsupported, source }
}

/* ------------------------------------------------------------------ *
 *  Static matching
 * ------------------------------------------------------------------ */

/** Parent, treating the parser's synthetic `#root` as "no parent". */
function realParent(el: HtmlElement): HtmlElement | null {
  const p = el.parent
  if (!p || p.tag === '#root') return null
  return p
}

/** Siblings among element nodes, including `el` itself. */
function siblingsOf(el: HtmlElement, roots: HtmlElement[]): HtmlElement[] {
  const p = el.parent
  if (!p) return roots
  return elementChildren(p)
}

function attrMatches(el: HtmlElement, sel: AttrSelector): boolean {
  const raw = getAttr(el, sel.name)
  if (raw === undefined) return false
  if (sel.op === null) return true
  const value = raw ?? ''
  const target = sel.value ?? ''
  switch (sel.op) {
    case '=': return value === target
    case '~=': return value.split(/\s+/).includes(target)
    case '|=': return value === target || value.startsWith(target + '-')
    case '^=': return value.startsWith(target)
    case '$=': return value.endsWith(target)
    case '*=': return value.includes(target)
    default: return false
  }
}

/** Parse an `An+B` micro-syntax argument. Returns null when unsupported. */
function parseNth(arg: string): { a: number; b: number } | null {
  const text = arg.trim().toLowerCase()
  if (text === 'odd') return { a: 2, b: 1 }
  if (text === 'even') return { a: 2, b: 0 }
  const m = /^([+-]?\d*)n\s*([+-]\s*\d+)?$/.exec(text.replace(/\s+/g, ''))
  if (m) {
    const aRaw = m[1]
    const a = aRaw === '' || aRaw === '+' ? 1 : aRaw === '-' ? -1 : parseInt(aRaw, 10)
    const b = m[2] ? parseInt(m[2].replace(/\s+/g, ''), 10) : 0
    return { a, b }
  }
  if (/^[+-]?\d+$/.test(text)) return { a: 0, b: parseInt(text, 10) }
  return null
}

function nthMatches(index1: number, arg: string): boolean {
  const nth = parseNth(arg)
  if (!nth) return false
  const { a, b } = nth
  if (a === 0) return index1 === b
  const n = (index1 - b) / a
  return Number.isInteger(n) && n >= 0
}

function structuralMatches(
  el: HtmlElement,
  pseudo: PseudoRef,
  roots: HtmlElement[],
): boolean {
  const sibs = siblingsOf(el, roots)
  const idx = sibs.indexOf(el)
  const sameType = sibs.filter((s) => s.tag === el.tag)
  const typeIdx = sameType.indexOf(el)

  switch (pseudo.name) {
    case 'first-child': return idx === 0
    case 'last-child': return idx === sibs.length - 1
    case 'only-child': return sibs.length === 1
    case 'first-of-type': return typeIdx === 0
    case 'last-of-type': return typeIdx === sameType.length - 1
    case 'only-of-type': return sameType.length === 1
    case 'nth-child': return nthMatches(idx + 1, pseudo.arg ?? '')
    case 'nth-last-child': return nthMatches(sibs.length - idx, pseudo.arg ?? '')
    case 'nth-of-type': return nthMatches(typeIdx + 1, pseudo.arg ?? '')
    case 'nth-last-of-type': return nthMatches(sameType.length - typeIdx, pseudo.arg ?? '')
    case 'empty': return el.children.every((c) => c.type === 'text' && !c.value.trim())
    case 'root': return realParent(el) === null
    case 'scope': return true
    case 'not': {
      if (!pseudo.arg) return true
      return !pseudo.arg
        .split(',')
        .some((s) => matchCompoundStatic(el, parseSelector(s).parts[0]?.compound, roots))
    }
    case 'is':
    case 'where': {
      if (!pseudo.arg) return true
      return pseudo.arg
        .split(',')
        .some((s) => matchCompoundStatic(el, parseSelector(s).parts[0]?.compound, roots))
    }
    default:
      return false
  }
}

/**
 * Does `el` satisfy the static parts of `compound`? State pseudo-classes
 * and pseudo-elements are deliberately treated as always-true here — they
 * are carried out as Tailwind variants instead of filtering the match.
 */
export function matchCompoundStatic(
  el: HtmlElement,
  compound: CompoundSelector | undefined,
  roots: HtmlElement[],
): boolean {
  if (!compound) return false
  if (compound.tag && compound.tag !== el.tag) return false
  if (compound.id && getAttr(el, 'id') !== compound.id) return false

  if (compound.classes.length) {
    const classes = classList(el)
    for (const c of compound.classes) {
      if (!classes.includes(c)) return false
    }
  }

  for (const attr of compound.attrs) {
    if (!attrMatches(el, attr)) return false
  }

  for (const pseudo of compound.structural) {
    if (!structuralMatches(el, pseudo, roots)) return false
  }

  return true
}

/**
 * Match a complex selector against `el` as the subject, returning the
 * element bound to each part (same length/order as `selector.parts`), or
 * null when it doesn't match.
 *
 * The bindings matter: they tell the Tailwind exporter *which* ancestor
 * needs a `group` class for a `.card:hover .title` rule, and which sibling
 * needs `peer`.
 */
export function matchComplex(
  el: HtmlElement,
  selector: ComplexSelector,
  roots: HtmlElement[],
): HtmlElement[] | null {
  const parts = selector.parts
  if (!parts.length) return null

  const bindings: HtmlElement[] = new Array(parts.length)

  const step = (idx: number, candidate: HtmlElement): boolean => {
    if (!matchCompoundStatic(candidate, parts[idx].compound, roots)) return false
    bindings[idx] = candidate
    if (idx === 0) return true

    const combinator = parts[idx].combinator ?? 'descendant'

    if (combinator === 'child') {
      const parent = realParent(candidate)
      return parent ? step(idx - 1, parent) : false
    }

    if (combinator === 'descendant') {
      let ancestor = realParent(candidate)
      while (ancestor) {
        if (step(idx - 1, ancestor)) return true
        ancestor = realParent(ancestor)
      }
      return false
    }

    const sibs = siblingsOf(candidate, roots)
    const myIdx = sibs.indexOf(candidate)
    if (myIdx <= 0) return false

    if (combinator === 'adjacent') {
      return step(idx - 1, sibs[myIdx - 1])
    }

    // General sibling: try each preceding sibling, nearest first.
    for (let k = myIdx - 1; k >= 0; k--) {
      if (step(idx - 1, sibs[k])) return true
    }
    return false
  }

  return step(parts.length - 1, el) ? bindings : null
}
