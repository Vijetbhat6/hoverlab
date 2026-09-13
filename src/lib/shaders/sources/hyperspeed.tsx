'use client'

/**
 * Hyperspeed — radial streaks accelerating out of a vanishing point.
 *
 * Everything is done in polar coordinates, which is what makes it cheap:
 * the angle decides which streak a pixel belongs to, and the radius decides
 * where along that streak it is. No geometry, no particles, no list — 180
 * streaks in three rings cost the same as one.
 *
 * Each streak is brightest at its head and fades back along its tail, which
 * is the read: a line of even brightness moving outward looks like a
 * spoke, and a line that is hot at the front looks like speed.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const HYPERSPEED_PROGRAM: GLProgram = {
  id: 'hyperspeed',
  kind: 'webgl',
  speed: 1,
  /*
   * Streaks are darker than the sky in the light palette and brighter than
   * it in the dark one — see the note on `mix` below. A pale streak on a
   * pale sky is a blank card.
   */
  light: { c0: '#0369a1', c1: '#7dd3fc', c2: '#0f172a', bg: '#f0f9ff' },
  dark: { c0: '#38bdf8', c1: '#a855f7', c2: '#f8fafc', bg: '#01030c' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.55;

  float a = atan(p.y, p.x) / (2.0 * PI) + 0.5;   // 0..1 around the circle
  float r = length(p);

  float acc = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float lanes = 60.0 + fi * 34.0;

    float s = a * lanes + fi * 7.0;
    float id = floor(s);
    float rnd = hash11(id * 1.37 + fi * 3.0);

    // The head travels outward and wraps; each lane has its own speed, so
    // the field never organises itself into a rotating wheel.
    float head = fract(rnd + t * (0.35 + rnd * 0.95));
    float len = 0.10 + rnd * 0.24;

    float band = smoothstep(head - len, head, r) * (1.0 - smoothstep(head, head + 0.02, r));

    // Thin the streak across its lane so it is a line, not a wedge.
    float across = abs(fract(s) - 0.5);
    band *= smoothstep(0.45, 0.04, across);

    acc += band * (0.35 + rnd * 0.75);
  }

  // Nothing resolves at the vanishing point — streaks converge there, and
  // drawing them into it turns the centre into a smear.
  acc *= smoothstep(0.04, 0.34, r);

  /*
   * Blended toward the streak colour rather than added to the sky. Adding
   * is the right model for light and the wrong one for a palette whose
   * background is already near white — there, every streak clips to the
   * same colour as the sky it is crossing.
   */
  float amt = clamp(acc, 0.0, 1.0);
  vec3 col = mix(u_bg, mix(u_c0, u_c2, amt), amt);
  col = mix(col, u_c1, pow(max(0.0, 1.0 - r * 1.7), 4.0) * 0.55);

  return vec4(col, 1.0);
}
`,
}

export function Hyperspeed({ className }: { className?: string }) {
  return <ShaderSurface program={HYPERSPEED_PROGRAM} className={className} />
}
