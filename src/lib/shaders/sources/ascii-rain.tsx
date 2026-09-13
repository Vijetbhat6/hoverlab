'use client'

/**
 * ASCII Rain — a noise field resolved as monospace glyphs.
 *
 * 2D canvas rather than a shader, deliberately. A fragment shader can draw
 * ASCII by packing 5×7 bitmaps into integers and unpacking them per pixel;
 * the result works and is unreadable, and changing the character ramp means
 * re-deriving a table of magic numbers. Here the ramp is a string, the font
 * is the font, and anybody can swap either.
 *
 * Two fields are summed. A slow fbm gives the drifting mass that makes the
 * screen look like something rather than static, and a per-column "drop"
 * term — a bright head with a decaying tail — gives the rain. The ramp is
 * ordered by ink coverage, so brightness maps to how much of the cell is
 * filled, which is the whole trick behind ASCII art.
 */

import * as React from 'react'

import { ShaderSurface } from '../shader-surface'
import { fbm2D, hash2D, type Canvas2DProgram } from '../runtime'

/** Ordered by ink coverage, lightest first. */
const RAMP = ' .:-=+*#%@'

/** Cell size in CSS pixels. Also the font size, near enough, for monospace. */
const CELL_W = 9
const CELL_H = 13

interface Column {
  /** Where this column's drop head is, in cells. */
  head: number
  speed: number
  length: number
}

export const ASCII_RAIN_PROGRAM: Canvas2DProgram = {
  id: 'ascii-rain',
  kind: 'canvas',
  speed: 1,
  light: { c0: '#94a3b8', c1: '#0f172a', c2: '#16a34a', bg: '#f8fafc' },
  dark: { c0: '#14532d', c1: '#4ade80', c2: '#dcfce7', bg: '#020803' },

  init: (frame) => {
    const cols = Math.ceil(frame.width / CELL_W)
    const rows = Math.ceil(frame.height / CELL_H)
    const columns: Column[] = []
    for (let i = 0; i < cols; i++) {
      columns.push({
        // Seeded from the column index, not from Math.random(), so a card
        // that re-seeds on resize does not visibly reshuffle.
        head: hash2D(i, 7) * rows * 2,
        speed: 4 + hash2D(i, 13) * 14,
        length: 5 + Math.floor(hash2D(i, 29) * 14),
      })
    }
    return { columns, rows, cols }
  },

  draw: (ctx, frame, state) => {
    const { columns, rows, cols } = state as { columns: Column[]; rows: number; cols: number }
    const { palette, time } = frame

    ctx.font = `${CELL_H - 1}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    ctx.textBaseline = 'top'

    for (let x = 0; x < cols; x++) {
      const col = columns[x]
      // The head wraps through twice the height so there is a gap between
      // one drop leaving and the next arriving.
      const head = (col.head + time * col.speed) % (rows * 2)

      for (let y = 0; y < rows; y++) {
        // Ambient: the slow field everything sits in.
        const ambient = fbm2D(x * 0.12, y * 0.12 - time * 0.35) * 0.55

        // The drop: 1 at the head, decaying back up the column.
        const behind = head - y
        const drop =
          behind >= 0 && behind < col.length ? 1 - behind / col.length : 0

        const v = ambient + drop * 0.9
        if (v < 0.18) continue

        const idx = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))
        // The glyph is chosen by brightness but jittered per cell over
        // time, so a flat region shimmers instead of showing one repeated
        // character in a block.
        const jitter = Math.floor(hash2D(x, y + Math.floor(time * 6)) * 2)
        const ch = RAMP[Math.max(0, Math.min(RAMP.length - 1, idx + jitter - 1))]

        // Three bands rather than a continuous ramp: the head is the
        // accent, the tail the primary, the ambient field the muted one.
        ctx.fillStyle = drop > 0.75 ? palette.c2 : drop > 0.1 ? palette.c1 : palette.c0
        ctx.globalAlpha = Math.min(1, 0.25 + v)
        ctx.fillText(ch, x * CELL_W, y * CELL_H)
      }
    }

    ctx.globalAlpha = 1
  },
}

export function AsciiRain({ className }: { className?: string }) {
  return <ShaderSurface program={ASCII_RAIN_PROGRAM} className={className} />
}
