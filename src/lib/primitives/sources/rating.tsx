'use client'

/**
 * <Rating> — stars, in both of the two modes people forget are different.
 *
 * A rating widget does two unrelated jobs and the same component is usually
 * shipped for both:
 *
 *   input     the user is choosing. It is a radio group, one tab stop,
 *             arrow keys move, and it needs whole values only — nobody
 *             clicks a half star on purpose.
 *   display   the average of 1,284 ratings. It is 4.3, not 4, so it needs
 *             fractional fill; and it is not interactive, so it must not be
 *             focusable, must not have radio semantics, and should be one
 *             piece of text to a screen reader: "4.3 out of 5".
 *
 * The fractional fill is a clipped overlay rather than a half-star glyph —
 * a `width: 43%` layer over the outlines. Half-star icons only do halves,
 * and an average of 4.3 drawn as 4.5 is a number the page is making up.
 */

import * as React from 'react'
import { Star } from 'lucide-react'

export interface RatingProps {
  value: number
  max?: number
  /** Omit for display mode — that is what makes it non-interactive. */
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  /** Shown after the stars in display mode: "4.3 (1,284)". */
  count?: number
  /** Names the control when it takes input. */
  label?: string
  className?: string
}

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' } as const

export function Rating({
  value,
  max = 5,
  onChange,
  size = 'md',
  count,
  label = 'Rating',
  className = '',
}: RatingProps) {
  const [hover, setHover] = React.useState<number | null>(null)
  const interactive = typeof onChange === 'function'
  const shown = hover ?? value

  /* ---- Display: one label, no focus, fractional fill ---- */

  if (!interactive) {
    const percent = Math.max(0, Math.min(1, value / max)) * 100
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        role="img"
        aria-label={`${value.toFixed(1)} out of ${max}${count === undefined ? '' : `, ${count} ratings`}`}
      >
        <span className="relative inline-flex">
          <span aria-hidden className="inline-flex gap-0.5 text-muted-foreground/40">
            {Array.from({ length: max }, (_, i) => (
              <Star key={i} className={SIZES[size]} />
            ))}
          </span>
          {/*
            The filled layer, clipped to the fraction. `inset-inline-start`
            so the fill grows from the first star in either direction, and
            `overflow-hidden` on a sized box rather than a clip-path, which
            Safari still antialiases badly at small sizes.
          */}
          <span
            aria-hidden
            className="absolute inset-y-0 start-0 overflow-hidden"
            style={{ width: `${percent}%` }}
          >
            <span className="inline-flex gap-0.5 text-amber-400">
              {Array.from({ length: max }, (_, i) => (
                <Star key={i} className={SIZES[size]} fill="currentColor" />
              ))}
            </span>
          </span>
        </span>

        <span className="text-sm font-medium tabular-nums text-foreground">
          {value.toFixed(1)}
        </span>
        {count === undefined ? null : (
          <span className="text-sm text-muted-foreground">
            ({count.toLocaleString()})
          </span>
        )}
      </span>
    )
  }

  /* ---- Input: a radio group over whole values ---- */

  const move = (next: number) => {
    const clamped = Math.max(1, Math.min(max, next))
    onChange?.(clamped)
  }

  return (
    <span
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center gap-0.5 ${className}`}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        // Up and Down rather than Left and Right: "more" and "less" are the
        // axis here, and the vertical keys mean the same thing in every
        // reading direction.
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault()
          move(value + 1)
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault()
          move(value - 1)
        } else if (e.key === 'Home') {
          e.preventDefault()
          move(1)
        } else if (e.key === 'End') {
          e.preventDefault()
          move(max)
        }
      }}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1
        const filled = star <= shown
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => onChange?.(star)}
            onPointerEnter={() => setHover(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
          >
            <Star
              className={`${SIZES[size]} ${filled ? 'text-amber-400' : 'text-muted-foreground/40'}`}
              fill={filled ? 'currentColor' : 'none'}
              aria-hidden
            />
          </button>
        )
      })}
    </span>
  )
}
