/**
 * Comparing two rendered documents property by property.
 *
 * ── WHY NOT A SCREENSHOT DIFF ───────────────────────────────────────────
 *
 * Two frames side by side is the demonstration; this is the part that
 * makes it a check. A reader looking at two 300px previews will not notice
 * a `letter-spacing` that went from `0.02em` to `0.2px`, a `will-change`
 * that was dropped, or a gradient that lost its second colour stop behind
 * an element that overlaps it. A screenshot comparison would not either,
 * at that size — and pixel diffing is exactly the technique that produces
 * a wall of false positives on antialiasing.
 *
 * Computed style is the honest unit. It is what the browser decided after
 * the whole cascade, so it catches a rule that never matched, a selector
 * whose specificity changed, a declaration that was silently dropped as
 * invalid — and it says *which property*, which is the difference between
 * "these look different" and a bug report.
 *
 * ── WHAT IT COMPARES ────────────────────────────────────────────────────
 *
 * Every property the browser enumerates, on every element, plus `::before`
 * and `::after` — which for this catalog is not an edge case but most of
 * the interesting styling. No allowlist: a curated property list is a list
 * of the bugs somebody already thought of.
 *
 * ── ANIMATION ───────────────────────────────────────────────────────────
 *
 * A running animation resolves `transform` to wherever it is this
 * millisecond, and two frames never start on the same millisecond. So both
 * documents are rewound to time zero for the measurement and released
 * afterwards: `animation-name`, `animation-duration` and
 * `animation-iteration-count` are still compared, which is the part that
 * can actually be wrong, while the interpolated value — a clock reading,
 * not a fact about the conversion — is not.
 *
 * Rewound through `getAnimations()` rather than by injecting
 * `animation-play-state: paused`, for two reasons. Pausing stops an
 * animation *where it is*, which is the problem restated rather than
 * solved — the two frames stop at two different phases. And a stylesheet
 * that forces `animation-delay` or `transition-property` changes those
 * computed values on both sides, which would hide a real difference in
 * exactly the properties a conversion is most likely to lose.
 */

export interface StyleDifference {
  /** Where in the tree, e.g. `div.card › button.card__btn`. */
  path: string
  /** `::before` when the difference is on a pseudo-element. */
  pseudo: string | null
  property: string
  original: string
  converted: string
  /**
   * `equivalent` marks a difference that cannot reach the screen: either
   * two spellings of one used value — `start` against `flex-start`,
   * because Tailwind's `items-start` is spelled `flex-start` — or a
   * property that is not painted at all in either frame, such as the
   * colour of a border whose style is `none`.
   */
  severity: 'real' | 'equivalent'
}

export interface StructuralDifference {
  path: string
  message: string
}

export interface DiffReport {
  /** Elements compared on both sides. */
  elements: number
  /** Property reads that agreed. */
  agreed: number
  differences: StyleDifference[]
  structural: StructuralDifference[]
  /** True when the difference lists were cut short. */
  truncated: boolean
}

/**
 * Values that differ as strings and not on screen.
 *
 * Each pair is here because a conversion legitimately produces the other
 * spelling, not to make a red panel green. `flex-start` and `start` are
 * the same used value in a flex container, and Tailwind only has the one
 * spelling — reporting that as a defect every time would train the reader
 * to ignore the panel, which costs more than the pair is worth.
 */
const EQUIVALENT_VALUES: ReadonlyArray<{
  properties: readonly string[]
  pair: readonly [string, string]
}> = [
  {
    properties: ['align-items', 'align-self', 'justify-content', 'justify-items', 'justify-self'],
    pair: ['flex-start', 'start'],
  },
  {
    properties: ['align-items', 'align-self', 'justify-content', 'justify-items', 'justify-self'],
    pair: ['flex-end', 'end'],
  },
  { properties: ['font-weight'], pair: ['400', 'normal'] },
  { properties: ['font-weight'], pair: ['700', 'bold'] },
]

/**
 * Scoped to the properties the pair is actually interchangeable on.
 * `normal` means one thing for `font-weight` and another for `white-space`,
 * and a table that ignored the property would quietly swallow the second.
 */
function isEquivalentValue(property: string, a: string, b: string): boolean {
  return EQUIVALENT_VALUES.some(
    ({ properties, pair: [x, y] }) =>
      properties.includes(property) &&
      ((a === x && b === y) || (a === y && b === x)),
  )
}

/**
 * Differences that cannot be painted, whatever the values are.
 *
 * `border: none` resets three longhands; Tailwind's `border-none` sets only
 * the style, so the colour underneath survives and the two computed values
 * differ. A border whose style is `none` is not drawn at all, so no value
 * of `border-top-color` can reach the screen — the difference is real and
 * unobservable, which is precisely what the `equivalent` bucket is for.
 *
 * The test is made against the *rendered* styles rather than assumed, and
 * it demands `none` on both sides: if either frame paints that edge, the
 * colour matters and the difference is reported as real.
 */
function isUnpaintable(
  property: string,
  original: CSSStyleDeclaration,
  converted: CSSStyleDeclaration,
): boolean {
  const edge = property.match(/^border-(top|right|bottom|left|block-start|block-end|inline-start|inline-end)-color$/)
  if (edge) {
    const style = `border-${edge[1]}-style`
    return (
      original.getPropertyValue(style) === 'none' &&
      converted.getPropertyValue(style) === 'none'
    )
  }

  if (property === 'outline-color') {
    return (
      original.getPropertyValue('outline-style') === 'none' &&
      converted.getPropertyValue('outline-style') === 'none'
    )
  }

  return false
}

/** Cap on each list, so a wholly broken conversion cannot hang the tab. */
const MAX_DIFFERENCES = 60

/**
 * The text an element holds directly, with whitespace collapsed the way
 * the browser collapses it — so an indentation change is not a finding but
 * a lost word is.
 */
function directText(el: Element): string {
  let out = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 /* Node.TEXT_NODE */) out += node.textContent ?? ''
  }
  return out.replace(/\s+/g, ' ').trim()
}

/** `button.card__btn`, for naming an element in a finding. */
function describe(el: Element): string {
  const classes = Array.from(el.classList)
    .filter((c) => c !== 'svelte-hoverlab')
    .slice(0, 2)
    .map((c) => `.${c}`)
    .join('')
  return `${el.tagName.toLowerCase()}${classes}`
}

/**
 * Properties enumerated by `CSSStyleDeclaration`, as a plain array.
 *
 * Read from the original document only, and reused for the converted one:
 * the enumeration is a property of the browser, not of the page, so
 * reading it twice would cost time and could only ever produce the same
 * list.
 */
function propertyNames(style: CSSStyleDeclaration): string[] {
  const names: string[] = []
  for (let i = 0; i < style.length; i++) names.push(style[i])
  return names
}

interface DiffContext {
  report: DiffReport
  properties: string[] | null
}

function comparePair(
  a: Element,
  b: Element,
  path: string,
  pseudo: string | null,
  ctx: DiffContext,
): void {
  const viewA = a.ownerDocument.defaultView
  const viewB = b.ownerDocument.defaultView
  if (!viewA || !viewB) return

  const styleA = viewA.getComputedStyle(a, pseudo)
  const styleB = viewB.getComputedStyle(b, pseudo)

  if (!ctx.properties) ctx.properties = propertyNames(styleA)

  for (const property of ctx.properties) {
    const original = styleA.getPropertyValue(property)
    const converted = styleB.getPropertyValue(property)

    if (original === converted) {
      ctx.report.agreed++
      continue
    }

    if (ctx.report.differences.length >= MAX_DIFFERENCES) {
      // Stop recording, not comparing: `agreed` is the denominator the
      // verdict quotes, and abandoning the loop here made it a number that
      // counted some elements' properties and not others'.
      ctx.report.truncated = true
      continue
    }

    ctx.report.differences.push({
      path,
      pseudo,
      property,
      original,
      converted,
      severity:
        isEquivalentValue(property, original, converted) ||
        isUnpaintable(property, styleA, styleB)
          ? 'equivalent'
          : 'real',
    })
  }
}

function walk(a: Element, b: Element, path: string, ctx: DiffContext): void {
  const childrenA = Array.from(a.children)
  const childrenB = Array.from(b.children)

  if (childrenA.length !== childrenB.length) {
    if (ctx.report.structural.length < MAX_DIFFERENCES) {
      ctx.report.structural.push({
        path,
        message: `${childrenA.length} child element${
          childrenA.length === 1 ? '' : 's'
        } in the original, ${childrenB.length} in the export.`,
      })
    } else {
      ctx.report.truncated = true
    }
  }

  const shared = Math.min(childrenA.length, childrenB.length)
  for (let i = 0; i < shared; i++) {
    const childA = childrenA[i]
    const childB = childrenB[i]
    const childPath = `${path} › ${describe(childA)}`

    if (childA.tagName !== childB.tagName) {
      if (ctx.report.structural.length < MAX_DIFFERENCES) {
        ctx.report.structural.push({
          path: childPath,
          message: `<${childA.tagName.toLowerCase()}> in the original, <${childB.tagName.toLowerCase()}> in the export. The subtree below this is not compared.`,
        })
      } else {
        ctx.report.truncated = true
      }
      continue
    }

    ctx.report.elements++
    comparePair(childA, childB, childPath, null, ctx)
    comparePair(childA, childB, childPath, '::before', ctx)
    comparePair(childA, childB, childPath, '::after', ctx)

    /*
     * An element's *own* text, not its descendants'.
     *
     * This used to compare `textContent`, and only on elements with no
     * element children — because `textContent` on a container repeats every
     * descendant's text and turns one changed word into a finding on every
     * ancestor. But skipping every element that has children skipped
     * precisely the mixed-content case: `<td><i></i>North America</td>`
     * losing "North America" would have gone unreported, and mixed content
     * is where this codebase's markup bugs actually live.
     *
     * Reading only the direct child text nodes solves both: no repetition,
     * no blind spot.
     */
    const ownTextA = directText(childA)
    const ownTextB = directText(childB)
    if (ownTextA !== ownTextB) {
      if (ctx.report.structural.length < MAX_DIFFERENCES) {
        ctx.report.structural.push({
          path: childPath,
          message: `Its own text reads "${ownTextA}" in the original and "${ownTextB}" in the export.`,
        })
      } else {
        ctx.report.truncated = true
      }
    }

    walk(childA, childB, childPath, ctx)
  }
}

/**
 * Compare two rendered documents.
 *
 * The bodies are the roots: the sandbox shell around them is written by
 * this codebase and is identical on both sides, so comparing it would only
 * ever confirm that a constant equals itself.
 */
export function diffRendered(original: Document, converted: Document): DiffReport {
  const report: DiffReport = {
    elements: 0,
    agreed: 0,
    differences: [],
    structural: [],
    truncated: false,
  }

  const bodyA = original.body
  const bodyB = converted.body
  if (!bodyA || !bodyB) {
    report.structural.push({ path: 'body', message: 'One of the frames has not rendered.' })
    return report
  }

  walk(bodyA, bodyB, 'body', { report, properties: null })
  return report
}

/**
 * Rewind every animation and transition in a document to its first frame.
 *
 * Returns the release function. `getAnimations()` covers pseudo-element
 * animations, which for this catalog is most of them — an effect whose
 * `::before` is the whole trick is the normal case, not the exception.
 *
 * Browsers without `getAnimations` (or with it behind a flag) simply
 * measure unfrozen: the comparison still runs and an animated effect
 * reports a `transform` difference, which is why the panel names the
 * resting state in its limits rather than claiming the clock is handled.
 */
export function freezeAnimations(doc: Document): () => void {
  const animations = doc.getAnimations?.() ?? []
  const held: Array<{ animation: Animation; time: CSSNumberish | null; wasRunning: boolean }> = []

  for (const animation of animations) {
    try {
      held.push({
        animation,
        time: animation.currentTime,
        wasRunning: animation.playState === 'running',
      })
      animation.pause()
      animation.currentTime = 0
    } catch {
      /* A finished or cancelled animation can refuse both; nothing to do. */
    }
  }

  return () => {
    for (const { animation, time, wasRunning } of held) {
      try {
        // Put it back where it was before playing, or the reader watches
        // every animation on the page jump to its first frame the moment
        // the panel finishes measuring.
        if (time !== null) animation.currentTime = time
        if (wasRunning) animation.play()
      } catch {
        /* Released into a document that has since been replaced. */
      }
    }
  }
}

/** The one-line verdict the panel leads with. */
export function verdictOf(report: DiffReport): {
  status: 'match' | 'equivalent' | 'differs'
  headline: string
} {
  const real = report.differences.filter((d) => d.severity === 'real')

  if (report.structural.length) {
    return {
      status: 'differs',
      headline: 'The export renders different markup from the original.',
    }
  }
  /*
   * Two empty frames agree on everything, and saying so would be the most
   * confident possible way to report that nothing rendered. "Zero of zero
   * properties match" is technically true and worthless.
   */
  if (report.elements === 0) {
    return {
      status: 'differs',
      headline: 'Neither frame rendered any elements, so there was nothing to compare.',
    }
  }
  if (real.length) {
    return {
      status: 'differs',
      headline: `${real.length} computed ${
        real.length === 1 ? 'property differs' : 'properties differ'
      } between the two renderings.`,
    }
  }
  if (report.differences.length) {
    return {
      status: 'equivalent',
      headline: `Identical apart from ${report.differences.length} value${
        report.differences.length === 1 ? '' : 's'
      } that cannot reach the screen.`,
    }
  }
  return {
    status: 'match',
    headline: `Every one of ${report.agreed.toLocaleString()} computed properties across ${report.elements} element${
      report.elements === 1 ? '' : 's'
    } matches the original.`,
  }
}
