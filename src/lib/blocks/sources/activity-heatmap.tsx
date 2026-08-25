/**
 * <ActivityHeatmap> — a year of daily activity, one square per day.
 *
 * The shape everybody recognises from a contributions graph, and the reason
 * it is worth having as a block is that it answers a question no other
 * chart here does: not "how much" but "how consistently". A line chart of
 * the same data shows a total per week and hides the fact that all of it
 * landed on Tuesdays.
 *
 * BUILT ON GRID, NOT ON CALCULATED POSITIONS
 *
 * `grid-auto-flow: column` with seven rows lays the year out week by week
 * from a flat array — no per-square coordinates, no week bucketing in JS,
 * and it stays correct when the range does not start on a Monday. The
 * first column is simply short.
 *
 * FIVE LEVELS, NOT A CONTINUOUS SCALE
 *
 * Opacity mapped straight from the value produces a hundred shades nobody
 * can tell apart and a legend that cannot be drawn. Five buckets can be
 * named, and the top bucket is a quantile rather than the maximum — one
 * outlier day should not compress every ordinary day into the palest
 * shade, which is the single most common way this chart is made useless.
 *
 * ACCESSIBILITY, WHICH THIS PATTERN USUALLY FAILS
 *
 * 365 focusable tooltips is a keyboard trap wearing a chart costume, so
 * squares are not interactive. Each carries a `title` for pointer hover,
 * the grid is `aria-hidden`, and the real content for assistive technology
 * is the summary sentence and the per-month table underneath — totals a
 * screen reader can actually use, rather than an invitation to tab through
 * a year one day at a time.
 *
 * The data is generated from a seeded formula rather than Math.random() so
 * the preview, the source and a static export all render the same year.
 */

import type * as React from 'react'

export interface HeatmapDay {
  /** ISO date, YYYY-MM-DD. */
  date: string
  count: number
}

export interface ActivityHeatmapProps {
  heading?: string
  /** What one unit is called: "deploy", "commit", "session". */
  noun?: string
  days?: HeatmapDay[]
  className?: string
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/*
  A deterministic year.

  Weekdays busier than weekends, a slow upward drift across the year, and a
  quiet fortnight in the middle — enough structure that the chart shows
  something rather than static. No Math.random(): a preview that differs
  from the source a visitor copies is a bug they cannot see.
*/
function sampleYear(): HeatmapDay[] {
  const out: HeatmapDay[] = []
  const start = new Date(Date.UTC(2025, 8, 1))

  for (let i = 0; i < 364; i += 1) {
    const date = new Date(start.getTime() + i * 86_400_000)
    const weekday = date.getUTCDay()
    const weekend = weekday === 0 || weekday === 6

    const drift = i / 364
    const wobble = Math.abs(Math.sin(i * 1.7) + Math.sin(i * 0.31)) / 2
    const holiday = i > 150 && i < 164

    let count = Math.round(wobble * (weekend ? 3 : 11) * (0.6 + drift))
    if (holiday) count = Math.round(count * 0.15)
    if (i % 37 === 0) count += 9

    out.push({ date: date.toISOString().slice(0, 10), count })
  }

  return out
}

const DEFAULT_DAYS = sampleYear()

const LEVEL_CLASSES = [
  'bg-muted',
  'bg-primary/25',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
]

export function ActivityHeatmap({
  heading = 'Deploy activity',
  noun = 'deploy',
  days = DEFAULT_DAYS,
  className = '',
}: ActivityHeatmapProps) {
  const counts = days.map((d) => d.count)
  const total = counts.reduce((sum, n) => sum + n, 0)
  const active = counts.filter((n) => n > 0).length

  /*
    The top bucket is the 90th percentile of active days, not the maximum.
    One 40-deploy incident day would otherwise define the scale and render
    every normal week as the palest shade.
  */
  const busy = counts.filter((n) => n > 0).sort((a, b) => a - b)
  const ceiling = busy.length > 0 ? busy[Math.floor(busy.length * 0.9)] ?? 1 : 1

  const level = (count: number): number => {
    if (count <= 0) return 0
    const share = Math.min(count / ceiling, 1)
    return Math.max(1, Math.ceil(share * 4))
  }

  /* Per-month totals: the accessible version, and the one people read
     anyway when asked "how was November". */
  const byMonth = new Map<string, number>()
  for (const day of days) {
    const key = day.date.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + day.count)
  }
  const months = [...byMonth.entries()]

  const monthLabel = (key: string) =>
    new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })

  return (
    <section
      aria-labelledby="activity-heatmap-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="activity-heatmap-heading" className="text-lg font-semibold text-foreground">
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {total.toLocaleString('en-US')}
            </span>{' '}
            {noun}s across {active} active days in the last year
          </p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <ul
            aria-hidden
            className="grid shrink-0 grid-rows-7 gap-1 pr-1 text-[10px] leading-none text-muted-foreground"
          >
            {WEEKDAYS.map((day, i) => (
              <li key={day} className="flex h-3 items-center">
                {/* Every other row, or the labels crowd the squares. */}
                {i % 2 === 1 ? day : ''}
              </li>
            ))}
          </ul>

          <div
            aria-hidden
            className="grid grid-flow-col grid-rows-7 gap-1"
          >
            {days.map((day) => (
              <span
                key={day.date}
                title={`${day.count} ${noun}${day.count === 1 ? '' : 's'} on ${day.date}`}
                className={`h-3 w-3 rounded-[2px] ${LEVEL_CLASSES[level(day.count)]}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <span key={cls} className={`h-3 w-3 rounded-[2px] ${cls}`}>
              <span className="sr-only">Level {i}</span>
            </span>
          ))}
          <span>More</span>
        </div>

        <table className="sr-only">
          <caption>{heading} by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{noun}s</th>
            </tr>
          </thead>
          <tbody>
            {months.map(([key, count]) => (
              <tr key={key}>
                <th scope="row">{monthLabel(key)}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
