'use client'

/**
 * Halftone Wave — a rotated dot screen whose dots size with a moving field.
 *
 * Print halftones are set at 15°, 45° or 75° because a screen aligned to
 * the page shows its own grid and fights the image. The same is true here:
 * at 0° this reads as a table of dots, and at 23° it reads as tone. That
 * rotation is one `rot()` call and it is the difference between the effect
 * working and not.
 *
 * Dot radius follows a sine lattice blended with fbm — regular enough to
 * read as a screen, irregular enough not to strobe when it moves.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const HALFTONE_WAVE_PROGRAM: GLProgram = {
  id: 'halftone-wave',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#0f172a', c1: '#e11d48', c2: '#2563eb', bg: '#fffbeb' },
  dark: { c0: '#f8fafc', c1: '#f43f5e', c2: '#38bdf8', bg: '#0c0a09' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.32;

  float field = 0.5 + 0.5 * sin(p.x * 3.0 + t) * cos(p.y * 2.6 - t * 0.7);
  field = mix(field, fbm(p * 1.6 + t * 0.25), 0.45);

  // 28 cells across the short axis, rotated to the print angle. Expressed
  // in uv rather than gl_FragCoord so the screen keeps its size on a
  // retina display.
  vec2 g = rot(0.4) * (uv * vec2(u_resolution.x / u_resolution.y, 1.0)) * 28.0;
  vec2 c = fract(g) - 0.5;
  float d = length(c);

  float r = 0.54 * field;
  float dotMask = smoothstep(r, r - 0.09, d);

  vec3 ink = mix(u_c0, u_c1, field);
  vec3 col = mix(u_bg, ink, dotMask);

  // The accent rides only the largest dots, so the second colour arrives
  // as the wave crests rather than tinting the whole screen.
  col = mix(col, u_c2, dotMask * pow(field, 5.0));

  return vec4(col, 1.0);
}
`,
}

export function HalftoneWave({ className }: { className?: string }) {
  return <ShaderSurface program={HALFTONE_WAVE_PROGRAM} className={className} />
}
