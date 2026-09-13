'use client'

/**
 * Dither Gradient — a two-tone gradient, resolved by an 8×8 ordered matrix.
 *
 * A gradient is the one thing CSS does perfectly, so this is deliberately
 * the opposite of one: the field is quantised to two or three tones and the
 * in-between values are carried by a Bayer threshold pattern instead of by
 * colour. What you get is the 1-bit look — Playdate, old Mac, Obra Dinn —
 * which cannot be approximated by `background-image` at any size, because
 * the pattern has to be evaluated per pixel against a moving field.
 *
 * The dither grid is expressed against `u_resolution`, not `gl_FragCoord`.
 * Threshold patterns are usually written in device pixels, and on a 2x
 * screen that halves the apparent cell size — a dither that disappears on
 * the machines designers own is not a dither.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const DITHER_GRADIENT_PROGRAM: GLProgram = {
  id: 'dither-gradient',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#334155', c1: '#0f172a', c2: '#64748b', bg: '#f1f5f9' },
  dark: { c0: '#a3e635', c1: '#ecfccb', c2: '#365314', bg: '#0a0f07' },
  fragment: `
vec4 render(vec2 uv) {
  // 140 dither cells across the short axis, whatever the device pixel
  // ratio is. Aspect-corrected so the cells stay square.
  vec2 cell = floor(uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 140.0);

  vec2 p = aspect(uv);
  float t = u_time * 0.09;

  /*
   * The field being dithered: a vertical ramp with slow noise on top, so
   * the boundary between tones creeps rather than sitting still. The ramp
   * has to dominate — weighted evenly with the noise, as it was, the tone
   * boundaries wander far enough that the result reads as static rather
   * than as a dithered gradient.
   */
  float field = 0.95 * (1.0 - uv.y) + 0.38 * fbm(p * 1.5 + vec2(t, t * 0.6));

  float threshold = bayer8(cell);
  float lit = step(threshold, field);
  float hot = step(threshold + 0.34, field);

  vec3 col = mix(u_bg, u_c2, lit);
  col = mix(col, u_c0, hot);
  col = mix(col, u_c1, step(threshold + 0.62, field));

  return vec4(col, 1.0);
}
`,
}

export function DitherGradient({ className }: { className?: string }) {
  return <ShaderSurface program={DITHER_GRADIENT_PROGRAM} className={className} />
}
