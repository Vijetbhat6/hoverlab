/**
 * <LineChartPanel> — a trend over time, in SVG, with no charting library.
 *
 * <MetricSparklineCards> answers "is this going up". <BarChartPanel>
 * compares discrete things. Neither answers the question a dashboard is
 * usually opened for: what happened, and when. That needs a dated axis, a
 * readable scale and two series you can compare — which is the point at
 * which most teams reach for Recharts and add 90 KB to a page that draws
 * one line.
 *
 * The whole chart is a path and a polygon in an inline SVG, sized with a
 * viewBox and `preserveAspectRatio="none"` so it stretches to its
 * container. No dependency, no client component, no hydration: this is a
 * server component that renders identical markup on the server and in a
 * static export.
 *
 * WHY THE Y AXIS DOES NOT START AT ZERO, AND SAYS SO
 *
 * It starts at a rounded floor below the data. Forcing zero on a series
 * that moves between 2,900 and 4,400 flattens the shape into a straight
 * line near the top, which is a real way to hide a trend. The axis labels
 * are printed, so the choice is visible rather than concealed — a truncated
 * axis is honest when it is legible and a lie when it is not.
 *
 * ACCESSIBILITY: THE TABLE IS THE CHART
 *
 * An SVG polyline is unreadable to a screen reader no matter how many ARIA
 * attributes are hung off it, and `role="img"` with a summary label reduces
 * twelve months to one sentence somebody else wrote. So the same data is
 * rendered as a real `<table>`, positioned off-screen with `sr-only`. The
 * graphic carries `aria-hidden`. Anyone using assistive technology gets the
 * numbers rather than a description of a picture of them.
 *
 * The grid, the labels and the two series are all in one coordinate space
 * (0–100 on both axes) so the maths stays readable: every point is a
 * percentage of the plot, and the SVG scales it.
 */

import type * as React from 'react'

export interface LineSeries {
  name: string
  values: number[]
  /**
   * A Tailwind *text* colour class, not a colour value.
   *
   * The series is drawn with `currentColor`, so one class colours the line,
   * the area fill and the legend swatch together and there is no hex to
   * keep in step across three places. It also means the block inherits the
   * consuming project's palette — `text-primary` is whatever their primary
   * is — instead of shipping a brand colour of its own.
   */
  colorClass?: string
  /** Fill the area under this series. One series should, both should not. */
  area?: boolean
}

export interface LineChartPanelProps {
  heading?: string
  description?: string
  labels?: string[]
  series?: LineSeries[]
  /** Formats the axis and the accessible table. */
  format?: (value: number) => string
  className?: string
}

const DEFAULT_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const DEFAULT_SERIES: LineSeries[] = [
  {
    name: 'This year',
    values: [3120, 3260, 3180, 3540, 3720, 3610, 3880, 4020, 3960, 4180, 4320, 4410],
    colorClass: 'text-primary',
    area: true,
  },
  {
    name: 'Last year',
    values: [2980, 3010, 3090, 3120, 3050, 3210, 3180, 3340, 3290, 3410, 3380, 3520],
    colorClass: 'text-muted-foreground',
  },
]

/** Round a bound outward to something a human would have chosen. */
function niceFloor(value: number, step: number): number {
  return Math.floor(value / step) * step
}
function niceCeil(value: number, step: number): number {
  return Math.ceil(value / step) * step
}

export function LineChartPanel({
  heading = 'Monthly active workspaces',
  description = 'Compared with the same month last year.',
  labels = DEFAULT_LABELS,
  series = DEFAULT_SERIES,
  format = (value) => value.toLocaleString('en-US'),
  className = '',
}: LineChartPanelProps) {
  const all = series.flatMap((s) => s.values)
  const rawMin = Math.min(...all)
  const rawMax = Math.max(...all)

  /*
    A step sized to the data rather than a constant, so the axis reads in
    round numbers whether the series is in hundreds or millions.
  */
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax - rawMin || 1)))
  const min = niceFloor(rawMin - (rawMax - rawMin) * 0.1, magnitude)
  const max = niceCeil(rawMax + (rawMax - rawMin) * 0.1, magnitude)
  const span = max - min || 1

  const x = (index: number, length: number) =>
    length <= 1 ? 0 : (index / (length - 1)) * 100
  const y = (value: number) => 100 - ((value - min) / span) * 100

  const ticks = [max, min + span * 0.5, min]

  return (
    <section
      aria-labelledby="line-chart-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="line-chart-heading" className="text-lg font-semibold text-foreground">
              {heading}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <ul className="flex flex-wrap items-center gap-4">
            {series.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className={`h-0.5 w-5 rounded-full bg-current ${s.colorClass ?? 'text-primary'}`}
                />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          {/* Axis labels live outside the SVG so they render at real text
              size — text inside a non-uniformly scaled viewBox is stretched
              with it, which is the classic way this pattern goes wrong. */}
          <ul className="flex w-14 shrink-0 flex-col justify-between py-0.5 text-end font-mono text-xs text-muted-foreground">
            {ticks.map((tick) => (
              <li key={tick}>{format(Math.round(tick))}</li>
            ))}
          </ul>

          <div className="min-w-0 flex-1">
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-56 w-full overflow-visible"
            >
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1="0"
                  x2="100"
                  y1={y(tick)}
                  y2={y(tick)}
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {series.map((s) => {
                const points = s.values
                  .map((value, i) => `${x(i, s.values.length)},${y(value)}`)
                  .join(' ')

                /* One class on the group; everything inside inherits it
                   through `currentColor`. */
                return (
                  <g key={s.name} className={s.colorClass ?? 'text-primary'}>
                    {s.area ? (
                      <polygon
                        points={`0,100 ${points} 100,100`}
                        fill="currentColor"
                        opacity="0.12"
                      />
                    ) : null}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                )
              })}
            </svg>

            <ul className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
              {labels.map((label, i) =>
                /* Every other label below `sm`, all of them above it —
                   twelve months in 320 pixels overlap into a smudge. */
                i % 2 === 0 ? (
                  <li key={label}>{label}</li>
                ) : (
                  <li key={label} className="hidden sm:block">
                    {label}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* The chart, for anyone who cannot see the chart. */}
        <table className="sr-only">
          <caption>{heading}</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              {series.map((s) => (
                <th key={s.name} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {series.map((s) => (
                  <td key={s.name}>{s.values[i] === undefined ? '—' : format(s.values[i]!)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
