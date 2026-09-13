/**
 * Reading JSX as text, carefully enough that a rule can be trusted.
 *
 * Every rule family in this directory works on source text rather than an
 * AST, and that is a deliberate constraint rather than a shortcut. The CLI
 * is dependency-free on purpose — see the `//` note in package.json — so
 * pulling in `typescript` to parse a reviewed file would add about 6MB and
 * a second of startup to a command whose whole promise is that it runs in a
 * CI step before the install finishes. `scripts/check-overflow-clip.mts`
 * back in the repo DOES use the TypeScript parser, because it runs inside a
 * build that already has it; the nesting walk in `overflow.mjs` next door is
 * this package's answer to the same question.
 *
 * What that constraint costs is precision, and the functions here exist to
 * buy most of it back. The difference between this and a `<tag[^>]*>` regex
 * is the difference between a report someone acts on and one they skim:
 *
 *   <input ref={(el) => { refs.current[i] = el }} aria-label="Digit 1" />
 *
 * A `[^>]*` scanner stops at the `>` inside the arrow function, hands the
 * rule a tag that ends before `aria-label`, and the rule reports an
 * unlabelled input that is, in fact, labelled. One wrong finding teaches a
 * reader to distrust the other forty, so the walk below tracks brace depth
 * and string literals instead, and drops a tag it cannot resolve rather
 * than guessing at it.
 *
 * Moved here from `scripts/audit-a11y.mts` when the catalog's own audit
 * became a product. The behaviour is unchanged and `src/lib/a11y-rules.test.ts`
 * in the repo still pins it: that suite's cases are all mistakes the audit
 * actually made on the real catalog, so it is the proof the move was faithful.
 */

/**
 * Strip comments so a rule cannot fire on prose about the rule.
 *
 * Not offset-preserving — use `maskComments` when the caller has to map a
 * match back onto the original text in order to rewrite it.
 */
export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
}

/**
 * The same source with every comment blanked to spaces, offsets preserved.
 *
 * That preservation is the entire trick: a scanner needs to see the code
 * without the prose, but a rewriter must still edit the real file, so a
 * match found in the masked copy has to land at the same index in the
 * original.
 *
 * This is a bug fix rather than a tidy-up, and it was a nasty one. A string
 * scanner starts a string at the first quote character it meets, and an
 * English apostrophe in a docblock — "a screen reader's table commands" —
 * is a quote character. From there the scan is one quote out of phase for
 * the rest of the file: it reads code as string and string as code, and
 * every className after it is invisible. The failure was silent and
 * partial, which is the worst combination — a run over the catalog rewrote
 * 15 of 19 physical `text-left` tokens and reported a green, confident,
 * wrong "15 rewritten". The four it missed were missed because of where an
 * apostrophe fell nine lines from the top of the file.
 */
export function maskComments(source) {
  const blank = (m) => m.replace(/[^\n\r]/g, ' ')
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n\r]*/g, (m, lead) => lead + blank(m.slice(lead.length)))
}

/**
 * Remove markup that is being encoded into a string, not rendered.
 *
 * A component with no network access that needs a sample image inlines one
 * as `data:image/svg+xml,` + `encodeURIComponent(`<svg …>`)`. That `<svg>`
 * is never an element: it is the src of an `<img>` that carries its own
 * `alt`, and the alt is where its accessible name correctly lives. Scanning
 * it as markup reports a missing `aria-hidden` on a tag that does not exist
 * in the DOM.
 *
 * Scoped to `encodeURIComponent(...)` rather than to template literals in
 * general. A backtick string is normally a className and harmless either
 * way, but `dangerouslySetInnerHTML={{ __html: `<svg …>` }}` really does
 * render, and that one must stay visible.
 */
export function stripEncodedMarkup(source) {
  return source.replace(/encodeURIComponent\s*\(\s*`[^`]*`/g, ' ')
}

/**
 * The same, offset-preserving.
 *
 * The repo-side audit uses the collapsing form above and must keep using
 * it — it is a build gate, and changing what it sees is changing what it
 * reports. The CLI wants the same blindness with the offsets intact,
 * because a finding a reviewer cannot put a line number on is a finding
 * nobody can act on in a diff.
 */
export function maskEncodedMarkup(source) {
  return source.replace(/encodeURIComponent\s*\(\s*`[^`]*`/g, (m) =>
    m.replace(/[^\n\r]/g, ' '),
  )
}

/** True when a tag's attribute text carries an accessible name. */
export function hasAccessibleName(tag) {
  return (
    /\baria-label\s*=/.test(tag) ||
    /\baria-labelledby\s*=/.test(tag) ||
    /\btitle\s*=/.test(tag)
  )
}

/**
 * One opening tag, starting at a known `<`.
 *
 * Tracks brace depth and string literals, which covers every form a JSX
 * attribute value takes. Returns null when the tag never closes at depth
 * zero, and callers skip rather than guess — a rule that treats "could not
 * parse" as "failed" puts untrue rows in the report.
 */
export function openingTag(source, start) {
  let depth = 0
  let quote = null

  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '>' && depth === 0) return source.slice(start, i + 1)
  }
  return null
}

/** Opening tags of one element type, as raw text. */
export function openingTags(source, tagName) {
  const out = []
  const open = new RegExp(`<${tagName}(?=[\\s/>])`, 'g')

  for (const match of source.matchAll(open)) {
    const tag = openingTag(source, match.index)
    if (tag !== null) out.push(tag)
  }

  return out
}

/**
 * Every opening tag in a source, for rules that are not element-specific.
 */
export function allTags(source) {
  const names = new Set(
    [...source.matchAll(/<([a-zA-Z][\w.]*)(?=[\s/>])/g)].map((m) => m[1]),
  )
  return [...names].flatMap((name) => openingTags(source, name))
}

/**
 * The text between an element's opening and matching closing tag.
 *
 * Depth-counted over same-named tags, so a `<button>` inside a `<button>`
 * — which React would reject anyway, but which appears in code samples —
 * cannot end the outer one early. Returns null when there is no matching
 * close.
 */
export function elementBody(source, from, name) {
  const token = new RegExp(`<${name}(?=[\\s/>])|</${name}\\s*>`, 'g')
  token.lastIndex = from
  let depth = 1

  for (let match = token.exec(source); match; match = token.exec(source)) {
    if (match[0].startsWith('</')) {
      depth--
      if (depth === 0) return source.slice(from, match.index)
    } else {
      depth++
    }
  }
  return null
}

/** The 1-based line number an offset falls on. */
export function lineAt(source, index) {
  let line = 1
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') line++
  }
  return line
}

/**
 * Split a Tailwind class token into its variant prefixes and base utility.
 *
 * `md:hover:pl-4` → `{ prefix: 'md:hover:', base: 'pl-4' }`. Rules that
 * rewrite a utility must put the prefixes back untouched; rules that only
 * read one care about the base.
 */
export function splitVariants(token) {
  const index = token.lastIndexOf(':')
  return index === -1
    ? { prefix: '', base: token }
    : { prefix: token.slice(0, index + 1), base: token.slice(index + 1) }
}

/**
 * Every string literal in a source, with its offsets.
 *
 * Components build class names three ways — a `className="..."` attribute,
 * a template literal, and a lookup table of strings — so this walks quoted
 * strings generally rather than parsing JSX.
 *
 * Always give this the output of `maskComments`, never the raw source, for
 * the apostrophe reason spelled out on that function.
 */
export function stringLiterals(masked) {
  const out = []
  const pattern = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g

  for (const match of masked.matchAll(pattern)) {
    out.push({
      start: match.index,
      end: match.index + match[0].length,
      quote: match[1],
      body: match[2],
    })
  }
  return out
}
