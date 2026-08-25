/**
 * CSS text → the nested object shadcn's registry `css` field expects.
 *
 * WHY THIS EXISTS
 *
 * Blocks and pages map onto a shadcn registry item losslessly: they are
 * files, and the schema takes files. Effects are not files — they are a
 * class and the rules behind it — and the only place the schema has for
 * that is `css`, which is "CSS definitions to be added to the project's CSS
 * file" expressed as a recursive object of selectors, at-rules and
 * declarations. Getting an effect onto the rail therefore means turning
 * hand-written CSS text into that object, which is this module.
 *
 * It was deliberately deferred when the registry was first built, on the
 * grounds that a CSS-to-AST conversion is a separate job with its own
 * failure modes. It is, and this is that job. What made it tractable is
 * that the corpus was measured first rather than assumed: across 771
 * generated effects there are exactly two block at-rules in use
 * (`@keyframes`, 338 of them, and `@property`, 3), no native `&` nesting at
 * all, and four files carrying comments. So this is not a general CSS
 * parser and does not pretend to be — see WHAT THIS IS NOT.
 *
 * WHY NOT A LIBRARY
 *
 * postcss is 200KB of dependency to run at build time over strings we
 * generated ourselves, and it would put a parser between the catalog and
 * the registry that nobody in this repo could debug at 2am. The corpus is
 * narrow enough that a 150-line tokenizer covers it exactly, and the tests
 * next to this file pin the edges that actually occur.
 *
 * WHAT THIS IS NOT
 *
 * Not a validator, and not a general parser. It does not understand
 * `@import`, `@charset`, native nesting, or a selector list split across a
 * comment boundary. Anything it cannot place is reported through
 * `warnings` rather than dropped quietly, and the build check fails on a
 * non-empty result — because CSS that silently half-converts produces an
 * effect that installs and renders wrong, which is worse than one that
 * refuses to publish.
 *
 * FIDELITY NOTES, BOTH OF WHICH ARE REAL
 *
 *   Duplicate declarations. `background: red; background: linear-gradient(…)`
 *   is the standard way to write a fallback, and an object cannot hold the
 *   same key twice. The last value wins, which is what the cascade would
 *   do anyway for a browser that understands both — but the fallback for
 *   one that does not is lost. Reported as a warning rather than swallowed.
 *
 *   Rule order. Object key order is insertion order for string keys, so
 *   the emitted object preserves source order, and consumers that
 *   `JSON.stringify` it keep that too. This matters for effects whose
 *   `:hover` rule follows the base rule and relies on it.
 */

/** A declaration value, or a nested block of more of the same. */
export type CssValue = string | CssObject

export interface CssObject {
  [key: string]: CssValue
}

export interface CssConversion {
  css: CssObject
  /** Anything the converter could not place, or placed lossily. */
  warnings: string[]
}

/*
  There is deliberately no list of "at-rules whose body is rules".

  The first version of this file had one — media, supports, keyframes,
  layer — and it was dead weight. Whether a body holds rules or
  declarations is decided per chunk by whether a `{` was reached before a
  `;`, so `@keyframes` (whose "selectors" are `from`, `to` and
  percentages) and `@property` (whose body is `syntax` and `initial-value`
  declarations) both come out right with no branch at all. A list would be
  one more thing to keep in step with CSS.
*/

/**
 * Strip comments, without touching comment-like text inside strings.
 *
 * Both block comments and `//` to end of line. The second is not CSS, and
 * supporting it is a deliberate concession to how these files are actually
 * written: `card-spotlight` ends with a `//`-prefixed note explaining the
 * mousemove listener the effect needs, and a browser tolerates that only
 * because the garbage sits after every rule it cares about. A converter
 * that reported it as unreadable would be technically right and would
 * block the one effect in the catalog that ships a usage note.
 *
 * `//` only counts outside parens, so `url(https://cdn/x.png)` and
 * protocol-relative `url(//cdn/x.png)` both survive — that guard is the
 * whole reason this is a walk rather than a regex.
 */
function stripComments(input: string): string {
  let out = ''
  let quote: string | null = null
  let paren = 0

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!

    if (quote) {
      out += ch
      if (ch === '\\') {
        out += input[i + 1] ?? ''
        i += 1
      } else if (ch === quote) {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      out += ch
      continue
    }

    if (ch === '(') paren += 1
    else if (ch === ')') paren = Math.max(0, paren - 1)

    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2)
      i = end === -1 ? input.length : end + 1
      continue
    }

    if (paren === 0 && ch === '/' && input[i + 1] === '/') {
      const end = input.indexOf('\n', i + 2)
      i = end === -1 ? input.length : end - 1
      continue
    }

    out += ch
  }

  return out
}

/**
 * Split a block into top-level chunks, respecting quotes, parens and depth.
 *
 * Returns each chunk as either a rule (`prelude` + `body`) or a bare
 * declaration/statement (`text`). One walk handles both, because at this
 * level the only difference is whether a `{` was reached before a `;`.
 */
interface Chunk {
  prelude?: string
  body?: string
  text?: string
}

function splitTopLevel(input: string): Chunk[] {
  const chunks: Chunk[] = []
  let buf = ''
  let depth = 0
  let paren = 0
  let quote: string | null = null
  let blockStart = -1

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!

    if (quote) {
      buf += ch
      if (ch === '\\') {
        buf += input[i + 1] ?? ''
        i += 1
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

    /* Parens matter for `url(…)` and for `@media (min-width: 40rem)`,
       where a `;` or `{` would otherwise be read as structure. */
    if (ch === '(') paren += 1
    if (ch === ')') paren = Math.max(0, paren - 1)

    if (paren === 0 && ch === '{') {
      depth += 1
      if (depth === 1) {
        blockStart = buf.length
        buf += ch
        continue
      }
    } else if (paren === 0 && ch === '}') {
      depth -= 1
      if (depth === 0) {
        const prelude = buf.slice(0, blockStart).trim()
        const body = buf.slice(blockStart + 1)
        chunks.push({ prelude, body })
        buf = ''
        blockStart = -1
        continue
      }
    } else if (paren === 0 && depth === 0 && ch === ';') {
      const text = buf.trim()
      if (text) chunks.push({ text })
      buf = ''
      continue
    }

    buf += ch
  }

  const rest = buf.trim()
  if (rest) chunks.push({ text: rest })

  return chunks
}

/** `prop: value` — split at the first colon outside quotes and parens. */
function splitDeclaration(text: string): [string, string] | null {
  let paren = 0
  let quote: string | null = null

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!

    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '(') paren += 1
    else if (ch === ')') paren = Math.max(0, paren - 1)
    else if (ch === ':' && paren === 0) {
      const prop = text.slice(0, i).trim()
      const value = text.slice(i + 1).trim()
      if (!prop || !value) return null
      return [prop, value]
    }
  }

  return null
}

/**
 * Merge a parsed block into a parent object.
 *
 * Two rules with the same selector merge rather than replace: an effect
 * that states `.fx-x { color: red }` and later `.fx-x { transform: … }` in
 * two places means both, and last-object-wins would drop the first.
 */
function mergeInto(target: CssObject, key: string, value: CssObject, warnings: string[]): void {
  const existing = target[key]
  if (existing && typeof existing === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k in existing && typeof v === 'string' && existing[k] !== v) {
        warnings.push(
          `"${key}" declares "${k}" more than once ("${String(existing[k])}" then "${v}"); the last value wins and any fallback is lost.`,
        )
      }
      existing[k] = v
    }
    return
  }
  target[key] = value
}

function parseBlock(input: string, warnings: string[], where: string): CssObject {
  const out: CssObject = {}

  for (const chunk of splitTopLevel(input)) {
    if (chunk.text !== undefined) {
      const decl = splitDeclaration(chunk.text)
      if (!decl) {
        warnings.push(`${where}: could not read "${chunk.text.slice(0, 60)}" as a declaration.`)
        continue
      }
      const [prop, value] = decl
      if (prop in out && out[prop] !== value) {
        warnings.push(
          `${where}: "${prop}" is declared more than once ("${String(out[prop])}" then "${value}"); the last value wins and any fallback is lost.`,
        )
      }
      out[prop] = value
      continue
    }

    const prelude = (chunk.prelude ?? '').trim()
    const body = chunk.body ?? ''

    if (!prelude) {
      warnings.push(`${where}: a block with no selector was skipped.`)
      continue
    }

    /*
      An at-rule's body is either rules or declarations, and which one is
      decided by the at-rule's name — see RULE_BODY_AT_RULES. Everything
      that is not an at-rule is a selector, whose body is declarations.
      Both branches call back into this same function, so nesting depth
      costs nothing.
    */
    mergeInto(out, prelude, parseBlock(body, warnings, prelude), warnings)
  }

  return out
}

/**
 * Convert a stylesheet to the registry's `css` object.
 *
 * Never throws. A stylesheet this cannot fully read produces whatever it
 * could place plus a warning for the rest, so a caller can decide between
 * publishing and failing the build — which `scripts/check-registry.mts`
 * does, on the side of failing.
 */
export function cssToObject(css: string, label = 'css'): CssConversion {
  const warnings: string[] = []
  const parsed = parseBlock(stripComments(css), warnings, label)
  return { css: parsed, warnings }
}
