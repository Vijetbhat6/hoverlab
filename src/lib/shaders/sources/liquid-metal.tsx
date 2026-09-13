'use client'

/**
 * Liquid Metal — domain-warped noise, banded like a polished surface.
 *
 * Three nested fbm lookups: the field is sampled at a position that is
 * itself the output of a field, twice. That is the standard way to get
 * folds and eddies out of noise that would otherwise look like fog, and it
 * is the reason this reads as a fluid with a surface rather than a cloud.
 *
 * The metal comes from the banding. `fract(f * 5)` cuts the smooth field
 * into contours, and a narrow smoothstep across each contour's leading edge
 * is a specular highlight — polished metal is exactly a surface where small
 * changes in angle make large changes in what you see.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const LIQUID_METAL_PROGRAM: GLProgram = {
  id: 'liquid-metal',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#94a3b8', c1: '#c4b5fd', c2: '#ffffff', bg: '#e2e8f0' },
  dark: { c0: '#1e293b', c1: '#7c3aed', c2: '#e2e8f0', bg: '#020617' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv) * 1.25;
  float t = u_time * 0.11;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.4)
  );
  float f = fbm(p + 3.5 * r);

  // Contour lines through the field. The asymmetric smoothstep pair is a
  // hard leading edge and a soft trailing one, which is what a highlight
  // rolling over a curved surface looks like.
  float bands = fract(f * 5.0);
  float sheen = smoothstep(0.0, 0.07, bands) * smoothstep(0.52, 0.26, bands);

  vec3 col = mix(u_bg, u_c0, clamp(f * 1.5, 0.0, 1.0));
  col = mix(col, u_c1, clamp(length(r) * 0.85, 0.0, 1.0));
  col += u_c2 * sheen * 0.8;

  return vec4(col, 1.0);
}
`,
}

export function LiquidMetal({ className }: { className?: string }) {
  return <ShaderSurface program={LIQUID_METAL_PROGRAM} className={className} />
}
