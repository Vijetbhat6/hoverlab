/**
 * <MetricSparklineCards> — KPI cards with an inline trend line.
 *
 * The sparkline is hand-built SVG, not a charting library. For a 40-point
 * trend line that is the right call: a charting dependency is ~50 KB to
 * draw a path this file computes in twelve lines, and it would be the only
 * runtime dependency in the whole catalog.
 *
 * `preserveAspectRatio="none"` with a viewBox in data space lets the path
 * stretch to whatever width the card gives it, so no measurement and no
 * resize observer is needed. The line is `vector-effect="non-scaling-stroke"`
 * so that stretch does not smear the stroke width along with it.
 *
 * Server component — the whole thing is derived from props.
 */

import * as React from 'react'

export interface Metric {
  label: string
  value: string
  delta: number
  /** Newest last. Any length ≥ 2. */
  series: number[]
  higherIsBetter?: boolean
}

export interface MetricSparklineCardsProps {
  metrics?: Metric[]
  className?: string
}

const DEFAULT_METRICS: Metric[] = [
  {
    label: 'Requests',
    value: '1.24M',
    delta: 18.2,
    series: [12, 14, 13, 17, 16, 19, 22, 21, 25, 24, 28, 31],
  },
  {
    label: 'Error rate',
    value: '0.12%',
    delta: -34.5,
    higherIsBetter: false,
    series: [9, 8, 8, 7, 9, 6, 5, 5, 4, 3, 3, 2],
  },
  {
    label: 'p95 latency',
    value: '184ms',
    delta: -8.1,
    higherIsBetter: false,
    series: [22, 21, 23, 20, 19, 20, 18, 17, 18, 16, 15, 15],
  },
]

/**
 * Points → an SVG path in a 100×32 box.
 * Normalised against the series' own min/max so a flat-but-high line
 * still fills the card rather than pinning to the top edge.
 */
function toPath(series: number[]): string {
  if (series.length < 2) return ''

  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1

  return series
    .map((value, i) => {
      const x = (i / (series.length - 1)) * 100
      const y = 32 - ((value - min) / span) * 28 - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

export function MetricSparklineCards({
  metrics = DEFAULT_METRICS,
  className = '',
}: MetricSparklineCardsProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className}`}>
      {metrics.map((metric) => {
        const rising = metric.delta >= 0
        const good = rising === (metric.higherIsBetter ?? true)
        const stroke = good ? 'text-emerald-500' : 'text-red-500'
        const path = toPath(metric.series)

        return (
          <div
            key={metric.label}
            className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight">{metric.value}</span>
              <span
                className={`text-xs font-semibold ${
                  good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {rising ? '+' : ''}
                {metric.delta}%
              </span>
            </div>

            <svg
              aria-hidden
              viewBox="0 0 100 32"
              preserveAspectRatio="none"
              className={`mt-4 h-10 w-full ${stroke}`}
            >
              {/* Fill under the line, closed back along the baseline. */}
              <path
                d={`${path} L100,32 L0,32 Z`}
                fill="currentColor"
                opacity="0.08"
                stroke="none"
              />
              <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <p className="sr-only">
              Trend over the last {metric.series.length} periods, {rising ? 'rising' : 'falling'}{' '}
              {Math.abs(metric.delta)} percent.
            </p>
          </div>
        )
      })}
    </div>
  )
}
