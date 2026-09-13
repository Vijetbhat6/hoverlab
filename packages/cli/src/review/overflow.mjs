/**
 * Absolutely positioned descendants escaping a horizontal scroll container.
 *
 * ── WHY THIS MATTERS ────────────────────────────────────────────────────
 *
 * `overflow-x-auto` only clips an absolutely positioned descendant when the
 * scroll container is ALSO that descendant's containing block — that is,
 * when it is itself positioned. A static one does not establish a
 * containing block, so the descendant resolves against some ancestor
 * further up, lays out at its static position, and is painted wherever that
 * happens to be. The scroller clips nothing.
 *
 * Tailwind's `sr-only` is `position: absolute`. So a screen-reader label in
 * a right-hand table cell, inside a static `overflow-x-auto` wrapper whose
 * table is wider than its box, escapes the scroller and pushes the document
 * out — giving the whole PAGE a horizontal scrollbar on a phone, pointing
 * at nothing a sighted visitor can see. The table was always clipped
 * correctly. The screen-reader text was not.
 *
 * This is not hypothetical. Found in seven components at once: six scrolled
 * a real page sideways, with a kanban board putting assignee names at 959px
 * and a testimonial carousel putting ratings at 1042px, on a 390px screen.
 * The fix is one word — `relative` on the scroller — and the bug is
 * invisible to everyone who is not using a screen reader on a phone.
 *
 * ── WHY IT IS A TEXT WALK AND NOT AN AST ────────────────────────────────
 *
 * The version of this that runs inside our own build parses with the
 * TypeScript compiler, because that build already pays for it. This package
 * is dependency-free on purpose, so the nesting is tracked here by hand.
 *
 * That is a real trade and it is worth naming: a hand-rolled walk can lose
 * its place on malformed JSX in a way a parser cannot. The mitigations are
 * that tags are read with the brace- and quote-aware walk in `jsx.mjs`
 * rather than a regex, and that an unmatched closing tag unwinds to the
 * nearest matching frame instead of corrupting the stack. What it cannot
 * see is a scroller or an `sr-only` whose class arrives through a prop or a
 * `cn()` call on a variable — the same blind spot the AST version has, for
 * the same reason: a scroll container whose positioning depends on a
 * caller's prop is not something to rely on either way.
 */

import { lineAt, maskComments, openingTag } from './jsx.mjs'

/**
 * Utilities that make a box SCROLL on the inline axis.
 *
 * `overflow-hidden` is deliberately not here. A clipping card whose content
 * fits has nothing laying out beyond its edge, so nothing escapes and
 * nothing moves — including it reported 28 decorative cards and buried the
 * eight real findings. The bug needs content wider than the box, and that
 * is what a scroller is for.
 */
const SCROLLS = /(^|\s)(overflow-auto|overflow-x-auto|overflow-x-scroll|overflow-scroll)(\s|$)/

/** Utilities that make a box a containing block for abspos descendants. */
const POSITIONED = /(^|\s)(relative|absolute|fixed|sticky)(\s|$)/

/** Utilities whose computed position is absolute. `sr-only` is the sneaky one. */
const ABSOLUTE = /(^|\s)(absolute|sr-only)(\s|$)/

/**
 * Every static class string inside an expression.
 *
 * Three forms all appear on a real `className`, and all three have to be
 * read or the rule goes blind on a subset of code:
 *
 *   cn("a", open && "b")          quoted literals
 *   `a ${x} b`                    a template's static text
 *   `${open ? "relative" : ""} c` literals nested inside an interpolation
 *
 * The third is why this recurses rather than matching quotes with a regex.
 * A regex scanning for quoted strings meets the backtick first, consumes
 * the whole template as one literal, and hands back `a ${x} b` — with the
 * variable name `x` sitting in the result as though it were a class. That
 * is how a component whose wrapper is named `relative` would silently
 * suppress a finding.
 *
 * An interpolated VALUE is deliberately not guessed at — only literals the
 * source actually contains. A conditional `relative` is treated as present,
 * which errs towards silence, and that is the right direction: a scroll
 * container whose positioning depends on a caller's prop is not something
 * to rely on either way, so the honest move is not to accuse it.
 */
function literalsIn(expression) {
  const parts = []
  let i = 0

  const closingQuote = (from, quote) => {
    for (let j = from + 1; j < expression.length; j++) {
      if (expression[j] === '\\') j++
      else if (expression[j] === quote) return j
    }
    return expression.length
  }

  const closingBrace = (from) => {
    let depth = 0
    for (let j = from; j < expression.length; j++) {
      if (expression[j] === '{') depth++
      else if (expression[j] === '}') {
        depth--
        if (depth === 0) return j
      }
    }
    return expression.length
  }

  while (i < expression.length) {
    const ch = expression[i]

    if (ch === '"' || ch === "'") {
      const end = closingQuote(i, ch)
      parts.push(expression.slice(i + 1, end))
      i = end + 1
      continue
    }

    if (ch === '`') {
      i++
      let text = ''
      while (i < expression.length && expression[i] !== '`') {
        if (expression[i] === '\\') {
          i += 2
          continue
        }
        if (expression[i] === '$' && expression[i + 1] === '{') {
          const end = closingBrace(i + 1)
          parts.push(...literalsIn(expression.slice(i + 2, end)))
          i = end + 1
          continue
        }
        text += expression[i]
        i++
      }
      parts.push(text)
      i++
      continue
    }

    i++
  }

  return parts
}

/**
 * The literal class text on one opening tag.
 *
 * `className` is often a template literal or a `cn(...)` call, so every
 * static class string inside the attribute is collected and joined.
 */
export function classesOfTag(tag) {
  const at = tag.search(/\bclassName\s*=/)
  if (at === -1) return ''

  const rest = tag.slice(at)
  const eq = rest.indexOf('=')
  let i = eq + 1
  while (i < rest.length && /\s/.test(rest[i])) i++

  const parts = []

  if (rest[i] === '"' || rest[i] === "'") {
    const quote = rest[i]
    const end = rest.indexOf(quote, i + 1)
    if (end !== -1) parts.push(rest.slice(i + 1, end))
  } else if (rest[i] === '{') {
    // Walk to the matching brace, then take every string literal inside.
    let depth = 0
    let quote = null
    let end = rest.length
    for (let j = i; j < rest.length; j++) {
      const ch = rest[j]
      if (quote) {
        if (ch === '\\') j++
        else if (ch === quote) quote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = j
          break
        }
      }
    }
    parts.push(...literalsIn(rest.slice(i + 1, end)))
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Every JSX element in a source, as a flat list with its ancestor chain.
 *
 * Fragments are not tracked — they carry no className, so they cannot be a
 * scroller or an escapee, and skipping them keeps the stack honest.
 *
 * @returns {{ name: string, classes: string, index: number, ancestors: { name: string, classes: string, index: number }[] }[]}
 */
export function walkElements(source) {
  const elements = []
  const stack = []

  const token = /<\/?([a-zA-Z][\w.]*)(?=[\s/>])/g

  for (const match of source.matchAll(token)) {
    const name = match[1]
    const closing = match[0][1] === '/'

    if (closing) {
      // Unwind to the nearest frame with this name. An unmatched close
      // leaves the stack alone rather than popping something unrelated.
      const at = stack.map((f) => f.name).lastIndexOf(name)
      if (at !== -1) stack.length = at
      continue
    }

    const tag = openingTag(source, match.index)
    if (tag === null) continue

    const frame = { name, classes: classesOfTag(tag), index: match.index }
    elements.push({ ...frame, ancestors: [...stack] })

    if (!/\/>\s*$/.test(tag)) stack.push(frame)
  }

  return elements
}

/** @returns {object[]} */
export function reviewOverflow(source) {
  const code = maskComments(source)
  const findings = []

  for (const element of walkElements(code)) {
    if (!ABSOLUTE.test(element.classes)) continue

    // A <caption> is always first and always at the start edge.
    if (element.name === 'caption') continue

    /*
      Walk outwards. The first positioned ancestor shields everything below
      it — it becomes the containing block, so the descendant resolves
      inside the scroller and is clipped correctly. The first unpositioned
      scroller reached before any of those is the one leaking.
    */
    for (let i = element.ancestors.length - 1; i >= 0; i--) {
      const ancestor = element.ancestors[i]
      if (POSITIONED.test(ancestor.classes)) break

      if (SCROLLS.test(ancestor.classes)) {
        const escapee = element.classes.includes('sr-only') ? 'sr-only text' : 'absolute box'
        findings.push({
          rule: 'abspos-escapes-scroller',
          family: 'overflow',
          sc: '1.4.10',
          severity: 'violation',
          line: lineAt(code, element.index),
          message:
            `<${element.name}> is an ${escapee} inside a <${ancestor.name}> that scrolls ` +
            'horizontally but is not positioned, so it is not clipped by it',
          fix:
            `Add \`relative\` to the <${ancestor.name}> carrying ` +
            `"${ancestor.classes.slice(0, 40)}". A static scroll container is not a ` +
            'containing block, so this box lays out against an ancestor further up and ' +
            'gets painted outside the scroller — which scrolls the whole page sideways ' +
            'on a phone, pointing at nothing anyone can see.',
        })
        break
      }
    }
  }

  return findings
}
