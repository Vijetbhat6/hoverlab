/**
 * Read side of the motion-safety profile: id in, profile out.
 *
 * The rows are written by `scripts/build-effect-motion.mts` and checked
 * against a fresh analysis by `scripts/check-effect-motion.mts`. This file
 * only looks them up and expands the short keys, so it is safe from a route
 * handler or a server component.
 *
 * It is a separate file from `effect-motion.ts` so the pure analysis (which
 * the build script and the tests import) does not drag the generated JSON
 * along with it.
 *
 * `measured` is the one place a real browser reading can appear. It is set
 * only for effects in `effect-motion-validation.json`, which is written by
 * `scripts/validate-effect-motion.mts` from Chromium `layout-shift` entries.
 * Every other effect has the static category and nothing numeric.
 */

import MOTION from './generated-effect-motion.json'
import VALIDATION from './effect-motion-validation.json'
import { expandMotion, type CompactMotion, type ExpandedMotion } from './effect-motion'

export interface MeasuredShift {
  /** Sum of `layout-shift` values attributed to the preview over the window. */
  cls: number
  /** How many separate layout-shift entries that was. */
  entries: number
  /** Observation window, in seconds. */
  windowSeconds: number
}

export type EffectMotionRecord = ExpandedMotion & {
  /** Present only when a real-browser reading exists for this effect. */
  measured?: MeasuredShift
}

const ROWS = MOTION as unknown as Record<string, CompactMotion>
const MEASURED = (VALIDATION as unknown as { effects: Record<string, { measured: MeasuredShift }> }).effects

/** The profile for one effect id, or undefined for an id that has no row. */
export function getEffectMotion(id: string): EffectMotionRecord | undefined {
  const row = ROWS[id]
  if (!row) return undefined
  const expanded = expandMotion(row)
  const measured = MEASURED[id]?.measured
  return measured && expanded.applicable ? { ...expanded, measured } : expanded
}

/** Summary of the browser validation, for the badge's footnote. */
export function motionValidationSummary(): { sample: number; agreed: number } {
  const v = VALIDATION as unknown as { summary?: { sample: number; agreed: number } }
  return v.summary ?? { sample: 0, agreed: 0 }
}
