'use client'

/**
 * Ripple Grid — a lattice of dots that swells with concentric waves.
 *
 * The grid stays put and the *dots* change size, which is the opposite
 * choice from `grid-distortion` and reads completely differently: a
 * distorted grid looks like a lens, a pulsing one looks like a surface
 * responding. Two waves drive it — a slow one from the centre that never
 * stops, and a tighter ring around the pointer that arrives when it does.
 *
 * Each dot samples the wave at its own cell centre rather than per pixel,
 * so a dot is one size all over instead of being a smooth blob — that is
 * what keeps it reading as a grid of elements and not as a gradient with
 * holes in it.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const RIPPLE_GRID_PROGRAM: GLProgram = {
  id: 'ripple-grid',
  kind: 'webgl',
  speed: 1,
  pointer: true,
  light: { c0: '#2563eb', c1: '#7c3aed', c2: '#06b6d4', bg: '#f1f5f9' },
  dark: { c0: '#3b82f6', c1: '#a855f7', c2: '#22d3ee', bg: '#04070f' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  vec2 m = aspect(u_pointer);

  float cells = 22.0;
  vec2 g = p * cells;
  vec2 id = floor(g);
  vec2 c = fract(g) - 0.5;

  // The cell's centre, back in aspect space. Sampling the waves here and
  // not at the pixel is what makes each dot a single uniform size.
  vec2 centre = (id + 0.5) / cells;

  float r1 = length(centre);
  float r2 = length(centre - m);

  float wave = 0.5 + 0.5 * sin(r1 * 7.0 - u_time * 1.5);
  float ring = exp(-r2 * r2 * 4.5) * (0.5 + 0.5 * sin(r2 * 15.0 - u_time * 3.0));

  float amp = clamp(wave * 0.55 + ring * 0.85, 0.0, 1.0);

  float d = length(c);
  float radius = 0.10 + 0.34 * amp;
  float dotMask = smoothstep(radius, radius - 0.06, d);

  vec3 col = mix(u_bg, mix(u_c0, u_c1, amp), dotMask);
  col += u_c2 * dotMask * ring * 0.75;

  return vec4(col, 1.0);
}
`,
}

export function RippleGrid({ className }: { className?: string }) {
  return <ShaderSurface program={RIPPLE_GRID_PROGRAM} className={className} />
}
