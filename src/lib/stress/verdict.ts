/**
 * Turn two measurements into a pass or a fail.
 *
 * Pure Node, no browser: `measure.ts` produces the numbers in the page and
 * this decides what they mean, so every rule here has a test that needs
 * nothing but two hand-written measurements.
 *
 * ── THE PRINCIPLE: WHAT DID THE STRESS ADD? ─────────────────────────────
 *
 * A condition is judged against a baseline, not against perfection. A
 * carousel whose track overflows its clip box is the same carousel at 1024
 * and under German text, and blaming German for it produces a report that
 * is mostly noise and that nobody learns to read. Findings are things that
 * were absent in the baseline and present under the stress, or that grew
 * past a threshold.
 *
 * The one exception is reflow (WCAG 1.4.10), which is an absolute test by
 * definition: the page either scrolls sideways at 320px or it does not.
 *
 * ── THREE OUTCOMES, NOT TWO ─────────────────────────────────────────────
 *
 * `na` is for a text stress that had nothing to act on: `huge-numbers` on a
 * block with no numbers in it. Calling that a pass would let "verified under
 * six stresses" include stresses that never ran, so it is its own outcome
 * and the summary shows it as one.
 */

import type { Stress } from './conditions'
import type { StressMeasure } from './measure'

export type FindingCode =
  | 'page-overflow'
  | 'wide-element'
  | 'clipped-text'
  | 'spilled-text'
  | 'overlap'
  | 'shape-lost'
  | 'control-boundary'
  | 'infinite-animation'
  | 'new-violation'

export interface Finding {
  code: FindingCode
  message: string
}

export type Outcome = 'pass' | 'fail' | 'na'

export interface Verdict {
  outcome: Outcome
  findings: Finding[]
}

export interface JudgeInput {
  stress: Stress
  /** The baseline run, or null for an absolute test. */
  base: StressMeasure | null
  run: StressMeasure
  /** Axe violation keys (`rule::target`), where the condition asks for axe. */
  axe?: { base: string[]; run: string[] }
  /** Text nodes the frame rewrote; 0 means the stress had nothing to act on. */
  changed?: number
}

/** More than this many findings of one kind are summarised, not listed. */
const LIST_LIMIT = 3

/** Below these, a difference is layout rounding, not a defect. */
const OVERFLOW_TOLERANCE = 1
const WIDE_TOLERANCE = 8
const CLIP_GROWTH = 12
const OVERLAP_MIN_AREA = 24

const SPINNER = /(^|[-_])(spin|rotate|loader|loading)([-_]|$)/i
/** A status spinner is degraded, not stopped, under reduced motion. */
const SPINNER_MAX_SIZE = 48

function limited(items: string[]): string {
  if (items.length <= LIST_LIMIT) return items.join('; ')
  return `${items.slice(0, LIST_LIMIT).join('; ')}; and ${items.length - LIST_LIMIT} more`
}

export function judge({ stress, base, run, axe, changed }: JudgeInput): Verdict {
  const findings: Finding[] = []

  // ── Nothing to act on ────────────────────────────────────────────────
  if (stress.transform && changed === 0) return { outcome: 'na', findings }

  // ── Page-level overflow ──────────────────────────────────────────────
  const overflowBefore = base?.overflowX ?? 0
  if (run.overflowX > overflowBefore + OVERFLOW_TOLERANCE) {
    const culprits = run.wide
      .filter((w) => !base?.wide.some((b) => b.key === w.key))
      .map((w) => `${w.label} by ${w.reach}px`)
    findings.push({
      code: 'page-overflow',
      message:
        `Scrolls sideways by ${run.overflowX}px at ${run.viewportWidth}px wide` +
        (culprits.length > 0 ? ` (${limited(culprits)})` : '') +
        '.',
    })
  }

  // ── Content reaching past the edge without a scrollbar ───────────────
  // Reflow is judged on the scrollbar alone: at 320px a base that already
  // reaches past the edge would list itself as new, so the absolute test
  // does not compare wide elements at all.
  if (base) {
    const newWide = run.wide.filter(
      (w) => w.reach > WIDE_TOLERANCE && !base.wide.some((b) => b.key === w.key),
    )
    if (newWide.length > 0 && run.overflowX <= overflowBefore + OVERFLOW_TOLERANCE) {
      findings.push({
        code: 'wide-element',
        message: `Content is pushed past the edge and cut off: ${limited(newWide.map((w) => `${w.label} by ${w.reach}px`))}.`,
      })
    }
  }

  // ── Text clipped by its own box ──────────────────────────────────────
  if (base) {
    const newlyClipped = run.clipped.filter((c) => {
      const before = base.clipped.find((b) => b.key === c.key)
      return !before || c.by - before.by >= CLIP_GROWTH
    })
    if (newlyClipped.length > 0) {
      findings.push({
        code: 'clipped-text',
        message: `Text is cut off: ${limited(newlyClipped.map((c) => `${c.label} loses ${c.by}px ${c.axis === 'x' ? 'across' : 'down'}`))}.`,
      })
    }
  }

  // ── Text spilling out of its own box ─────────────────────────────────
  if (base) {
    const newlySpilled = run.spilled.filter((c) => {
      const before = base.spilled.find((b) => b.key === c.key)
      return !before || c.by - before.by >= CLIP_GROWTH
    })
    if (newlySpilled.length > 0) {
      findings.push({
        code: 'spilled-text',
        message: `Text spills out of its box: ${limited(newlySpilled.map((c) => `${c.label} by ${c.by}px`))}.`,
      })
    }
  }

  // ── Text drawn over other text ───────────────────────────────────────
  if (base) {
    const newOverlaps = run.overlaps.filter(
      (o) => o.area >= OVERLAP_MIN_AREA && !base.overlaps.some((b) => b.key === o.key),
    )
    if (newOverlaps.length > 0) {
      findings.push({
        code: 'overlap',
        message: `Text collides: ${limited(newOverlaps.map((o) => `${o.a} over ${o.b}`))}.`,
      })
    }
  }

  // ── Forced colors ────────────────────────────────────────────────────
  if (stress.forcedColors && base) {
    const lost = base.paint
      .filter((p) => p.bg !== p.parentBg && !p.hasEdge && Math.min(p.width, p.height) >= 6)
      .filter((p) => {
        const after = run.paint.find((r) => r.key === p.key)
        // Absent means the fill became transparent; present-and-equal means
        // it became the page background. Either way the shape is gone.
        return !after || after.bg === after.parentBg
      })
    if (lost.length > 0) {
      findings.push({
        code: 'shape-lost',
        message: `Drawn with a fill alone, so invisible in high-contrast: ${limited(lost.map((p) => `${p.label} (${p.width}x${p.height})`))}.`,
      })
    }

    const bare = run.controls.filter((c) => !c.hasBorder && !c.hasOutline)
    if (bare.length > 0) {
      findings.push({
        code: 'control-boundary',
        message: `Form fields with no border, so no visible edge: ${limited(bare.map((c) => c.label))}.`,
      })
    }
  }

  // ── Reduced motion ───────────────────────────────────────────────────
  if (stress.reducedMotion) {
    const endless = run.animations.filter(
      (a) => !(SPINNER.test(a.name) && a.width <= SPINNER_MAX_SIZE && a.height <= SPINNER_MAX_SIZE),
    )
    if (endless.length > 0) {
      findings.push({
        code: 'infinite-animation',
        message: `Still animating forever under reduced motion: ${limited(endless.map((a) => `${a.label} (${a.name}, ${Math.round(a.duration)}ms)`))}.`,
      })
    }
  }

  // ── Axe ──────────────────────────────────────────────────────────────
  if (axe) {
    const seen = new Set(axe.base)
    const added = axe.run.filter((key) => !seen.has(key))
    if (added.length > 0) {
      findings.push({
        code: 'new-violation',
        message: `New accessibility violations: ${limited(added.map((key) => key.replace('::', ' on ')))}.`,
      })
    }
  }

  return { outcome: findings.length > 0 ? 'fail' : 'pass', findings }
}
