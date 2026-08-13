/**
 * <AgentWorkingIndicator> — the "still here" state between the prompt and
 * the first token.
 *
 * A model can take fifteen seconds before it emits anything, and fifteen
 * seconds of nothing is indistinguishable from a dropped request. This is
 * the block that fills it, and the design constraints are unusual:
 *
 *  - It must convey elapsed time, because the honest answer to "is it stuck"
 *    is a number. A counter that ticks is proof of life in a way a spinner
 *    is not — a spinner keeps spinning after the socket dies.
 *  - The phase label changes as the wait lengthens, so a long request reads
 *    as progress rather than repetition.
 *  - It is `role="status"` with `aria-live="polite"`, but the *timer* is
 *    `aria-hidden`. A live region containing a number that changes ten times
 *    a second is a denial-of-service on a screen reader; the phase changes
 *    are what get announced, and they change every few seconds.
 *
 * Motion: the pixel grid is `motion-safe:` — pure decoration, and exactly
 * the sort of shimmer the preference exists to suppress. The timer keeps
 * running under reduced motion, because it is information, not motion.
 */

'use client'

import * as React from 'react'
import { Square } from 'lucide-react'

export interface AgentWorkingIndicatorProps {
  /** Phase labels, shown in order as the wait lengthens. */
  phases?: string[]
  /** Seconds each phase holds before the next one shows. */
  phaseSeconds?: number
  /** Start the timer paused, e.g. in a static preview. */
  paused?: boolean
  className?: string
}

const DEFAULT_PHASES = [
  'Reading your question',
  'Checking the warehouse schema',
  'Running the query',
  'Sanity-checking the numbers',
  'Writing it up',
]

/** 4×4 grid, lit in a spiral so the sweep reads as one moving shape. */
const SPIRAL = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9]

export function AgentWorkingIndicator({
  phases = DEFAULT_PHASES,
  phaseSeconds = 3,
  paused = false,
  className = '',
}: AgentWorkingIndicatorProps) {
  const [tenths, setTenths] = React.useState(0)
  const [stopped, setStopped] = React.useState(paused)

  React.useEffect(() => {
    if (stopped) return
    const id = window.setInterval(() => setTenths((t) => t + 1), 100)
    return () => window.clearInterval(id)
  }, [stopped])

  const seconds = tenths / 10
  const phase = phases[Math.min(Math.floor(seconds / phaseSeconds), phases.length - 1)]

  return (
    <div className={`flex justify-center p-8 ${className}`}>
      <div className="flex w-full max-w-md items-center gap-4 rounded-2xl border border-border/60 bg-card px-4 py-3.5">
        {/* -- Pixel grid ------------------------------------------------ */}
        <div aria-hidden className="grid shrink-0 grid-cols-4 gap-[3px]">
          <style>{`
            @keyframes agent-pixel {
              0%, 100% { opacity: 0.15; }
              40%      { opacity: 1; }
            }
          `}</style>

          {SPIRAL.map((cell, i) => (
            <span
              key={cell}
              style={{ animationDelay: `${i * 70}ms` }}
              className="h-1.5 w-1.5 rounded-[2px] bg-primary opacity-40 motion-safe:animate-[agent-pixel_1.4s_ease-in-out_infinite]"
            />
          ))}
        </div>

        {/* -- Label ----------------------------------------------------- */}
        <div className="min-w-0 flex-1">
          {/*
            The phase is announced; the timer is not. Putting a tenth-second
            counter inside a live region floods a screen reader with numbers
            and drowns out the thing worth hearing.
          */}
          <p role="status" className="truncate text-sm font-medium">
            {stopped ? 'Stopped' : phase}
          </p>

          <p aria-hidden className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {seconds.toFixed(1)}s elapsed
          </p>
        </div>

        {/* Always offered. A run the user cannot cancel is the reason they
            reload the page, which is worse than cancelling. */}
        <button
          type="button"
          onClick={() => setStopped(true)}
          disabled={stopped}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Square aria-hidden className="h-3 w-3" />
          Stop
        </button>
      </div>
    </div>
  )
}
