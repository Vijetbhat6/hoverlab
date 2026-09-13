'use client'

/**
 * Particle Drift — a constellation that leans toward the pointer.
 *
 * The other 2D design, and here for the reason a particle system is always
 * a particle system: the state has to survive between frames. A shader gets
 * one function of position and time and nothing else, so a particle in a
 * shader is a particle whose whole history has to be re-derivable from its
 * index — which rules out the links, because whether two particles are near
 * each other is a fact about this frame that has to be measured.
 *
 * The links are the effect. Dots drifting alone are dust; dots that draw a
 * line when they come within range read as a network, which is why every
 * "connections" hero on the internet looks like this.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import { hash2D, type Canvas2DProgram } from '../runtime'

/**
 * Enough to read as a field, few enough that the O(n²) link pass is free.
 *
 * 64 particles is 2,016 distance checks a frame — about 30 µs. Doubling the
 * count quadruples that, and the visual difference is "busier", so the cap
 * is here rather than in a spatial index nobody needs.
 */
const COUNT = 64

/** Links draw below this distance, in CSS pixels, fading as they stretch. */
const LINK_DIST = 96

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

export const PARTICLE_DRIFT_PROGRAM: Canvas2DProgram = {
  id: 'particle-drift',
  kind: 'canvas',
  speed: 1,
  pointer: true,
  light: { c0: '#6366f1', c1: '#94a3b8', c2: '#ec4899', bg: '#f8fafc' },
  dark: { c0: '#818cf8', c1: '#334155', c2: '#f472b6', bg: '#03050d' },

  init: (frame) => {
    const particles: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: hash2D(i, 1) * frame.width,
        y: hash2D(i, 2) * frame.height,
        // Slow: a field that crosses the card in a few seconds reads as
        // traffic, and this is meant to sit behind text.
        vx: (hash2D(i, 3) - 0.5) * 22,
        vy: (hash2D(i, 4) - 0.5) * 22,
        r: 1 + hash2D(i, 5) * 1.8,
      })
    }
    return { particles, last: 0 }
  },

  draw: (ctx, frame, state) => {
    const s = state as { particles: Particle[]; last: number }
    const { width, height, palette, pointer, time } = frame

    // The runtime hands out absolute time, not a delta, because a shader
    // has no use for one. Differencing it here keeps the motion
    // frame-rate-independent, and clamping covers the tab that was hidden
    // for a minute and came back.
    const dt = s.last === 0 ? 0 : Math.min(time - s.last, 0.1)
    s.last = time

    // Pointer is in GL orientation (y up); the canvas is y down.
    const px = pointer.x * width
    const py = (1 - pointer.y) * height

    for (const p of s.particles) {
      // A weak pull toward the pointer, capped by distance so particles
      // across the card are unaffected and nothing ever collapses onto it.
      const dx = px - p.x
      const dy = py - p.y
      const d2 = dx * dx + dy * dy
      const pull = 2600 / Math.max(d2, 2600)
      p.vx += dx * pull * dt * 0.9
      p.vy += dy * pull * dt * 0.9

      // Drag, so the pull cannot accumulate into orbit.
      p.vx *= 1 - 0.55 * dt
      p.vy *= 1 - 0.55 * dt

      p.x += p.vx * dt
      p.y += p.vy * dt

      // Wrap rather than bounce: a bounce puts a visible wall at the edge
      // of a surface that is supposed to look like a window onto something.
      if (p.x < -10) p.x = width + 10
      if (p.x > width + 10) p.x = -10
      if (p.y < -10) p.y = height + 10
      if (p.y > height + 10) p.y = -10
    }

    /* -- Links, under the dots ------------------------------------- */

    ctx.lineWidth = 1
    for (let i = 0; i < s.particles.length; i++) {
      const a = s.particles[i]
      for (let j = i + 1; j < s.particles.length; j++) {
        const b = s.particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > LINK_DIST) continue
        ctx.globalAlpha = (1 - d / LINK_DIST) * 0.5
        ctx.strokeStyle = palette.c1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    /* -- Dots ------------------------------------------------------- */

    for (const p of s.particles) {
      const near = Math.hypot(px - p.x, py - p.y) < LINK_DIST
      ctx.globalAlpha = near ? 1 : 0.8
      ctx.fillStyle = near ? palette.c2 : palette.c0
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  },
}

export function ParticleDrift({ className }: { className?: string }) {
  return <ShaderSurface program={PARTICLE_DRIFT_PROGRAM} className={className} />
}
