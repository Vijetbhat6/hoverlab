/**
 * <BarChartPanel> — a categorical bar chart in CSS grid, no SVG.
 *
 * Bars are grid rows sized as a percentage of the maximum, which means the
 * chart reflows with its container for free and every bar is a real DOM
 * element that can carry a tooltip, a link or a focus ring.
 *
 * The accessible fallback is a real <table> in `sr-only`, not `aria-label`
 * text on the chart. A chart described as "bar chart showing revenue" tells
 * a screen-reader user nothing; the table gives them the actual numbers.
 *
 * Gridlines sit behind the bars at fixed fractions, so the eye can read a
 * value off the chart without every bar needing its own printed figure.
 *
 * Server component.
 */

import * as React from 'react'

export interface Bar {
  label: string
  value: number
  /** Optional second series, drawn as a lighter bar behind. */
  compare?: number
}

export interface BarChartPanelProps {
  bars?: Bar[]
  heading?: string
  caption?: string
  /** Formats values in the tooltip, the table and the axis. */
  format?: (value: number) => string
  className?: string
}

const DEFAULT_BARS: Bar[] = [
  { label: 'Mon', value: 4200, compare: 3800 },
  { label: 'Tue', value: 5100, compare: 4400 },
  { label: 'Wed', value: 4800, compare: 4900 },
  { label: 'Thu', value: 6300, compare: 5200 },
  { label: 'Fri', value: 7100, compare: 5800 },
  { label: 'Sat', value: 3900, compare: 3600 },
  { label: 'Sun', value: 3100, compare: 3000 },
]

const currency = (value: number) => `$${value.toLocaleString('en-US')}`

export function BarChartPanel({
  bars = DEFAULT_BARS,
  heading = 'Revenue this week',
  caption = 'Solid is this week. Faded is the week before.',
  format = currency,
  className = '',
}: BarChartPanelProps) {
  const max = Math.max(...bars.map((b) => Math.max(b.value, b.compare ?? 0)), 1)
  const total = bars.reduce((sum, b) => sum + b.value, 0)

  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-tight">{heading}</h2>
          {caption ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        <span className="text-2xl font-extrabold tracking-tight">{format(total)}</span>
      </div>

      <div className="relative mt-8">
        {/* Gridlines behind the bars. */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
            <div key={fraction} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right text-[0.65rem] text-muted-foreground">
                {format(Math.round(max * fraction))}
              </span>
              <span className="h-px flex-1 bg-border/50" />
            </div>
          ))}
        </div>

        {/* Bars, offset past the axis labels. */}
        <div aria-hidden className="relative ml-14 flex h-48 items-end gap-2">
          {bars.map((bar) => (
            <div key={bar.label} className="group flex h-full flex-1 flex-col justify-end gap-1">
              <div className="relative flex h-full items-end justify-center gap-0.5">
                {typeof bar.compare === 'number' ? (
                  <span
                    className="w-1/3 rounded-t bg-muted-foreground/20 transition-all"
                    style={{ height: `${(bar.compare / max) * 100}%` }}
                  />
                ) : null}

                <span
                  className="w-1/2 rounded-t bg-primary transition-all group-hover:bg-primary/80"
                  style={{ height: `${(bar.value / max) * 100}%` }}
                />

                {/* Value on hover — keeps the chart clean at rest. */}
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 text-[0.65rem] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {format(bar.value)}
                </span>
              </div>

              <span className="text-center text-xs text-muted-foreground">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The real accessible representation. */}
      <table className="sr-only">
        <caption>{heading}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">This week</th>
            {bars.some((b) => typeof b.compare === 'number') ? (
              <th scope="col">Previous week</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label}>
              <th scope="row">{bar.label}</th>
              <td>{format(bar.value)}</td>
              {typeof bar.compare === 'number' ? <td>{format(bar.compare)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
