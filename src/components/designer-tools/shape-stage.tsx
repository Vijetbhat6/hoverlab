'use client'

/**
 * The draggable canvas for Shape Magic.
 *
 * ── WHY DRAGGING IS NEVER THE ONLY WAY TO MOVE A CIRCLE ─────────────────
 *
 * WCAG 2.2 added 2.5.7 Dragging Movements: anything a pointer drag can do
 * must also be doable without one. This is the surface that rule was
 * written for — the whole interaction is "put the circles where you want
 * them" — so every handle is focusable and takes arrow keys, and the
 * controls beside the stage carry X, Y and radius as sliders. Three routes
 * to the same state, and the drag is the convenience rather than the
 * mechanism.
 *
 * The site's own accessibility audit runs over the catalog, not the tools
 * (see `scripts/audit-a11y.mts`), which is exactly why this is written down
 * here: nothing would have caught a drag-only stage.
 *
 * ── WHY THE HANDLES ARE DRAWN OVER THE SHAPE, NOT INSIDE IT ─────────────
 *
 * The merged outline is the artifact; the circles that produced it are
 * scaffolding and do not appear in any export. Drawing them as outlines on
 * top makes that legible — you can see the two circles that became one
 * blob, which is the thing that makes the gooeyness slider comprehensible
 * rather than magic.
 */

import * as React from 'react'

import type { Metaball } from '@/lib/shape-magic'
import { BOX } from '@/lib/shape-magic'
import { cn } from '@/lib/utils'

export interface ShapeStageProps {
  balls: Metaball[]
  /** The merged outline, as an SVG `d`. Empty draws only the handles. */
  d: string
  selectedId: number
  onSelect: (id: number) => void
  onMove: (id: number, x: number, y: number) => void
  /** Gradient stops for the fill. Preview only — no export carries them. */
  from: string
  to: string
  className?: string
}

/** How far one arrow key moves a circle, in box units. Shift multiplies it. */
const NUDGE = 1
const NUDGE_FAST = 10

export function ShapeStage({
  balls,
  d,
  selectedId,
  onSelect,
  onMove,
  from,
  to,
  className,
}: ShapeStageProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const gradientId = React.useId()
  const dragging = React.useRef<number | null>(null)

  /**
   * Client coordinates → the 0–100 box.
   *
   * Read off the rendered rect rather than from a stored size: the stage is
   * fluid, and a cached width is wrong for the whole of the frame after a
   * resize — which is the frame someone is most likely to be dragging in.
   */
  function toBox(event: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    return {
      x: ((event.clientX - rect.left) / rect.width) * BOX,
      y: ((event.clientY - rect.top) / rect.height) * BOX,
    }
  }

  function clamp(value: number): number {
    return Math.min(BOX, Math.max(0, Math.round(value * 10) / 10))
  }

  function startDrag(event: React.PointerEvent, id: number) {
    // Pointer capture, so a fast drag that leaves the circle — or the SVG —
    // keeps delivering moves to this handle instead of dropping it.
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
    dragging.current = id
    onSelect(id)
  }

  function drag(event: React.PointerEvent) {
    if (dragging.current === null) return
    const point = toBox(event)
    if (!point) return
    onMove(dragging.current, clamp(point.x), clamp(point.y))
  }

  function endDrag(event: React.PointerEvent) {
    if (dragging.current === null) return
    ;(event.currentTarget as Element).releasePointerCapture(event.pointerId)
    dragging.current = null
  }

  function nudge(event: React.KeyboardEvent, ball: Metaball) {
    const step = event.shiftKey ? NUDGE_FAST : NUDGE
    let dx = 0
    let dy = 0
    if (event.key === 'ArrowLeft') dx = -step
    else if (event.key === 'ArrowRight') dx = step
    else if (event.key === 'ArrowUp') dy = -step
    else if (event.key === 'ArrowDown') dy = step
    else return

    // Only once a key is known to be an arrow, so Tab and Enter still work.
    event.preventDefault()
    onMove(ball.id, clamp(ball.x + dx), clamp(ball.y + dy))
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BOX} ${BOX}`}
      className={cn('h-full w-full touch-none', className)}
      // The shape is described by the controls and the code output beside
      // it; the handles below carry their own labels.
      role="group"
      aria-label="Shape canvas"
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>

      {d ? <path d={d} fill={`url(#${gradientId})`} fillRule="evenodd" /> : null}

      {balls.map((ball, index) => {
        const selected = ball.id === selectedId
        return (
          <circle
            key={ball.id}
            cx={ball.x}
            cy={ball.y}
            r={ball.r}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={selected ? 0.8 : 0.4}
            strokeDasharray={selected ? undefined : '2 2'}
            className={cn(
              'cursor-grab text-foreground/50 focus-visible:outline-none',
              selected && 'text-primary',
            )}
            // A real control, so it gets a role, a name and a tab stop —
            // an SVG shape with a click handler is none of those things.
            role="button"
            tabIndex={0}
            aria-label={`Circle ${index + 1} of ${balls.length}, at ${Math.round(ball.x)}, ${Math.round(ball.y)}, radius ${Math.round(ball.r)}. Arrow keys move it.`}
            aria-pressed={selected}
            onPointerDown={(e) => startDrag(e, ball.id)}
            onKeyDown={(e) => nudge(e, ball)}
            onFocus={() => onSelect(ball.id)}
          />
        )
      })}

      {/*
        The focus ring, drawn rather than inherited.

        `outline` on an SVG shape is unreliable across engines and, where it
        does paint, it traces the element's bounding box rather than the
        circle. A second ring is the only thing that reads as a focus state
        on a round handle at every zoom level.
      */}
      {balls
        .filter((b) => b.id === selectedId)
        .map((ball) => (
          <circle
            key={`ring-${ball.id}`}
            cx={ball.x}
            cy={ball.y}
            r={ball.r + 1.5}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.3}
            className="pointer-events-none text-primary/40"
          />
        ))}
    </svg>
  )
}
