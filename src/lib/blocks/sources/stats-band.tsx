/**
 * <StatsBand> — a four-up numeric strip for a landing page.
 *
 * Hairline-separated cells built from a single `gap-px` grid over a
 * background, so the dividers stay 1px on every display without a border
 * on each child fighting its neighbour.
 */

import * as React from 'react'

export interface Stat {
  value: string
  label: string
  caption?: string
}

export interface StatsBandProps {
  stats?: Stat[]
  className?: string
}

const DEFAULT_STATS: Stat[] = [
  { value: '12,000+', label: 'Developers', caption: 'Shipping with it weekly' },
  { value: '99.99%', label: 'Uptime', caption: 'Trailing twelve months' },
  { value: '<40ms', label: 'Median latency', caption: 'Measured at the edge' },
  { value: '24/7', label: 'Support', caption: 'Real humans, every timezone' },
]

export function StatsBand({ stats = DEFAULT_STATS, className = '' }: StatsBandProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 ${className}`}>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-background/80 p-5 text-center backdrop-blur transition-colors hover:bg-background sm:p-6"
          >
            <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground/80">{s.label}</div>
            {s.caption ? (
              <div className="mt-0.5 text-xs text-muted-foreground">{s.caption}</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
