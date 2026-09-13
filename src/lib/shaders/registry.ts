/**
 * Shader id → the program that paints it.
 *
 * The same modules whose text ships as the effect's source, for the reason
 * `blocks/registry.tsx` gives: a preview built from a re-expressed copy
 * drifts from what the user pastes, and the drift is only ever caught by
 * eye. Pointing both at one file makes that unrepresentable.
 *
 * ⚠️  This module is ~30 KB of GLSL. Nothing on a render path should import
 * it statically. `<ShaderRuntime>` reaches it through a dynamic `import()`
 * the first time it actually sees a shader canvas, so a visitor who never
 * scrolls past a CSS effect never downloads a shader.
 *
 * Static imports inside it, though: the map has to be exhaustive the moment
 * it loads, because the scanner's whole job is to answer "what is this
 * canvas" synchronously once the chunk has arrived. Fifteen programs in one
 * chunk is cheaper than fifteen round trips.
 */

import type { ShaderProgram } from './runtime'

import { AURORA_VEIL_PROGRAM } from './sources/aurora-veil'
import { PLASMA_FIELD_PROGRAM } from './sources/plasma-field'
import { LIQUID_METAL_PROGRAM } from './sources/liquid-metal'
import { IRIDESCENCE_PROGRAM } from './sources/iridescence'
import { DITHER_GRADIENT_PROGRAM } from './sources/dither-gradient'
import { HALFTONE_WAVE_PROGRAM } from './sources/halftone-wave'
import { METABALL_LAVA_PROGRAM } from './sources/metaball-lava'
import { FERROFLUID_PROGRAM } from './sources/ferrofluid'
import { LIGHTNING_ARC_PROGRAM } from './sources/lightning-arc'
import { HYPERSPEED_PROGRAM } from './sources/hyperspeed'
import { PLASMA_ORB_PROGRAM } from './sources/plasma-orb'
import { GRID_DISTORTION_PROGRAM } from './sources/grid-distortion'
import { RIPPLE_GRID_PROGRAM } from './sources/ripple-grid'
import { ASCII_RAIN_PROGRAM } from './sources/ascii-rain'
import { PARTICLE_DRIFT_PROGRAM } from './sources/particle-drift'

export const SHADER_PROGRAMS: ShaderProgram[] = [
  AURORA_VEIL_PROGRAM,
  PLASMA_FIELD_PROGRAM,
  LIQUID_METAL_PROGRAM,
  IRIDESCENCE_PROGRAM,
  DITHER_GRADIENT_PROGRAM,
  HALFTONE_WAVE_PROGRAM,
  METABALL_LAVA_PROGRAM,
  FERROFLUID_PROGRAM,
  LIGHTNING_ARC_PROGRAM,
  HYPERSPEED_PROGRAM,
  PLASMA_ORB_PROGRAM,
  GRID_DISTORTION_PROGRAM,
  RIPPLE_GRID_PROGRAM,
  ASCII_RAIN_PROGRAM,
  PARTICLE_DRIFT_PROGRAM,
]

const BY_ID = new Map(SHADER_PROGRAMS.map((p) => [p.id, p]))

/** The program for a shader id, or undefined for an id that is not one. */
export function getShaderProgram(id: string): ShaderProgram | undefined {
  return BY_ID.get(id)
}
