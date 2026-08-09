/**
 * Make a grid card play its effect when you hover the card.
 *
 * 1,857 of the 4,244 effects — 44% — are driven by `:hover` on the effect
 * element itself. In a grid that means the only way to see the thing move
 * is to land the pointer inside a 40px button in the middle of a tile, or
 * to open the detail page. On a site called Hoverlab, the catalog's headline
 * behaviour was the part you had to work for.
 *
 * This lifts every top-level `:hover` rule out of an effect's CSS and
 * re-emits it keyed on the *card* being hovered:
 *
 *   .fx-btn-neon:hover { color: #fff }
 *     →  .fx-peek:hover .fx-btn-neon,
 *        .fx-peek:focus-within .fx-btn-neon { color: #fff }
 *
 * Specificity works out on its own: `.fx-peek:hover .fx-btn-neon` is
 * (0,2,0) against the base rule's (0,1,0), so the played state wins without
 * `!important`. The base rule's own `transition` still applies, so it eases
 * in exactly as it would have.
 *
 * `:focus-within` rides along so a keyboard user tabbing through the grid
 * sees the same thing a mouse user does.
 *
 * The output is appended to the single document-level <style> the grids
 * already emit for effect CSS, so this costs no extra request and no
 * JavaScript — which is what keeps <EffectStaticCard> a server component.
 */

/** Wrapper class a card puts on itself to opt into playing on hover. */
export const PEEK_CLASS = 'fx-peek'

/**
 * Split CSS into top-level rules, tracking brace depth so the body of an
 * `@media` or `@keyframes` block is never mistaken for a selector.
 *
 * Only depth-0 rules are considered. A `:hover` nested inside an at-rule is
 * conditional on that at-rule, and hoisting it out would apply it in
 * conditions the author excluded — rarer than getting it wrong is bad.
 */
function topLevelRules(css: string): Array<{ selector: string; body: string }> {
  const rules: Array<{ selector: string; body: string }> = []
  let depth = 0
  let start = 0
  let selectorEnd = -1

  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      if (depth === 0) selectorEnd = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        const selector = css.slice(start, selectorEnd).trim()
        const body = css.slice(selectorEnd + 1, i).trim()
        // An at-rule's "body" is more rules, not declarations. Skipped.
        if (selector && !selector.startsWith('@')) rules.push({ selector, body })
        start = i + 1
      }
    }
  }
  return rules
}

/**
 * True when stripping `:hover` from this selector would change its meaning
 * rather than just forcing the state.
 *
 * `:not(:hover)` is the case that matters — removing the `:hover` inverts
 * the rule, applying "the un-hovered look" permanently while peeking.
 */
function unsafeToLift(selector: string): boolean {
  return selector.includes(':not(')
}

/**
 * The extra CSS that plays `css`'s hover state while `.fx-peek` is hovered.
 *
 * Returns '' when the effect has no liftable `:hover` rule — the ~56% that
 * animate on their own via `@keyframes` need nothing, since they are already
 * running by the time the grid paints.
 */
export function hoverPeekCss(css: string): string {
  if (!css.includes(':hover')) return ''

  const out: string[] = []

  for (const { selector, body } of topLevelRules(css)) {
    if (!selector.includes(':hover') || unsafeToLift(selector)) continue
    if (!body) continue

    // A selector list ("a:hover, b:hover") has to be lifted part by part —
    // one part may carry :hover while another does not.
    const played = selector
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.includes(':hover'))
      .map((part) => part.replaceAll(':hover', '').trim())
      .filter(Boolean)
      .flatMap((part) => [
        `.${PEEK_CLASS}:hover ${part}`,
        `.${PEEK_CLASS}:focus-within ${part}`,
      ])

    if (played.length > 0) out.push(`${played.join(',\n')} {\n${body}\n}`)
  }

  return out.join('\n')
}

/**
 * Peek CSS for a whole grid, de-duplicated.
 *
 * Callers pass every effect shown on the page. Class names are unique per
 * effect, so concatenation cannot collide; the Set is only guarding against
 * the same effect appearing twice in one view (a search that matches it at
 * two tiers, say).
 */
export function hoverPeekCssFor(cssBlocks: Iterable<string>): string {
  const seen = new Set<string>()
  for (const css of cssBlocks) {
    const peek = hoverPeekCss(css)
    if (peek) seen.add(peek)
  }
  return [...seen].join('\n')
}
