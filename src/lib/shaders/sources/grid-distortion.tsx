'use client'

/**
 * Grid Distortion — a ruled grid that bends toward the pointer.
 *
 * The grid is not moved; the *space* is. Every pixel resolves its own
 * position, pulls it toward the pointer by a gaussian falloff, and then
 * asks which grid cell that pulled position lands in. Lines therefore bend
 * continuously rather than translating, and the deformation is local — two
 * cells away the grid is exactly where it was.
 *
 * Pointer-reactive, so it opts into tracking. On a touch screen there is no
 * pointer and the grid rests at centre with only its idle wave running,
 * which is a reasonable thing to look at rather than a broken one.
 *
 * Anti-aliasing is by hand. `fwidth` needs `OES_standard_derivatives` on
 * WebGL 1, and a design that silently fails to compile on a driver without
 * it is worse than one whose lines are a shade soft.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const GRID_DISTORTION_PROGRAM: GLProgram = {
  id: 'grid-distortion',
  kind: 'webgl',
  speed: 1,
  pointer: true,
  light: { c0: '#0f172a', c1: '#6366f1', c2: '#e11d48', bg: '#f8fafc' },
  dark: { c0: '#64748b', c1: '#818cf8', c2: '#fb7185', bg: '#050810' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  vec2 m = aspect(u_pointer);

  vec2 d = p - m;
  float pull = exp(-dot(d, d) * 3.4);

  // Toward the pointer, hardest at the centre of the falloff. The epsilon
  // keeps normalize() defined at exactly the pointer's position.
  vec2 q = p - normalize(d + vec2(1e-5)) * pull * 0.34;

  // A slow idle wave so the grid is alive before anyone touches it.
  q += 0.045 * vec2(sin(q.y * 2.0 + u_time * 0.4), cos(q.x * 2.0 - u_time * 0.3));

  float cells = 14.0;
  vec2 g = q * cells;
  vec2 f = abs(fract(g) - 0.5);
  float line = min(f.x, f.y);

  // Line width in cell units, widened by roughly one device pixel.
  float aa = 1.6 * cells / u_resolution.y;
  float grid = 1.0 - smoothstep(0.018, 0.018 + aa * 2.0, line);

  vec3 col = mix(u_bg, mix(u_c0, u_c1, pull), grid);
  col += u_c2 * pull * grid * 0.55;

  // The lens itself, faintly, so the distortion has a source.
  col += u_c1 * pull * 0.10;

  return vec4(col, 1.0);
}
`,
}

export function GridDistortion({ className }: { className?: string }) {
  return <ShaderSurface program={GRID_DISTORTION_PROGRAM} className={className} />
}
