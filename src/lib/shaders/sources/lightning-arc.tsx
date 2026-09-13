'use client'

/**
 * Lightning Arc — three filaments that strike on their own clocks.
 *
 * The strike is the design. A bolt that is always there is a squiggle; what
 * makes lightning read as lightning is that most of the time there is
 * nothing, and then there is everything for a tenth of a second. So each
 * filament has a discrete phase — `floor(t)` — and a hash on that phase
 * decides whether this cycle strikes at all. Roughly half do.
 *
 * The bolt itself is a vertical line whose x wanders with fbm, drawn twice:
 * a very tight exponential for the core and a wide one for the glow. Two
 * falloffs rather than one is what gives the corona around the filament
 * without blurring the filament itself.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const LIGHTNING_ARC_PROGRAM: GLProgram = {
  id: 'lightning-arc',
  kind: 'webgl',
  speed: 1,
  /*
   * The bolt is dark against a pale sky and white against a black one. A
   * white bolt on a light background is the same failure the aurora had:
   * the brightest thing on screen is already the background.
   */
  light: { c0: '#4338ca', c1: '#a5b4fc', c2: '#1e1b4b', bg: '#eef2ff' },
  dark: { c0: '#6366f1', c1: '#a78bfa', c2: '#f0f9ff', bg: '#04040a' },
  fragment: `
/** Distance from p to a filament that wanders in x as it climbs. */
float filament(vec2 p, float seed, float t) {
  float x = 0.42 * (fbm(vec2(p.y * 1.5 + seed * 11.0, t * 0.5 + seed)) - 0.5) * 2.0;
  return abs(p.x - x);
}

vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time;
  float total = 0.0;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);

    // One strike cycle per filament, offset so they do not fire together.
    float phase = floor(t * 0.85 + fi * 3.3);
    float life = fract(t * 0.85 + fi * 3.3);

    // Not every cycle strikes, and the ones that do decay fast.
    float strikes = step(0.45, hash11(phase * 1.7 + fi * 17.0));
    float flash = strikes * exp(-life * 7.0);

    vec2 q = p;
    q.x -= (hash11(phase + fi * 5.0) - 0.5) * 1.5;

    /*
     * Two falloffs: a very tight one for the core and a wide one for the
     * corona. One would give either a hard line with no atmosphere or a
     * smudge with no filament.
     *
     * The corona carries more weight than a photograph of lightning would
     * justify, because coverage is what makes a bolt visible against a pale
     * sky — a one-pixel dark line on near-white is a hair, not a strike.
     */
    float d = filament(q, phase + fi, t);
    total += (exp(-d * 170.0) * 1.35 + exp(-d * 9.0) * 0.48) * flash;
  }

  total = clamp(total, 0.0, 1.6);
  float amt = clamp(total, 0.0, 1.0);

  // Mixed, not added, for the reason the aurora is: on a pale sky there is
  // no headroom above the background to add light into.
  vec3 col = mix(u_bg, mix(u_c0, u_c2, amt), amt);
  col = mix(col, u_c1, amt * 0.22);

  return vec4(col, 1.0);
}
`,
}

export function LightningArc({ className }: { className?: string }) {
  return <ShaderSurface program={LIGHTNING_ARC_PROGRAM} className={className} />
}
