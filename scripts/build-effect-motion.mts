/**
 * Compute the motion-safety profile for every effect and write it down.
 *
 *     npx tsx scripts/build-effect-motion.mts
 *
 * Writes `src/lib/generated-effect-motion.json`: one compact row per effect,
 * keyed by id (short keys, see `CompactMotion` in `src/lib/effect-motion.ts`).
 * The badge on the effect page, the public API and the MCP tool all read it.
 *
 * WHY A FILE AND NOT A LIVE CALL. `analyzeEffectMotion` is pure and fast
 * (about 80 ms for the whole catalog), so it could run per request. It is
 * stored anyway because the profile is a *published claim* about each
 * effect, and a claim that is recomputed silently on every render cannot be
 * diffed in review: changing the analysis would change 200 badges with no
 * trace. As a committed file, a change to the rules shows up as a change to
 * the file, and `scripts/check-effect-motion.mts` fails the build when the
 * two disagree — the same arrangement as the other generated sources.
 *
 * The input is `EFFECTS`, the SHIPPED css with the reduced-motion guard
 * already appended, not the raw generated JSON. See the header of
 * `src/lib/effect-motion.ts` for why that matters.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EFFECTS } from '../src/lib/effects.ts'
import {
  SHADER_MOTION,
  analyzeEffectMotion,
  compactMotion,
  type CompactMotion,
} from '../src/lib/effect-motion.ts'
import { isShaderRenderer } from '../src/lib/shaders/shader-types.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const OUT = join(__dirname, '..', 'src', 'lib', 'generated-effect-motion.json')

/** The compact row for one effect. Shared with the gate so they cannot diverge. */
export function motionRowFor(effect: (typeof EFFECTS)[number]): CompactMotion {
  return isShaderRenderer(effect.renderer)
    ? SHADER_MOTION
    : compactMotion(analyzeEffectMotion(effect.css, effect.html))
}

/** One entry per line: a diff of this file then reads as a diff of effects. */
export function serialise(rows: Record<string, CompactMotion>): string {
  const lines = Object.entries(rows).map(([id, row]) => `${JSON.stringify(id)}:${JSON.stringify(row)}`)
  return `{\n${lines.join(',\n')}\n}\n`
}

export function buildEffectMotion(): { count: number; bytes: number; unclassified: string[] } {
  const rows: Record<string, CompactMotion> = {}
  const unclassified = new Set<string>()
  for (const effect of EFFECTS) {
    rows[effect.id] = motionRowFor(effect)
    if (!isShaderRenderer(effect.renderer)) {
      for (const p of analyzeEffectMotion(effect.css, effect.html).unclassified) unclassified.add(p)
    }
  }
  const text = serialise(rows)
  writeFileSync(OUT, text)
  return { count: EFFECTS.length, bytes: Buffer.byteLength(text), unclassified: [...unclassified] }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { count, bytes, unclassified } = buildEffectMotion()
  console.log(`build-effect-motion: ${count} effects, ${(bytes / 1024).toFixed(1)} KB -> generated-effect-motion.json`)
  if (unclassified.length) {
    console.warn(
      `build-effect-motion: ${unclassified.length} animated propert${unclassified.length === 1 ? 'y has' : 'ies have'} no ruling in effect-motion.ts (counted as paint): ${unclassified.join(', ')}`,
    )
  }
}
