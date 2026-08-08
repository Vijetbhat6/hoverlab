/**
 * <SkeletonList> — loading placeholders for a list or table.
 *
 * Three things this gets right:
 *
 *  - The shimmer is `motion-safe:` only. A sweeping gradient that never
 *    stops is exactly the kind of animation `prefers-reduced-motion` exists
 *    to suppress, and a skeleton is on screen at the moment a user is least
 *    able to look away from it. Reduced motion falls back to a flat tint.
 *  - Row widths vary. Identical bars read as a broken UI; a ragged right
 *    edge reads as text.
 *  - The container is `aria-busy` with a visually hidden status, so a
 *    screen reader hears "Loading" instead of silence — and the bars
 *    themselves are `aria-hidden` so they are not announced one by one.
 *
 * Server component — no state, no effects.
 */

import * as React from 'react'

export interface SkeletonListProps {
  rows?: number
  /** Include a leading circle per row. */
  avatar?: boolean
  label?: string
  className?: string
}

/** Varied widths, cycled — so ten rows do not look like one row ten times. */
const WIDTHS = ['w-3/5', 'w-4/5', 'w-2/5', 'w-3/4', 'w-1/2']

export function SkeletonList({
  rows = 5,
  avatar = true,
  label = 'Loading',
  className = '',
}: SkeletonListProps) {
  return (
    <div
      aria-busy="true"
      className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}
    >
      <span className="sr-only" role="status">
        {label}
      </span>

      {/* Declared once for the whole list, not once per bar. */}
      <style>{`
        @keyframes skeleton-sweep {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>

      <ul className="divide-y divide-border/40">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} aria-hidden className="flex items-center gap-4 px-5 py-4">
            {avatar ? <Bar className="h-9 w-9 shrink-0 rounded-full" /> : null}

            <div className="min-w-0 flex-1 space-y-2">
              <Bar className={`h-3 rounded ${WIDTHS[i % WIDTHS.length]}`} />
              <Bar className={`h-2.5 rounded ${WIDTHS[(i + 2) % WIDTHS.length]} opacity-70`} />
            </div>

            <Bar className="h-6 w-16 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One placeholder bar.
 *
 * The sweep is a background gradient translated across a 200%-wide
 * background, which animates compositor-side and does not touch layout.
 * Under reduced motion the animation is simply absent and the flat
 * `bg-muted` shows through.
 */
function Bar({ className = '' }: { className?: string }) {
  return (
    <span
      className={`block bg-muted motion-safe:animate-[skeleton-sweep_1.6s_ease-in-out_infinite] motion-safe:bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.06),transparent)] motion-safe:bg-[length:200%_100%] ${className}`}
    />
  )
}
