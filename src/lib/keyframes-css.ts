/**
 * The animation model, and the CSS it turns into.
 *
 * Two pages emit `@keyframes`: `/tools/motion` shows a gallery of the
 * animations a UI actually uses, and `/tools/keyframes` lets you author one
 * on a timeline. They used to be strangers — the gallery held hand-written
 * CSS strings, the editor held a stop model and its own emitter — which is
 * how a gallery ends up handing out a preset the editor next door cannot
 * open, and how the two drift on the details that matter (which guard, which
 * fill mode, whether a stop that says nothing is a hole).
 *
 * So the model lives here and both read it. The gallery's CSS is *derived*
 * from the same stops the editor would load, which makes "edit this preset"
 * a promise the code keeps: what you see in the gallery is what opens.
 *
 * Nothing in this file touches the DOM or React — it is string building over
 * plain data, so it is testable, and it is (see `keyframes-css.test.ts`).
 */

/** One frame on the timeline. */
export interface Stop {
  id: number
  /** Position on the timeline, 0–100. */
  at: number
  /** Percent. 100 is fully opaque. */
  opacity: number
  x: number
  y: number
  /** Percent. 100 is untouched. */
  scale: number
  rotate: number
  blur: number
}

export type Direction = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
export type Fill = 'none' | 'forwards' | 'backwards' | 'both'

/** Everything about an animation except what it is called. */
export interface Animation {
  duration: number
  delay: number
  easing: string
  /** 0 is stored as the infinite loop — a zero-iteration animation is not a thing. */
  iterations: number
  direction: Direction
  fill: Fill
  stops: Stop[]
}

/** A stop that changes nothing. */
export const NEUTRAL: Omit<Stop, 'id' | 'at'> = {
  opacity: 100,
  x: 0,
  y: 0,
  scale: 100,
  rotate: 0,
  blur: 0,
}

/**
 * A stop, written the way a preset wants to write one.
 *
 * Ids are positional rather than generated: a preset is a literal, the
 * editor keys its timeline on the id, and `at` is the only thing a reader
 * of the preset should have to look at twice.
 */
export function stopAt(
  at: number,
  over: Partial<Omit<Stop, 'id' | 'at'>> = {},
): Omit<Stop, 'id'> {
  return { at, ...NEUTRAL, ...over }
}

/** Ids assigned in timeline order, so a preset never has to spell them out. */
export function withIds(stops: Omit<Stop, 'id'>[]): Stop[] {
  return stops.map((s, i) => ({ ...s, id: i + 1 }))
}

export function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** A stop that changes nothing needs no transform at all. */
export function transformOf(stop: Stop): string {
  const parts: string[] = []
  if (stop.x !== 0 || stop.y !== 0) parts.push(`translate(${stop.x}px, ${stop.y}px)`)
  if (stop.rotate !== 0) parts.push(`rotate(${stop.rotate}deg)`)
  if (stop.scale !== 100) parts.push(`scale(${round(stop.scale / 100)})`)
  return parts.join(' ')
}

export function declarationsOf(stop: Stop): string[] {
  const out: string[] = []
  const transform = transformOf(stop)
  if (transform) out.push(`transform: ${transform};`)
  if (stop.opacity !== 100) out.push(`opacity: ${round(stop.opacity / 100)};`)
  if (stop.blur !== 0) out.push(`filter: blur(${stop.blur}px);`)
  /*
    A stop that says nothing is not a no-op — it is a hole.

    With `filter` declared at 0% and 50% but not at 100%, the property
    animates back to its *unanimated* value over the last half, which is
    almost never what was drawn. Rather than emit every property at every
    stop (noisy) the neutral value is written explicitly whenever the stop
    would otherwise be empty, so the frame is always fully specified.
  */
  if (out.length === 0) out.push('transform: none;')
  return out
}

/**
 * Sanitised for `@keyframes` and for a class selector.
 *
 * The name lands in two places that accept different things, and an ident
 * that starts with a digit is invalid in both. Empty falls back rather than
 * emitting `@keyframes {`, which would break the whole stylesheet.
 */
export function safeName(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, 'a$1')
  return slug || 'animation'
}

/** Stops in timeline order. The editor stores them in creation order. */
export function sortStops(stops: Stop[]): Stop[] {
  return [...stops].sort((a, b) => a.at - b.at)
}

/** True when the animation never stops on its own. */
export function loops(anim: Pick<Animation, 'iterations'>): boolean {
  return anim.iterations === 0
}

export function keyframesBlock(name: string, stops: Stop[]): string {
  return `@keyframes ${name} {\n${sortStops(stops)
    .map(
      (stop) =>
        `  ${round(stop.at)}% {\n${declarationsOf(stop)
          .map((d) => `    ${d}`)
          .join('\n')}\n  }`,
    )
    .join('\n')}\n}`
}

/**
 * The `animation` shorthand, with every sub-property left at its initial
 * value omitted.
 *
 * The shorthand resets what it does not name, so `1 normal none` is three
 * tokens that mean "as it would have been anyway" — noise in a snippet
 * someone is about to paste into a stylesheet and read later. Delay is the
 * one that cannot be reordered: two time values in a shorthand are read as
 * duration then delay, in that order, wherever they appear.
 */
export function animationShorthand(anim: Animation): string {
  const parts = [`${anim.duration}ms`, anim.easing]
  if (anim.delay) parts.push(`${anim.delay}ms`)
  if (loops(anim)) parts.push('infinite')
  else if (anim.iterations !== 1) parts.push(String(anim.iterations))
  if (anim.direction !== 'normal') parts.push(anim.direction)
  if (anim.fill !== 'none') parts.push(anim.fill)
  return parts.join(' ')
}

export function classBlock(name: string, anim: Animation): string {
  return `.${name} {\n  animation: ${name} ${animationShorthand(anim)};\n}`
}

/**
 * Two different guards, and which one is right depends on the animation.
 *
 * A looping animation has to stop outright — shortening it to a millisecond
 * leaves it looping forever at high speed, which is worse than the original.
 * A one-shot animation should still *arrive*: collapsing the duration lets
 * it land on its final frame instantly, so `fill: forwards` layouts do not
 * break. Deleting the rule instead would leave such an element stuck at its
 * from-state — invisible forever, on the one setting meant to help.
 */
export function reducedMotionGuard(name: string, looping: boolean): string {
  return `@media (prefers-reduced-motion: reduce) {
  .${name} {
${
  looping
    ? '    animation: none;'
    : '    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;'
}
  }
}`
}

/** Keyframes, the class that drives them, and the guard. In that order. */
export function buildAnimationCss(rawName: string, anim: Animation): string {
  const name = safeName(rawName)
  return [
    keyframesBlock(name, anim.stops),
    classBlock(name, anim),
    reducedMotionGuard(name, loops(anim)),
  ].join('\n\n')
}
