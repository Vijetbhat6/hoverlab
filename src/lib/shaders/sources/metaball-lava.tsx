'use client'

/**
 * Metaball Lava — six inverse-square fields, thresholded into one body.
 *
 * Blobs that merge and separate are the canonical demonstration of an
 * implicit surface: nothing here knows about a shape, only about a scalar
 * field that six points contribute to, and the shape is wherever that field
 * crosses 1. Two blobs touching produce the neck that makes the effect
 * recognisable, and no amount of `border-radius` will ever produce a neck.
 *
 * The rim is the field's crossing band rather than an outline of the shape,
 * which is why it thickens where two blobs are about to meet — exactly
 * where the eye is already looking.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const METABALL_LAVA_PROGRAM: GLProgram = {
  id: 'metaball-lava',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#fb923c', c1: '#f43f5e', c2: '#fde68a', bg: '#fff7ed' },
  dark: { c0: '#ea580c', c1: '#9f1239', c2: '#fcd34d', bg: '#120508' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.32;

  float f = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    // Two incommensurate frequencies per ball, so the set never returns to
    // a formation it has already been in.
    vec2 c = vec2(
      cos(t * (0.50 + fi * 0.13) + fi * 2.1) * (0.62 + 0.18 * hash11(fi)),
      sin(t * (0.43 + fi * 0.11) + fi * 1.3) * 0.58
    );
    float r = 0.19 + 0.11 * hash11(fi + 9.0);
    vec2 d = p - c;
    f += r * r / max(dot(d, d), 1e-4);
  }

  float body = smoothstep(0.92, 1.30, f);
  float rim = smoothstep(0.88, 1.02, f) - smoothstep(1.10, 1.75, f);

  vec3 col = mix(u_bg, mix(u_c0, u_c1, clamp(f * 0.30, 0.0, 1.0)), body);
  col += u_c2 * rim * 0.95;

  return vec4(col, 1.0);
}
`,
}

export function MetaballLava({ className }: { className?: string }) {
  return <ShaderSurface program={METABALL_LAVA_PROGRAM} className={className} />
}
