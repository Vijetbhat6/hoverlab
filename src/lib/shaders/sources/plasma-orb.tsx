'use client'

/**
 * Plasma Orb — a sphere with a turbulent surface, a rim and a halo.
 *
 * Two things make a flat disc read as a ball. The first is that the surface
 * noise is sampled in a fake spherical parameterisation — `z` reconstructed
 * from the radius, so the pattern compresses toward the edge the way a
 * texture on a sphere does. The second is the fresnel term: real spheres
 * are brightest where you are looking along their surface, and `pow(1 - z,
 * 3)` is that, cheaply.
 *
 * This is the one design that returns alpha. The body is opaque, the halo
 * fades out, and beyond it the shader writes nothing — so the halo blends
 * into whatever the surface is painted with instead of fading toward a
 * colour the shader had to guess. Drop the surface's own background and the
 * orb will sit on the page behind it; that is what the runtime's
 * premultiplied context is for.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const PLASMA_ORB_PROGRAM: GLProgram = {
  id: 'plasma-orb',
  kind: 'webgl',
  speed: 1,
  pointer: true,
  light: { c0: '#8b5cf6', c1: '#22d3ee', c2: '#f0abfc', bg: '#f5f3ff' },
  dark: { c0: '#7c3aed', c1: '#06b6d4', c2: '#e879f9', bg: '#07040f' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);

  // The orb leans toward the pointer rather than following it — a ball
  // that tracks exactly reads as a cursor, not as an object.
  p -= (u_pointer - 0.5) * 0.22;

  float r = length(p);
  float R = 0.58;
  float t = u_time * 0.28;

  // Reconstructed depth, so the surface noise foreshortens at the limb.
  float z = sqrt(max(0.0, R * R - r * r));
  vec3 n = vec3(p, z) / R;

  float surf = fbm(n.xy * 2.6 + vec2(t, -t * 0.7) + n.z * 0.9);
  float band = 0.5 + 0.5 * sin(surf * 6.5 + t * 2.2);

  float inside = smoothstep(R, R - 0.015, r);
  float fres = pow(1.0 - clamp(z / R, 0.0, 1.0), 3.0);
  float halo = exp(-(r - R) * 6.5) * step(R, r);

  vec3 body = mix(u_c0, u_c1, band) + u_c2 * fres * 1.15;
  vec3 col = mix(u_c2, body, inside);

  // Straight (not premultiplied) alpha — the epilogue premultiplies once,
  // for every design, so none of them have to remember to.
  float alpha = clamp(inside + halo * 0.65, 0.0, 1.0);

  return vec4(col, alpha);
}
`,
}

export function PlasmaOrb({ className }: { className?: string }) {
  return <ShaderSurface program={PLASMA_ORB_PROGRAM} className={className} />
}
