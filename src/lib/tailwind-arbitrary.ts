/**
 * CSS values as Tailwind arbitrary-value utilities.
 *
 * Half the tools under /tools emitted a CSS block and stopped, on a site
 * whose catalog is Tailwind-first from the blocks up. The person copying a
 * shadow out of the shadow tool is, on the numbers, about to paste it into
 * a `className` — and the translation is not the mechanical wrap it looks
 * like, which is why this is a module with tests rather than a template
 * literal in each tool.
 *
 * THE RULE THAT MAKES THIS NON-OBVIOUS
 *
 * A Tailwind arbitrary value cannot contain a space. Tailwind reads an
 * underscore as a space when it compiles the class, so `0 1px 2px` has to
 * be written `0_1px_2px` — and a value that genuinely contains an
 * underscore has to escape it as `\_`, or it comes out the other side as a
 * space. Emitting `shadow-[0 1px 2px]` produces a class name the scanner
 * splits into three, none of which exist. It looks right in a code block
 * and silently does nothing in a project, which is the worst failure mode
 * available to a copy button.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not check that the utility exists, or that the value is legal for
 * it. `arbitrary('shadow', 'banana')` returns `shadow-[banana]` happily.
 * The tools generate their own values from their own controls, so the value
 * is already whatever that tool guarantees; a second validator here would
 * be a second place to encode what a box-shadow is.
 */

/**
 * Find the `url(...)` spans in a value, as [start, end) index pairs.
 *
 * Depth-counted rather than matched with a regex, because the values this
 * has to survive are inline SVG data URIs and those contain parentheses of
 * their own — `filter='url(%23n)'` sits inside the outer `url(...)`, and
 * `/url\([^)]*\)/` ends the span on that inner bracket. The result is an
 * encoder that treats the second half of a data URI as ordinary text.
 */
function urlSpans(value: string): Array<[number, number]> {
  const spans: Array<[number, number]> = []
  const re = /url\(/g
  let m: RegExpExecArray | null
  while ((m = re.exec(value)) !== null) {
    let depth = 1
    let i = m.index + m[0].length
    while (i < value.length && depth > 0) {
      if (value[i] === '(') depth++
      else if (value[i] === ')') depth--
      i++
    }
    // An unbalanced `url(` is malformed CSS; treat the rest as inside it
    // rather than throwing, so a half-typed value still produces something.
    spans.push([m.index, i])
    re.lastIndex = i
  }
  return spans
}

/**
 * Encode one CSS value for use inside `[...]`.
 *
 * Two different rules, because Tailwind applies two:
 *
 *   OUTSIDE a url(), an underscore means a space. Literal underscores are
 *   escaped as `\_` BEFORE spaces are collapsed into underscores — get that
 *   order backwards and the escaping also catches the separators this
 *   function just wrote.
 *
 *   INSIDE a url(), Tailwind does no underscore conversion at all, so
 *   underscores are left alone. Spaces still cannot appear — a space is a
 *   class-name separator no matter where it sits — so they become `%20`,
 *   which is what a URL wants anyway. This is not hypothetical: the mesh
 *   tool's grain layer is an inline SVG data URI full of `width='120'
 *   height='120'`, and encoding those spaces as underscores would hand
 *   someone a class that renders no grain and no error.
 */
export function arbitraryValue(css: string): string {
  const trimmed = css.trim()
  if (!trimmed) return ''

  const spans = urlSpans(trimmed)
  let out = ''
  let cursor = 0

  for (const [start, end] of spans) {
    out += encodeOutsideUrl(trimmed.slice(cursor, start))
    out += trimmed.slice(start, end).replace(/\s+/g, '%20')
    cursor = end
  }
  out += encodeOutsideUrl(trimmed.slice(cursor))

  return out
}

function encodeOutsideUrl(part: string): string {
  return part.replace(/_/g, '\\_').replace(/\s+/g, '_')
}

/**
 * A complete arbitrary-value utility: `shadow-[0_1px_2px_rgb(0_0_0/0.05)]`.
 *
 * Returns an empty string for an empty value rather than `shadow-[]`, so a
 * caller joining several of these does not have to filter first.
 */
export function arbitrary(utility: string, css: string): string {
  const value = arbitraryValue(css)
  return value ? `${utility}-[${value}]` : ''
}

/**
 * Join utilities into one `className` string, dropping the empty ones.
 *
 * The tools build these from optional controls — a filter with brightness
 * at its default contributes nothing — and the alternative at every call
 * site is the same `.filter(Boolean).join(' ')`.
 */
export function classes(...utilities: (string | false | null | undefined)[]): string {
  return utilities.filter((u): u is string => Boolean(u)).join(' ')
}

/**
 * A CSS colour in the form Tailwind's opacity shorthand expects.
 *
 * `rgb(0 0 0 / 0.05)` rather than `rgba(0, 0, 0, 0.05)`: the modern space
 * separated syntax has no commas to trip the class scanner, and it is what
 * Tailwind's own generated utilities emit, so a copied value sits next to
 * theirs without looking foreign.
 */
export function rgbSlash(r: number, g: number, b: number, alpha: number): string {
  const a = Number(alpha.toFixed(3))
  return a >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`
}
