/**
 * Hand-authored metadata for every shader effect.
 *
 * No GLSL here and no colours here. The programs live in `./sources/*.tsx`
 * and the markup and fallback CSS are *derived* from their palettes at
 * build time (`scripts/build-shader-sources.mts`), which is the only way a
 * design's gradient fallback can be guaranteed to match the design.
 * Anything a person has to retype is something that goes stale, and a
 * fallback that has drifted from its shader is invisible until the one
 * visitor without WebGL arrives.
 *
 * DATA-CHEAP rather than data-free: this module is ~4 KB and the client
 * does import it, through `./shader-effects`. The 30 KB of shader source
 * does not come with it.
 *
 * A record's `id` must equal its source filename without the extension, the
 * same convention the block catalog uses. `./registry` pairs the two and
 * `shaders.test.ts` fails when they disagree.
 */

import type { EffectCategory } from '../effect-types'
import type { EffectRenderer } from './shader-types'

export interface ShaderRecord {
  id: string
  name: string
  category: EffectCategory
  description: string
  tags: string[]
  /** Which backend paints it. Drives the spec row and the `/library` filter. */
  renderer: Exclude<EffectRenderer, 'css'>
  /** The component exported by `./sources/<id>.tsx`, for the docs and the CLI. */
  exportName: string
  /** Curated pick — what the "Featured" filters surface. */
  featured?: boolean
}

/**
 * The fifteen designs, in the order they should be met.
 *
 * Ordered by how immediately each one answers "what is this tier for":
 * aurora first because it is the comparison everyone loses, then the
 * generative fields, then the reactive ones, with the two 2D designs last
 * because they are the exceptions rather than the pitch.
 */
export const SHADER_CATALOG: ShaderRecord[] = [
  {
    id: 'aurora-veil',
    name: 'Aurora Veil',
    category: 'Backgrounds',
    description:
      'Three drifting curtains of light with the vertical striation a real aurora has — the one background a blurred CSS gradient can never be mistaken for.',
    tags: ['aurora', 'background', 'gradient', 'hero', 'northern lights', 'shader'],
    renderer: 'webgl',
    exportName: 'AuroraVeil',
    featured: true,
  },
  {
    id: 'plasma-field',
    name: 'Plasma Field',
    category: 'Backgrounds',
    description:
      'Four interfering sine waves coloured by their own interference. About fifteen instructions a pixel, which makes it the cheapest full-bleed background here.',
    tags: ['plasma', 'background', 'demoscene', 'waves', 'retro', 'shader'],
    renderer: 'webgl',
    exportName: 'PlasmaField',
    featured: true,
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    category: 'Backgrounds',
    description:
      'Noise sampled at a position that is itself noise, twice, then cut into contours so the folds read as a polished surface rather than as fog.',
    tags: ['liquid', 'metal', 'chrome', 'fluid', 'background', 'shader'],
    renderer: 'webgl',
    exportName: 'LiquidMetal',
    featured: true,
  },
  {
    id: 'iridescence',
    name: 'Iridescence',
    category: 'Filters & Blend Modes',
    description:
      'Thin-film interference: one phase read by three cosines a third of a turn apart, so the hue sweeps the whole palette instead of crossfading between two ends of it.',
    tags: ['iridescent', 'oil slick', 'holographic', 'rainbow', 'film', 'shader'],
    renderer: 'webgl',
    exportName: 'Iridescence',
    featured: true,
  },
  {
    id: 'dither-gradient',
    name: 'Dither Gradient',
    category: 'Filters & Blend Modes',
    description:
      'A two-tone field resolved by an 8x8 Bayer matrix — the 1-bit look, with the dither grid pinned to layout pixels so it survives a retina screen.',
    tags: ['dither', 'bayer', 'retro', '1-bit', 'pixel', 'shader'],
    renderer: 'webgl',
    exportName: 'DitherGradient',
    featured: true,
  },
  {
    id: 'halftone-wave',
    name: 'Halftone Wave',
    category: 'Patterns & Textures',
    description:
      'A dot screen set at the print angle, its dots sized by a travelling wave. At 0 degrees it reads as a table of dots; at 23 it reads as tone.',
    tags: ['halftone', 'print', 'dots', 'screen', 'pattern', 'shader'],
    renderer: 'webgl',
    exportName: 'HalftoneWave',
  },
  {
    id: 'metaball-lava',
    name: 'Metaball Lava',
    category: 'Backgrounds',
    description:
      'Six inverse-square fields thresholded into one body, so blobs grow a neck as they merge. No amount of border-radius produces a neck.',
    tags: ['metaball', 'blob', 'lava lamp', 'implicit surface', 'background', 'shader'],
    renderer: 'webgl',
    exportName: 'MetaballLava',
    featured: true,
  },
  {
    id: 'ferrofluid',
    name: 'Ferrofluid',
    category: 'Backgrounds',
    description:
      'A metaball field whose blobs grow spikes along the field lines, faded in toward the surface so the cores stay round. Almost entirely specular, like the real material.',
    tags: ['ferrofluid', 'magnetic', 'spikes', 'blob', 'dark', 'shader'],
    renderer: 'webgl',
    exportName: 'Ferrofluid',
  },
  {
    id: 'lightning-arc',
    name: 'Lightning Arc',
    category: 'Glow & Neon',
    description:
      'Three filaments on their own strike clocks, most cycles passing with nothing at all. A bolt that is always there is a squiggle; the waiting is the effect.',
    tags: ['lightning', 'electric', 'storm', 'glow', 'strike', 'shader'],
    renderer: 'webgl',
    exportName: 'LightningArc',
  },
  {
    id: 'hyperspeed',
    name: 'Hyperspeed',
    category: '3D & Perspective',
    description:
      'Streaks accelerating out of a vanishing point, each hottest at its head. Done in polar coordinates, so 180 of them cost exactly what one does.',
    tags: ['hyperspace', 'warp', 'speed', 'streaks', 'starfield', 'shader'],
    renderer: 'webgl',
    exportName: 'Hyperspeed',
    featured: true,
  },
  {
    id: 'plasma-orb',
    name: 'Plasma Orb',
    category: 'Glow & Neon',
    description:
      'A sphere with a turbulent surface, a fresnel rim and a halo that fades into the page rather than into a black square. Leans toward the pointer.',
    tags: ['orb', 'sphere', 'glow', 'plasma', 'interactive', 'shader'],
    renderer: 'webgl',
    exportName: 'PlasmaOrb',
    featured: true,
  },
  {
    id: 'grid-distortion',
    name: 'Grid Distortion',
    category: 'Patterns & Textures',
    description:
      'A ruled grid where the space bends toward the pointer, not the lines. Two cells away the grid is exactly where it was.',
    tags: ['grid', 'distortion', 'lens', 'interactive', 'pointer', 'shader'],
    renderer: 'webgl',
    exportName: 'GridDistortion',
  },
  {
    id: 'ripple-grid',
    name: 'Ripple Grid',
    category: 'Patterns & Textures',
    description:
      'A lattice of dots swelling with two waves — a slow one from the centre and a tight ring that arrives with the pointer. Each dot samples at its own cell, so it stays a grid.',
    tags: ['grid', 'ripple', 'dots', 'wave', 'interactive', 'shader'],
    renderer: 'webgl',
    exportName: 'RippleGrid',
  },
  {
    id: 'ascii-rain',
    name: 'ASCII Rain',
    category: 'Text',
    description:
      'A noise field resolved as monospace glyphs, ordered by ink coverage, with per-column drops falling through it. Canvas 2D, so the ramp is a string you can edit.',
    tags: ['ascii', 'terminal', 'matrix', 'text', 'canvas', 'rain'],
    renderer: 'canvas',
    exportName: 'AsciiRain',
    featured: true,
  },
  {
    id: 'particle-drift',
    name: 'Particle Drift',
    category: 'Backgrounds',
    description:
      'Sixty-four particles that draw a line when they come within range and lean toward the pointer. The links are the effect, and they are why this cannot be a shader.',
    tags: ['particles', 'constellation', 'network', 'canvas', 'interactive', 'background'],
    renderer: 'canvas',
    exportName: 'ParticleDrift',
  },
]

/** How many shader effects exist. */
export const SHADER_COUNT = SHADER_CATALOG.length

const BY_ID = new Map(SHADER_CATALOG.map((r) => [r.id, r]))

/** Look up one shader record. Returns undefined for a CSS effect's id. */
export function getShaderRecord(id: string): ShaderRecord | undefined {
  return BY_ID.get(id)
}

/** True when this id belongs to the shader tier. */
export function isShaderEffect(id: string): boolean {
  return BY_ID.has(id)
}
