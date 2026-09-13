'use client'

/**
 * Plasma Field — four interfering sine waves, coloured by the interference.
 *
 * The oldest demoscene effect there is, and still the cheapest way to fill a
 * hero with something that is unmistakably computed rather than drawn: four
 * sines (two axis-aligned, one diagonal, one radial), summed, then used as
 * the phase of two more. No noise, no texture lookups, no loop — the whole
 * thing is about fifteen instructions and it runs at full rate on a phone.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const PLASMA_FIELD_PROGRAM: GLProgram = {
  id: 'plasma-field',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#a5b4fc', c1: '#fda4af', c2: '#fef08a', bg: '#f8fafc' },
  dark: { c0: '#4338ca', c1: '#be123c', c2: '#fbbf24', bg: '#0b0714' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv) * 1.7;
  float t = u_time * 0.45;

  float v = sin(p.x * 2.0 + t);
  v += sin(p.y * 2.3 - t * 0.8);
  v += sin((p.x + p.y) * 1.7 + t * 0.6);
  v += sin(length(p * 1.35) * 3.0 - t * 1.3);
  v *= 0.25;

  // Two readings of the same field at different frequencies. Using one
  // would give smooth bands; two beating against each other is what makes
  // the cell structure appear and dissolve.
  float a = 0.5 + 0.5 * sin(v * PI * 1.5);
  float b = 0.5 + 0.5 * cos(v * PI * 2.5 + 1.2);

  vec3 col = mix(u_bg, u_c0, a);
  col = mix(col, u_c1, b * 0.65);

  // The accent only appears where both readings peak, which is a small
  // fraction of the surface — an accent everywhere is not an accent.
  col += u_c2 * pow(a * b, 3.0) * 1.1;

  return vec4(col, 1.0);
}
`,
}

export function PlasmaField({ className }: { className?: string }) {
  return <ShaderSurface program={PLASMA_FIELD_PROGRAM} className={className} />
}
