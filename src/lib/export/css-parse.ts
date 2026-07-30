/**
 * A minimal CSS block parser.
 *
 * Enough to take an effect's stylesheet apart into rules, declarations,
 * and at-blocks so the Tailwind converter can reason about it and the
 * styled-components converter can hoist `@keyframes`. It is not a spec
 * parser — no custom-property fallback semantics, no error recovery
 * ceremony — but it is brace-, string-, and comment-aware, which is all
 * the catalog's CSS requires (verified: the only at-rule in any of the
 * 1,616 effects is `@keyframes`).
 *
 * Everything degrades gracefully: unparseable input comes back as zero
 * rules, and every caller falls back to shipping the raw CSS unchanged.
 */

export interface CssDeclaration {
  prop: string
  value: string
  important: boolean
}

export interface CssRule {
  /** Comma-separated selectors, already split and trimmed. */
  selectors: string[]
  declarations: CssDeclaration[]
  /**
   * Enclosing conditional at-rules, outermost first — e.g.
   * `['@media (min-width: 768px)']`. Empty for top-level rules.
   */
  atContext: string[]
}

export interface CssAtBlock {
  /** Lowercased at-rule name without the `@`, e.g. `keyframes`. */
  name: string
  /** The prelude after the name, e.g. `fx-pulse`. */
  params: string
  /** Raw body between the braces, verbatim. */
  body: string
}

export interface ParsedCss {
  rules: CssRule[]
  /** Non-conditional at-rules kept whole: keyframes, font-face, property. */
  atBlocks: CssAtBlock[]
  /** Statement at-rules with no block, e.g. `@import url(...)`. */
  statements: string[]
}

/** At-rules that wrap other rules and so are recursed into, not kept raw. */
const CONDITIONAL_AT_RULES = new Set(['media', 'supports', 'container', 'layer', 'scope'])

/** Strip comments without disturbing string literals (e.g. `content: "/*"`). */
export function stripComments(css: string): string {
  let out = ''
  let i = 0
  let quote: string | null = null

  while (i < css.length) {
    const ch = css[i]

    if (quote) {
      out += ch
      if (ch === '\\') {
        // Escape sequence — copy the next char verbatim.
        if (i + 1 < css.length) out += css[i + 1]
        i += 2
        continue
      }
      if (ch === quote) quote = null
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      out += ch
      i++
      continue
    }

    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 2
      continue
    }

    out += ch
    i++
  }

  return out
}

/**
 * Split a comma-separated selector list, ignoring commas nested inside
 * parentheses (`:not(.a, .b)`) or strings (`[title="a,b"]`).
 */
export function splitSelectorList(selector: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote: string | null = null
  let buf = ''

  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]

    if (quote) {
      buf += ch
      if (ch === '\\' && i + 1 < selector.length) {
        buf += selector[++i]
      } else if (ch === quote) {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      buf += ch
      continue
    }
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--

    if (ch === ',' && depth === 0) {
      out.push(buf.trim())
      buf = ''
      continue
    }
    buf += ch
  }

  if (buf.trim()) out.push(buf.trim())
  return out.filter(Boolean)
}

/**
 * Split a declaration block into `prop: value` pairs. Semicolon-aware in
 * the same way as above so `background: url(a;b)` and
 * `grid-template-areas: "a b"` survive.
 */
export function parseDeclarations(body: string): CssDeclaration[] {
  const out: CssDeclaration[] = []
  let depth = 0
  let quote: string | null = null
  let buf = ''

  const flush = () => {
    const text = buf.trim()
    buf = ''
    if (!text) return
    const colon = findTopLevelColon(text)
    if (colon === -1) return
    const prop = text.slice(0, colon).trim()
    let value = text.slice(colon + 1).trim()
    if (!prop || !value) return
    let important = false
    const bang = /!\s*important\s*$/i
    if (bang.test(value)) {
      important = true
      value = value.replace(bang, '').trim()
    }
    out.push({ prop, value, important })
  }

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]

    if (quote) {
      buf += ch
      if (ch === '\\' && i + 1 < body.length) buf += body[++i]
      else if (ch === quote) quote = null
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      buf += ch
      continue
    }
    if (ch === '(') depth++
    if (ch === ')') depth--

    if (ch === ';' && depth === 0) {
      flush()
      continue
    }
    buf += ch
  }
  flush()

  return out
}

/** Index of the `prop`/`value` separator, skipping `(`…`)` and strings. */
function findTopLevelColon(text: string): number {
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ':' && depth === 0) return i
  }
  return -1
}

/**
 * Find the index of the `}` matching the `{` at `open`, respecting nested
 * braces and strings. Returns `css.length` when unbalanced.
 */
function matchBrace(css: string, open: number): number {
  let depth = 0
  let quote: string | null = null
  for (let i = open; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return css.length
}

/**
 * Parse a stylesheet into rules + at-blocks.
 */
export function parseCss(css: string): ParsedCss {
  const result: ParsedCss = { rules: [], atBlocks: [], statements: [] }
  parseInto(stripComments(css), [], result)
  return result
}

function parseInto(css: string, atContext: string[], out: ParsedCss): void {
  let i = 0

  while (i < css.length) {
    // Skip whitespace and stray semicolons between rules.
    while (i < css.length && /[\s;]/.test(css[i])) i++
    if (i >= css.length) break

    const braceIdx = indexOfTopLevelBrace(css, i)

    // At-rule with no block, e.g. `@import "x";`
    if (braceIdx === -1) {
      const rest = css.slice(i).trim()
      if (rest.startsWith('@')) out.statements.push(rest.replace(/;$/, ''))
      break
    }

    const prelude = css.slice(i, braceIdx).trim()
    const closeIdx = matchBrace(css, braceIdx)
    const body = css.slice(braceIdx + 1, closeIdx)

    // A `;` before the `{` means the at-rule was a statement, not a block.
    const semi = prelude.indexOf(';')
    if (semi !== -1) {
      const statement = prelude.slice(0, semi).trim()
      if (statement.startsWith('@')) out.statements.push(statement)
      i = i + semi + 1
      continue
    }

    if (prelude.startsWith('@')) {
      const match = /^@([a-zA-Z-]+)\s*([\s\S]*)$/.exec(prelude)
      const name = (match?.[1] ?? '').toLowerCase()
      const params = (match?.[2] ?? '').trim()

      if (CONDITIONAL_AT_RULES.has(name)) {
        parseInto(body, [...atContext, `@${name}${params ? ` ${params}` : ''}`], out)
      } else {
        out.atBlocks.push({ name, params, body: body.trim() })
      }
    } else {
      const declarations = parseDeclarations(body)
      const selectors = splitSelectorList(prelude)
      if (selectors.length && declarations.length) {
        out.rules.push({ selectors, declarations, atContext })
      }
    }

    i = closeIdx + 1
  }
}

/** First `{` not inside a string. */
function indexOfTopLevelBrace(css: string, from: number): number {
  let quote: string | null = null
  for (let i = from; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '{') return i
  }
  return -1
}

/* ------------------------------------------------------------------ *
 *  Serialization
 * ------------------------------------------------------------------ */

export function declarationsToCss(
  declarations: CssDeclaration[],
  indent = '  ',
): string {
  return declarations
    .map((d) => `${indent}${d.prop}: ${d.value}${d.important ? ' !important' : ''};`)
    .join('\n')
}

export function ruleToCss(rule: CssRule, indent = ''): string {
  const head = `${indent}${rule.selectors.join(',\n' + indent)} {`
  return `${head}\n${declarationsToCss(rule.declarations, indent + '  ')}\n${indent}}`
}

export function atBlockToCss(block: CssAtBlock, indent = ''): string {
  const head = `${indent}@${block.name}${block.params ? ` ${block.params}` : ''} {`
  const body = block.body
    .split('\n')
    .map((line) => (line.trim() ? `${indent}  ${line.trim()}` : ''))
    .filter(Boolean)
    .join('\n')
  return `${head}\n${body}\n${indent}}`
}

/**
 * Every `@keyframes` name defined in a stylesheet. Used by the
 * styled-components exporter (to hoist them into `keyframes` helpers) and
 * the Tailwind exporter (which has to leave them in a real CSS file).
 */
export function keyframeNames(parsed: ParsedCss): string[] {
  return parsed.atBlocks
    .filter((b) => b.name === 'keyframes' || b.name.endsWith('keyframes'))
    .map((b) => b.params.trim())
    .filter(Boolean)
}
