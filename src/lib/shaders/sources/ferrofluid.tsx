'use client'

/**
 * Ferrofluid — a metaball field with spikes, which is the whole difference.
 *
 * Ferrofluid is famous for one thing: under a magnetic field it grows
 * regular spikes along the field lines, because the fluid climbs the field
 * faster than surface tension can flatten it. So each blob's radius is
 * modulated by `sin(angle * 9)` rather than being constant, and the
 * modulation is faded out near the blob's centre — spikes belong on the
 * surface, and a blob whose middle also spikes looks like a gear.
 *
 * Dark by default and dark by nature. The material is black; what you are
 * looking at is entirely specular, so the palette's accent does most of the
 * work and the body colour barely appears.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import type { GLProgram } from '../runtime'

export const FERROFLUID_PROGRAM: GLProgram = {
  id: 'ferrofluid',
  kind: 'webgl',
  speed: 1,
  light: { c0: '#1e293b', c1: '#475569', c2: '#22d3ee', bg: '#e2e8f0' },
  dark: { c0: '#020617', c1: '#1e1b4b', c2: '#22d3ee', bg: '#060910' },
  fragment: `
vec4 render(vec2 uv) {
  vec2 p = aspect(uv);
  float t = u_time * 0.24;

  float f = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(
      cos(t * (0.60 + fi * 0.20) + fi * 2.4),
      sin(t * (0.50 + fi * 0.17) + fi * 1.1)
    ) * 0.42;

    vec2 d = p - c;
    float ang = atan(d.y, d.x);

    // The spikes. Faded in with distance from the blob's centre so they
    // deform the surface and leave the core round.
    float spike = 1.0 + 0.30 * sin(ang * 9.0 + t * 3.0 + fi * 2.0)
                       * smoothstep(0.0, 0.45, length(d));

    float r = (0.25 + fi * 0.02) * spike;
    f += r * r / max(dot(d, d), 1e-4);
  }

  float body = smoothstep(0.95, 1.22, f);
  float rim = smoothstep(0.93, 1.06, f) - smoothstep(1.20, 2.00, f);
  float sheen = pow(clamp(f - 1.0, 0.0, 2.0), 2.0);

  vec3 col = mix(u_bg, u_c0, body);
  col = mix(col, u_c1, body * clamp(sheen * 0.32, 0.0, 1.0));
  col += u_c2 * rim * 1.15;

  return vec4(col, 1.0);
}
`,
}

export function Ferrofluid({ className }: { className?: string }) {
  return <ShaderSurface program={FERROFLUID_PROGRAM} className={className} />
}
