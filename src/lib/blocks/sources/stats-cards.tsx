/**
 * <StatsCards> — metrics with the direction they moved.
 *
 * <StatsBand> states magnitude: four numbers, hairline-separated, the shape
 * a landing page uses to say how big something is. This one answers a
 * different question — whether it is getting better — which is the one an
 * investor update, a status page or a dashboard header is actually asked.
 *
 * A number with no baseline is not evidence. "1.2M requests" could be a
 * record or a collapse, and the reader has no way to tell, so the delta is
 * a required part of a `Stat` here rather than an optional flourish.
 *
 * Direction is never carried by colour alone. Each delta pairs its tint
 * with an arrow that points, and with a `sr-only` word, so the meaning
 * survives a monochrome print, a red-green colour deficiency and a screen
 * reader — three readers for whom a green number is just a number.
 *
 * `intent` is separate from the sign for the case that catches people out:
 * churn falling is good and error rate rising is bad. Tying the tint to the
 * arithmetic would paint those backwards, so the author says which
 * direction is the good one and the block colours from that.
 */

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

export interface StatCard {
  label: string
  value: string
  /** Change against the previous period, e.g. '+12.4%'. */
  delta: string
  /** Which way is good. 'up' suits revenue; 'down' suits churn. */
  intent?: 'up' | 'down' | 'neutral'
  caption?: string
}

export interface StatsCardsProps {
  stats?: StatCard[]
  heading?: string
  subheading?: string
  /** Period the deltas are measured against, named once for all of them. */
  periodLabel?: string
  className?: string
}

const DEFAULT_STATS: StatCard[] = [
  { label: 'Monthly recurring revenue', value: '$48.2k', delta: '+12.4%', intent: 'up' },
  { label: 'Active workspaces', value: '1,284', delta: '+3.1%', intent: 'up' },
  {
    label: 'Churn',
    value: '1.8%',
    delta: '−0.4pt',
    intent: 'down',
    caption: 'Lower is better',
  },
  { label: 'Median response time', value: '142ms', delta: '0.0%', intent: 'neutral' },
]

/** Whether a delta reads as good, bad or flat, given what the author called good. */
function toneOf(delta: string, intent: StatCard['intent']) {
  const moved = delta.trim().replace(/^[+\-−]?0(\.0+)?(%|pt|ms)?$/i, '')
  if (intent === 'neutral' || moved === '') {
    return {
      klass: 'text-muted-foreground',
      Icon: Minus,
      word: 'No change',
    }
  }
  // A leading minus in any of its typographic forms. Everything else —
  // including a bare "12%" — is treated as an increase.
  const fell = /^[-−]/.test(delta.trim())
  const good = intent === 'down' ? fell : !fell
  return {
    klass: good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
    Icon: fell ? ArrowDownRight : ArrowUpRight,
    word: fell ? 'Down' : 'Up',
  }
}

export function StatsCards({
  stats = DEFAULT_STATS,
  heading = 'How the quarter is going',
  subheading,
  periodLabel = 'vs. previous 30 days',
  className = '',
}: StatsCardsProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 ${className}`}
    >
      {heading ? (
        <div className="mb-8 max-w-2xl">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-2 text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const { klass, Icon, word } = toneOf(stat.delta, stat.intent)
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-card/60 p-5"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                  {stat.value}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${klass}`}
                >
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                  {/* The direction as a word, for every reader who is not
                      being served by the tint or the arrow. */}
                  <span className="sr-only">{word} </span>
                  {stat.delta}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.caption ?? periodLabel}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
