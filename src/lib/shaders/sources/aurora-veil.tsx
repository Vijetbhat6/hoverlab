'use client'

/**
 * Aurora Veil — three drifting ribbons of light over a night sky.
 *
 * The thing that separates an aurora from a blurred gradient is the
 * vertical striation: real curtains are made of parallel strands that
 * brighten and fade independently along their length. A CSS gradient can
 * blur two colours together and it will never do that, which is why this
 * is the first design in the shader tier rather than the hundredth.
 *
 * Each ribbon is a horizontal line whose height wanders with fbm, glowed
 * with a gaussian falloff and then multiplied by a second, much finer noise
 * running across it. Three ribbons, one per palette colour, each on its own
 * clock so they drift apart instead of moving as a block.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const AURORA_VEIL_PROGRAM: GLProgram = {
  id: 'aurora-veil',
  kind: 'webgl',
  speed: 1,
  /*
   * The light palette is saturated where the dark one is bright. Both
   * versions of this design paint the same shapes; what changes is whether
   * a ribbon is lighter or darker than what it is on, and a pastel teal on
   * a near-white sky is neither.
   */
  light: { c0: '#0d9488', c1: '#4f46e5', c2: '#c026d3', bg: '#f4f6ff' },
  dark: { c0: '#34d399', c1: '#6366f1', c2: '#e879f9', bg: '#05060f' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.14;
  vec3 col = u_bg;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);

    // The ribbon's centre line: a slow, large-scale wander. The x term is
    // scaled down hard so the curtain bends across the whole width rather
    // than wobbling within it.
    float centre = 0.42 + fi * 0.16
      + 0.30 * (fbm(vec2(p.x * 0.80 + t * (0.7 + fi * 0.22) + fi * 7.0, t * 0.4)) - 0.5);

    float d = uv.y - centre;

    // Sharp along the top edge and trailing away underneath, because a
    // curtain hangs. A symmetric falloff — which is what this was — gives a
    // horizontal bar of light, and three of them read as an equaliser.
    float glow = d > 0.0 ? exp(-d * d * 150.0) : exp(-d * d * (26.0 + fi * 6.0));

    /*
     * The strands, and the reason this is not a gradient. High frequency
     * across, almost none along: noise sampled that way stretches into
     * vertical filaments rather than resolving into blobs. Two octaves, the
     * second four times finer, so the curtain has structure at the scale
     * you notice and at the scale you only feel.
     */
    float strands =
      0.30 + 0.70 * vnoise(vec2(p.x * 13.0 + t * 2.6 + fi * 5.0, uv.y * 0.8 + fi * 3.0));
    strands *= 0.55 + 0.45 * vnoise(vec2(p.x * 31.0 - t * 1.4, fi * 2.0));

    /*
     * Blended toward the ribbon's colour, not added to it.
     *
     * Adding is what an aurora physically does — it is emitted light — and
     * it is correct on a night sky and useless on a white one, because a
     * near-white background is already at the top of the range and has
     * nowhere to go. Mixing paints the same shapes in either direction:
     * lighter than a dark sky, darker than a pale one. Measured on the
     * render harness, this is the difference between a luminance spread of
     * 9 and one of 130 in the light palette.
     */
    col = mix(col, palette(fi), clamp(glow * strands * (1.0 - fi * 0.12), 0.0, 1.0));
  }

  // A wash at the horizon so the ribbons sit in something rather than
  // floating on a flat field.
  col = mix(col, u_c2, 0.06 * smoothstep(0.85, 0.0, uv.y));

  return vec4(col, 1.0);
}
`,
}

export function AuroraVeil({ className }: { className?: string }) {
  return <ShaderSurface program={AURORA_VEIL_PROGRAM} className={className} />
}
