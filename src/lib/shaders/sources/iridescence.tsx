'use client'

/**
 * Iridescence — thin-film interference, which is why the colours cycle.
 *
 * A soap bubble is not coloured. What you see is the film's thickness
 * deciding which wavelengths cancel and which reinforce, so the hue is a
 * function of the *phase*, and the three channels are the same function
 * offset by a third of a turn. That is the entire model here: one phase,
 * three cosines at 120° apart, each weighting a palette colour.
 *
 * Because the three colours are sampled from one continuous phase, the
 * result sweeps through the palette rather than crossfading between two
 * ends of it — a gradient cannot do that, and it is the difference between
 * "oil slick" and "purple to pink".
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const IRIDESCENCE_PROGRAM: GLProgram = {
  id: 'iridescence',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#38bdf8', c1: '#f472b6', c2: '#facc15', bg: '#f8fafc' },
  dark: { c0: '#0ea5e9', c1: '#db2777', c2: '#a3e635', bg: '#07050d' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.18;

  // Stand-in for the film's thickness: a warped field, so the bands bend
  // and pool the way a real film does over an uneven surface.
  vec2 w = vec2(fbm(p * 1.35 + vec2(t, 0.0)), fbm(p * 1.35 + vec2(0.0, t * 0.8)));
  float phase = 6.5 * (w.x - w.y) + length(p) * 2.1 + t * 0.7;

  float a = 0.5 + 0.5 * cos(phase);
  float b = 0.5 + 0.5 * cos(phase + 2.0944);
  float c = 0.5 + 0.5 * cos(phase + 4.1888);

  vec3 col = u_c0 * a + u_c1 * b + u_c2 * c;
  col = mix(u_bg, col, 0.88);

  // A slow grain over the top. Without it the bands are too clean and the
  // surface reads as plastic rather than as a film on something.
  col *= 0.78 + 0.32 * fbm(p * 2.6 - t);

  return vec4(col, 1.0);
}
`,
}

export function Iridescence({ className }: { className?: string }) {
  return <ShaderSurface program={IRIDESCENCE_PROGRAM} className={className} />
}
