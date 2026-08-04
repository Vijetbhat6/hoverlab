/**
 * Static analysis of an effect's CSS: what modern platform features it
 * leans on, what it costs, and where it might trip over accessibility.
 *
 * The catalog is pure CSS, which makes "will this work in my browser?"
 * and "is this safe for motion-sensitive users?" the two questions people
 * actually have before pasting a snippet — and neither is answerable by
 * looking at a preview. Both are decidable from the source text, so they
 * are computed here rather than hand-annotated per effect (there are
 * 2,400+ effects; hand-annotation would rot immediately).
 *
 * Deliberately regex-based, not a real CSS parser. The input is our own
 * generated CSS, so the shapes are known and predictable, and a false
 * negative here costs a missing badge — not a broken page.
 *
 * Pure and dependency-free, so both server components and client
 * components can call it.
 */

/**
 * How broadly a feature is supported.
 *
 * - `wide`    — available in every current browser for years; no caveat.
 * - `recent`  — Baseline "newly available"; fine for most projects, worth
 *               knowing about if you support older Safari/Firefox.
 * - `limited` — not yet in every engine; needs a fallback.
 */
export type SupportLevel = 'wide' | 'recent' | 'limited'

export interface FeatureUse {
  /** Human-readable feature name, e.g. "backdrop-filter". */
  name: string
  level: SupportLevel
  /** One line on what it does / what to watch for. */
  note: string
}

export type InsightSeverity = 'info' | 'warn'

export interface AccessibilityNote {
  severity: InsightSeverity
  title: string
  detail: string
}

export interface EffectInsights {
  features: FeatureUse[]
  accessibility: AccessibilityNote[]
  /** Lowest support level across all detected features. */
  support: SupportLevel
  /** Bytes of CSS (UTF-8-ish; source length is close enough to signal size). */
  cssBytes: number
  /** Number of top-level style rules. */
  ruleCount: number
  /** Number of @keyframes blocks. */
  keyframeCount: number
  /** True when the effect animates or transitions anything. */
  animates: boolean
  /** True when at least one animation runs forever. */
  hasInfiniteAnimation: boolean
  /** True when the CSS already ships a prefers-reduced-motion block. */
  respectsReducedMotion: boolean
}

/* ------------------------------------------------------------------ *
 *  Feature table
 * ------------------------------------------------------------------ */

interface FeatureProbe {
  name: string
  level: SupportLevel
  note: string
  test: RegExp
}

/**
 * Ordered most-notable-first so the badge row reads well when truncated.
 * Only features worth *saying something about* are listed — nobody needs
 * a badge telling them `border-radius` exists.
 */
const PROBES: FeatureProbe[] = [
  {
    name: 'animation-timeline',
    level: 'limited',
    note: 'Scroll-driven animations. Not in Safari or Firefox by default — treat as progressive enhancement.',
    test: /animation-timeline\s*:|(?:^|[\s:(])view\(\)|scroll\(\s*\w*\s*\)/m,
  },
  {
    name: '@property',
    level: 'recent',
    note: 'Typed custom properties, which make gradients and angles animatable. Baseline since 2024.',
    test: /@property\s/,
  },
  {
    name: ':has()',
    level: 'recent',
    note: 'The parent selector. Baseline since late 2023; older Firefox ignores the rule entirely.',
    test: /:has\(/,
  },
  {
    name: 'color-mix()',
    level: 'recent',
    note: 'Blends two colors in CSS. Baseline since 2023 — supply a static fallback color for older engines.',
    test: /color-mix\(/,
  },
  {
    name: 'backdrop-filter',
    level: 'recent',
    note: 'Blurs whatever sits behind the element. Keep the -webkit- prefix for older Safari.',
    test: /backdrop-filter\s*:/,
  },
  {
    name: 'mask-image',
    level: 'recent',
    note: 'Fades or cuts the element by an image/gradient. Ship the -webkit-mask-image twin alongside it.',
    test: /(?:^|[^-])mask(?:-image)?\s*:/m,
  },
  {
    name: 'scrollbar styling',
    level: 'recent',
    note: 'Two syntaxes, both needed: scrollbar-width/-color is the standard, ::-webkit-scrollbar is what Chrome and Safari have shipped for years.',
    test: /scrollbar-(?:width|color)\s*:|::-webkit-scrollbar/,
  },
  {
    name: 'scroll-snap',
    level: 'wide',
    note: 'Locks scrolling to defined stop points. Set scroll-padding too, or the snapped item hides under sticky chrome.',
    test: /scroll-snap-(?:type|align)\s*:/,
  },
  {
    name: 'container queries',
    level: 'recent',
    note: 'Sizes respond to the container, not the viewport. Baseline since 2023.',
    test: /@container\s|container-type\s*:/,
  },
  {
    name: 'conic-gradient()',
    level: 'wide',
    note: 'Sweeps color around a center point — how the rings, donuts and pie charts are drawn.',
    test: /conic-gradient\(/,
  },
  {
    name: 'clip-path',
    level: 'wide',
    note: 'Cuts the element to an arbitrary shape. Widely supported; animate the polygon for reveals.',
    test: /clip-path\s*:/,
  },
  {
    name: '3D transforms',
    level: 'wide',
    note: 'Real perspective rendering. Watch for stacking-context surprises inside overflow: hidden.',
    test: /transform-style\s*:\s*preserve-3d|perspective\s*:|rotate[XY]\(|translateZ\(/,
  },
  {
    name: 'filter',
    level: 'wide',
    note: 'Blur/brightness/grayscale. Cheap on the GPU but creates a new containing block.',
    test: /(?:^|[\s;{])filter\s*:/m,
  },
  {
    name: 'mix-blend-mode',
    level: 'wide',
    note: 'Blends the element with what is beneath it — results depend on the backdrop you place it on.',
    test: /mix-blend-mode\s*:|background-blend-mode\s*:/,
  },
  {
    name: 'CSS variables',
    level: 'wide',
    note: 'Exposes knobs you can override per instance without touching the rule.',
    test: /--[\w-]+\s*:|var\(--/,
  },
]

const LEVEL_RANK: Record<SupportLevel, number> = { wide: 0, recent: 1, limited: 2 }

/* ------------------------------------------------------------------ *
 *  Analysis
 * ------------------------------------------------------------------ */

/** Strip comments so they can't trigger a probe. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function countMatches(source: string, re: RegExp): number {
  const m = source.match(re)
  return m ? m.length : 0
}

/**
 * Analyze one effect. `html` is optional and only used for the markup-aware
 * accessibility checks (focus styling on interactive elements).
 */
export function analyzeEffect(css: string, html = ''): EffectInsights {
  const src = stripComments(css)

  const features: FeatureUse[] = []
  for (const probe of PROBES) {
    if (probe.test.test(src)) {
      features.push({ name: probe.name, level: probe.level, note: probe.note })
    }
  }

  const support = features.reduce<SupportLevel>(
    (worst, f) => (LEVEL_RANK[f.level] > LEVEL_RANK[worst] ? f.level : worst),
    'wide',
  )

  const keyframeCount = countMatches(src, /@keyframes\s/g)
  const hasAnimation = /(?:^|[\s;{])animation(?:-name)?\s*:/m.test(src)
  const hasTransition = /(?:^|[\s;{])transition\s*:/m.test(src)
  const animates = hasAnimation || hasTransition || keyframeCount > 0
  const hasInfiniteAnimation = /animation[^;{}]*\binfinite\b/.test(src)
  const respectsReducedMotion = /prefers-reduced-motion/.test(src)

  // Rule count: `{` blocks that aren't at-rule openers. Close enough for a
  // "how big is this" signal without parsing.
  const ruleCount = Math.max(0, countMatches(src, /\{/g) - keyframeCount)

  const accessibility: AccessibilityNote[] = []

  if (hasInfiniteAnimation && !respectsReducedMotion) {
    accessibility.push({
      severity: 'warn',
      title: 'Loops forever without a motion opt-out',
      detail:
        'This effect animates continuously. Wrap the animation in a prefers-reduced-motion guard so users who ask for less motion get a still version.',
    })
  } else if (animates && !respectsReducedMotion) {
    accessibility.push({
      severity: 'info',
      title: 'Animates on interaction',
      detail:
        'Motion here is short and triggered by the user, which is usually fine. Add a prefers-reduced-motion guard if the effect ships on a critical path.',
    })
  }

  if (respectsReducedMotion) {
    accessibility.push({
      severity: 'info',
      title: 'Honors prefers-reduced-motion',
      detail:
        'For users who ask for less motion, this effect settles straight into its final state instead of animating. The guard is scoped to its own classes, so pasting it changes nothing else on your page.',
    })
  }

  const interactive = /<(?:button|a|input|select|textarea|summary|details)\b/i.test(html)
  const suppressesOutline = /outline\s*:\s*(?:none|0)/.test(src)
  const hasFocusStyle = /:focus(?:-visible|-within)?\b/.test(src)

  if (interactive && suppressesOutline && !hasFocusStyle) {
    accessibility.push({
      severity: 'warn',
      title: 'Removes the focus ring',
      detail:
        'outline is set to none on an interactive element with no :focus-visible replacement. Keyboard users lose track of where they are — add a visible focus style before shipping.',
    })
  } else if (interactive && hasFocusStyle) {
    accessibility.push({
      severity: 'info',
      title: 'Styles keyboard focus',
      detail: 'The effect defines a :focus / :focus-visible state, so keyboard users get the same affordance as mouse users.',
    })
  }

  if (/text-shadow[^;]*;?\s*$/m.test(src) && /color\s*:\s*#fff/i.test(src) && support !== 'limited') {
    // Neon-style effects trade contrast for glow; worth one line, not a warning.
    accessibility.push({
      severity: 'info',
      title: 'Glow relies on a dark backdrop',
      detail: 'Light text plus heavy shadow needs a dark surface to stay legible. Check contrast if you place it on a light background.',
    })
  }

  return {
    features,
    accessibility,
    support,
    cssBytes: css.length,
    ruleCount,
    keyframeCount,
    animates,
    hasInfiniteAnimation,
    respectsReducedMotion,
  }
}

/* ------------------------------------------------------------------ *
 *  Reduced-motion guard generation
 * ------------------------------------------------------------------ */

/**
 * Every class selector the CSS defines, deduped and in source order.
 * Used to scope the generated reduced-motion block to this effect only —
 * a blanket `*` rule would stomp on the host page.
 */
export function selectorsIn(css: string): string[] {
  const src = stripComments(css)
  const found: string[] = []
  const seen = new Set<string>()
  // Match the leading `.class` of each rule, ignoring @keyframes bodies.
  const withoutKeyframes = src.replace(/@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g, '')
  for (const m of withoutKeyframes.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      found.push(m[1])
    }
  }
  return found
}

/**
 * Build a `@media (prefers-reduced-motion: reduce)` block that neutralizes
 * this effect's motion, scoped to the classes it actually defines.
 *
 * Returns null when there's nothing to guard — either the effect doesn't
 * animate, or it already ships its own guard.
 *
 * Collapses durations rather than setting `animation: none`. That looks
 * like a detail and isn't: plenty of effects declare their *resting* state
 * only in the keyframes — a meter whose fill runs `width: 0 → 62%` has no
 * width in the rule at all. `animation: none` drops the fill along with
 * the motion and the meter reads 100%. Running the animation once, in
 * 1ms, lands on the final keyframe instead, so the element ends up exactly
 * where the motion would have left it.
 *
 * Delays are zeroed for the same reason. This catalog staggers heavily —
 * equalizer bars, list entrances, timeline nodes and segmented meters all
 * offset each child by 100ms or so. Collapsing only the duration leaves
 * those delays intact, so a reduced-motion user still watches half a
 * second of elements popping in one by one. Caught by
 * scripts/test-motion-guard.mts, which compares rendered frames rather
 * than trusting the rule to be right.
 */
export function reducedMotionGuard(css: string): string | null {
  const insights = analyzeEffect(css)
  if (!insights.animates || insights.respectsReducedMotion) return null

  const classes = selectorsIn(css)
  if (classes.length === 0) return null

  /*
   * Scope to every `fx-` class the effect defines, not just the first.
   *
   * Generated effects have exactly one, so this emits the same six arms it
   * always did. Hand-written ones don't: "Animated Marching Dashes" has
   * four, and the animated element carries a different class from the
   * wrapper. Scoping to `classes[0]` happened to work there only because
   * the wrapper is listed first AND is a DOM ancestor — reverse either and
   * the guard silently covers nothing. Enumerating them removes the
   * assumption rather than restating it.
   *
   * The six arms per root matter too: `.root *` does NOT match
   * `.root .child::after`, and ping/ripple effects animate precisely
   * there. Missing those two arms shipped a guard that read correctly and
   * did nothing for the status pill and the presence avatar.
   */
  const fxClasses = classes.filter((c) => c.startsWith('fx-'))
  const roots = fxClasses.length > 0 ? fxClasses : [classes[0]]

  const selectors = roots
    .flatMap((root) => [
      `.${root}`,
      `.${root}::before`,
      `.${root}::after`,
      `.${root} *`,
      `.${root} *::before`,
      `.${root} *::after`,
    ])
    .map((s) => `  ${s}`)
    .join(',\n')

  return `@media (prefers-reduced-motion: reduce) {
${selectors} {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}`
}

/**
 * Append a reduced-motion guard to an effect's CSS when it needs one.
 *
 * Applied to the whole catalog as it's assembled, so every copy path —
 * the clipboard, the ZIP, the public API, the CLI, the framework
 * exporters, the embed route — ships the guard without any of them
 * knowing about it. Deriving it here rather than baking it into the
 * generated JSON also means it covers the hand-written effects, and that
 * regenerating the catalog can't silently drop it.
 *
 * Only effects that animate *forever* are guarded. A 200ms hover
 * transition is not a vestibular hazard, and stripping those would make a
 * third of the catalog feel broken for the people opting in. Effects that
 * merely animate on interaction are still offered a guard in the Insights
 * tab; they just don't get one imposed.
 */
export function withMotionGuard(css: string): string {
  const { hasInfiniteAnimation, respectsReducedMotion } = analyzeEffect(css)
  if (!hasInfiniteAnimation || respectsReducedMotion) return css

  const guard = reducedMotionGuard(css)
  return guard ? `${css}\n\n${guard}` : css
}
