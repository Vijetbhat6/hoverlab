/**
 * Unbounded animation with no reduced-motion handling.
 *
 * WHY THIS IS A DESIGN BUG AND NOT A NICETY
 *
 * `prefers-reduced-motion` is set by people who get migraines, nausea or
 * vertigo from movement — vestibular disorders, and a meaningful share of
 * anyone with a concussion history. An infinite animation is the worst case
 * for them, because unlike a transition it never stops: there is no moment
 * at which the page becomes usable again. WCAG 2.2 puts the AAA version of
 * this at 2.3.3, but the AA argument is simpler and it is 2.2.2 — moving
 * content that starts automatically and runs for more than five seconds
 * needs a way to pause it, and an unguarded `animate-spin` has none.
 *
 * THE DISTINCTION THAT MAKES THIS RULE USEFUL
 *
 * Decorative loops should STOP. A pulsing dot, a shimmering skeleton, a
 * marquee — none of them carry information, so `motion-safe:` is right:
 * the animation simply does not exist for someone who asked for less.
 *
 * Status spinners are different, and this is where a naive version of the
 * rule does harm. Freezing a spinner leaves a stopped spinner next to
 * "Signing in", which reads as a hung request — that removes the feedback
 * rather than the discomfort. Those want degrading, not stopping:
 * `motion-reduce:[animation-duration:2s]` slows the rotation while keeping
 * it legible as progress.
 *
 * So a finding is an infinite animation utility with *neither* form of
 * handling anywhere in the file, and the message names both fixes rather
 * than prescribing one, because which is right depends on whether the
 * movement means anything.
 *
 * GRANULARITY, STATED HONESTLY
 *
 * Handling is checked per file, not per element: the guard may sit on a
 * wrapper or in a sibling class string, and file-level is the only honest
 * granularity for a static pass. It can miss a file that guards one
 * animation and not another — which is why the message names the utilities
 * it found rather than claiming the file is clean.
 */

import { lineAt } from './jsx.mjs'

/**
 * Tailwind utilities that produce an unbounded animation.
 *
 * The four named ones are `infinite` in Tailwind's own definitions.
 * `animate-[…]` is the arbitrary form — matched broadly and then checked
 * for `infinite`, since an arbitrary one-shot runs once and stops and is
 * not what the preference is about.
 */
const NAMED_INFINITE = /\banimate-(spin|pulse|bounce|ping)\b/g
const ARBITRARY = /\banimate-\[([^\]]*)\]/g

/** Either accepted form of handling, plus the hand-written media query. */
const MOTION_SAFE = /\bmotion-safe:/
const MOTION_REDUCE = /\bmotion-reduce:/
const MEDIA_QUERY = /prefers-reduced-motion/

/**
 * Infinite animation utilities in a source, with where each one sits.
 *
 * Returns the first occurrence of each distinct utility rather than every
 * occurrence: five `animate-pulse` in a skeleton is one decision, not five,
 * and a report that lists it five times is a report that gets skimmed.
 */
export function animatedUtilities(source) {
  const found = new Map()

  for (const m of source.matchAll(NAMED_INFINITE)) {
    if (!found.has(m[0])) found.set(m[0], m.index)
  }
  for (const m of source.matchAll(ARBITRARY)) {
    if (!m[1]?.includes('infinite')) continue
    if (!found.has(m[0])) found.set(m[0], m.index)
  }

  return [...found].map(([utility, index]) => ({ utility, index }))
}

/** True when the file handles reduced motion in any of the three ways. */
export function hasMotionHandling(source) {
  return MOTION_SAFE.test(source) || MOTION_REDUCE.test(source) || MEDIA_QUERY.test(source)
}

/**
 * @param {string} source
 * @returns {{ rule: string, family: string, sc: string, severity: string, line: number, message: string, fix: string }[]}
 */
export function reviewMotion(source) {
  const utilities = animatedUtilities(source)
  if (utilities.length === 0) return []
  if (hasMotionHandling(source)) return []

  return utilities.map(({ utility, index }) => ({
    rule: 'unguarded-infinite-animation',
    family: 'motion',
    sc: '2.2.2',
    severity: 'violation',
    line: lineAt(source, index),
    message: `${utility} runs forever with no reduced-motion handling in this file`,
    fix:
      `If the movement is decorative, gate it: motion-safe:${utility}. ` +
      `If it is status — a spinner next to "Saving…" — do not stop it, slow it: ` +
      `add motion-reduce:[animation-duration:2s] so it stays legible as progress.`,
  }))
}
