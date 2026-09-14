/**
 * Prefix every rule in a stylesheet with a wrapper class, so a thumbnail can
 * render an effect without its styles leaking into the rest of the page.
 *
 * This lived inside `components/effect-detail.tsx` as a private helper for
 * the similar-effects rail. It moved here the day a second surface needed it
 * — the public variations rail renders eight copies of the same effect at
 * once — because the naive version of this function is a one-line regex that
 * looks correct and is not, and a second hand-rolled copy would have shipped
 * the bug again:
 *
 *   `css.replace(/(^|\})\s*([^{}]+)\{/g, ...)` prefixes at-rule preludes
 *   too, producing `.fx-preview-1 @keyframes spin { … }`. That is not a
 *   selector, so browsers drop the entire block — every animated effect
 *   renders frozen while still carrying an `animation-name` pointing at
 *   keyframes that no longer exist. It fails silently and only for the
 *   effects whose whole point is that they move.
 *
 * So at-rules are handled explicitly and this is a brace matcher rather than
 * a regex. `@keyframes` (and friends) pass through untouched — their bodies
 * are not selector lists, and the catalog generator already namespaces
 * animation names per effect, so they cannot collide. Conditional groups
 * like `@media` keep their condition and get scoped one level in, which is
 * also what lets the site's reduced-motion guard reach scoped previews.
 */

/** Index of the `}` that closes the `{` at `open`. */
function matchingBrace(css: string, open: number): number {
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return i
  }
  return css.length
}

/** At-rules whose body is declarations or frames, not a selector list. */
const OPAQUE_AT_RULE = /^@(-[a-z]+-)?(keyframes|font-face|counter-style|property)\b/i

/**
 * A copy of `css` with `.${wrapper} ` prepended to every selector.
 *
 * `wrapper` is a bare class name with no leading dot. Callers generate it
 * from `React.useId()` rather than a module-level counter: a counter keeps
 * climbing for the life of the server process while the browser restarts it
 * at 1, so the class React renders never matches the one it hydrates
 * against and every page logs a mismatch.
 */
export function scopeCss(css: string, wrapper: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open === -1) break
    const prelude = css.slice(i, open).trim()
    const close = matchingBrace(css, open)
    const body = css.slice(open + 1, close)

    if (OPAQUE_AT_RULE.test(prelude)) {
      out += `${prelude} {${body}}\n`
    } else if (prelude.startsWith('@')) {
      out += `${prelude} {${scopeCss(body, wrapper)}}\n`
    } else {
      const scoped = prelude
        .split(',')
        .map((s) => `.${wrapper} ${s.trim()}`)
        .join(', ')
      out += `${scoped} {${body}}\n`
    }
    i = close + 1
  }
  return out
}

/**
 * Rename every `@keyframes` a stylesheet declares, and every reference to it,
 * so N customized copies of one effect can coexist on one page.
 *
 * ── WHY SCOPING ALONE IS NOT ENOUGH ─────────────────────────────────────
 *
 * `scopeCss` deliberately passes at-rules through untouched, because
 * `.wrapper @keyframes spin` is not a selector and browsers drop the block.
 * That is correct for its original caller — the similar-effects rail renders
 * six DIFFERENT effects, and the catalog generator already namespaces
 * animation names per effect, so nothing collides.
 *
 * It is wrong the moment a page renders the SAME effect more than once with
 * different values, which is exactly what the variations rail does. Keyframe
 * names are global and last-definition-wins, so seven scoped copies of
 * `@keyframes fx-dots-bounce` — one per variation, with different translate
 * distances after a scale transform — resolve to whichever landed last. All
 * seven cards then animate identically, and because the rail's <style> comes
 * after the page's own, the effect's MAIN preview higher up the page silently
 * adopts a variation's keyframes too.
 *
 * 166 of the 1,126 effects have keyframes that change under customization, so
 * this was not an edge case. It is also invisible to every static check: the
 * CSS is valid, the selectors are scoped, and each sheet is correct in
 * isolation. Only the concatenation is wrong.
 *
 * ── WHAT IT DOES NOT DO ─────────────────────────────────────────────────
 *
 * Only names this stylesheet actually declares are renamed, so a reference to
 * an animation defined elsewhere (a global utility, a Tailwind keyframe)
 * survives untouched.
 *
 * And it is applied only to the copy that gets RENDERED. The copy the reader
 * copies keeps the catalog's real names — handing somebody CSS full of
 * `fx-dots-bounce-btn-gradient-ember` would be leaking this page's rendering
 * problem into their project.
 */
export function namespaceKeyframes(css: string, suffix: string): string {
  const declared = new Set(
    [...css.matchAll(/@(?:-[a-z]+-)?keyframes\s+("[^"]+"|'[^']+'|[\w-]+)/gi)].map((m) =>
      m[1].replace(/^['"]|['"]$/g, ''),
    ),
  )
  if (declared.size === 0) return css

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
  const rename = (name: string) => `${name}-${suffix}`

  /*
   * One alternation, longest name first, applied in a SINGLE pass — not a
   * loop of one replace per name.
   *
   * `\b` treats `-` as a word boundary, so `fade` matches inside `fade-out`.
   * A per-name loop therefore rewrites `fade-out` to `fade-s-out` when `fade`
   * comes first, and — worse, because sorting looks like it fixes it — to
   * `fade-s-out-s` when `fade-out` comes first, since the shorter name still
   * matches inside the name the previous pass just produced. Either way the
   * element ends up pointing at keyframes that do not exist, which presents
   * as "the animation silently stopped working".
   *
   * A single alternation consumes each match once and moves past it, and
   * ordering the branches longest-first makes the regex prefer `fade-out`
   * over `fade` at the same position.
   */
  const reference = new RegExp(
    `\\b(${[...declared]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join('|')})\\b`,
    'g',
  )

  let out = css

  // References first, while the declarations still carry their original names.
  // Whole declaration at a time rather than a lookbehind, so a shorthand that
  // names several animations (`animation: a 1s, b 2s`) is fully covered.
  out = out.replace(/(animation(?:-name)?\s*:)([^;}]*)/gi, (_m, head: string, value: string) => {
    return head + value.replace(reference, (name) => rename(name))
  })

  // Then the declarations themselves, anchored on the at-rule so this cannot
  // reach into a value it already rewrote.
  out = out.replace(
    /(@(?:-[a-z]+-)?keyframes\s+)("[^"]+"|'[^']+'|[\w-]+)/gi,
    (m: string, head: string, raw: string) => {
      const name = raw.replace(/^['"]|['"]$/g, '')
      return declared.has(name) ? `${head}${rename(name)}` : m
    },
  )

  return out
}
