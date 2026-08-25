/**
 * <DonutBreakdown> — where a total went, as one ring and a legend.
 *
 * The ring is a single `conic-gradient` with hard colour stops, not arcs
 * and not a library. One element, no SVG path arithmetic, no dependency —
 * and because the stops are percentages of a turn, adding a slice is adding
 * a row to an array rather than recomputing four `A` commands.
 *
 * WHY A DONUT AND NOT A PIE
 *
 * The hole is doing work. A pie forces the reader to compare wedge areas,
 * which people are measurably bad at; a donut turns the same data into arc
 * lengths, which they are better at, and buys the one place the total
 * belongs — the middle. A breakdown without its total is a set of
 * percentages of something unstated.
 *
 * WHY SLICES ARE CAPPED AND THE REST IS "OTHER"
 *
 * Past about six, slices become slivers with labels that cannot be placed,
 * and the chart stops being readable exactly as it starts looking
 * impressive. Everything below the cut is summed into one honest "Other"
 * row rather than being drawn and left unlabelled.
 *
 * NEVER COLOUR ALONE
 *
 * Every legend row carries its own percentage and value as text. Colour is
 * how you find a row in the ring, never how you read it — around 4% of the
 * people looking at this cannot tell two of the default hues apart, and a
 * legend that only maps swatch to name makes them guess.
 *
 * Accessibility: the ring is `aria-hidden`, and the legend is a real
 * definition list carrying every number, so the graphic is decoration over
 * text rather than a picture of data that only exists in pixels.
 */

import type * as React from 'react'

export interface BreakdownSlice {
  label: string
  value: number
  /** Any CSS colour. Falls back to a ramp mixed off the primary token. */
  color?: string
}

export interface DonutBreakdownProps {
  heading?: string
  description?: string
  slices?: BreakdownSlice[]
  /** Slices drawn individually before the remainder becomes "Other". */
  maxSlices?: number
  totalLabel?: string
  format?: (value: number) => string
  className?: string
}

const DEFAULT_SLICES: BreakdownSlice[] = [
  { label: 'Compute', value: 4820 },
  { label: 'Object storage', value: 2140 },
  { label: 'Egress', value: 1310 },
  { label: 'Managed Postgres', value: 890 },
  { label: 'Log retention', value: 420 },
  { label: 'Image builds', value: 260 },
  { label: 'Secrets manager', value: 95 },
  { label: 'Scheduled jobs', value: 60 },
]

/*
  A ramp mixed off the project's own primary, rather than eight hard-coded
  hues.

  `color-mix` in oklab walks each step further toward the card colour, so
  the ring inherits whatever palette it lands in instead of importing a
  brand of its own — and because the steps differ in lightness rather than
  only in hue, adjacent slices stay distinguishable in greyscale and to a
  red-green colour-blind reader.

  Note this reads the token directly as `var(--primary)`. The tokens in
  this project are complete `oklch()` colours, not the bare "H S% L%"
  triplets the older shadcn convention used — wrapping one in `hsl()` was
  the first version of this file and produced an invisible chart.
*/
function rampColor(index: number, count: number): string {
  const step = count <= 1 ? 0 : index / (count - 1)
  const toward = Math.round(step * 62)
  return `color-mix(in oklab, var(--primary) ${100 - toward}%, var(--card))`
}

export function DonutBreakdown({
  heading = 'Where the bill went',
  description = 'Billing period to date, across every project in the workspace.',
  slices = DEFAULT_SLICES,
  maxSlices = 5,
  totalLabel = 'Total spend',
  format = (value) => `$${value.toLocaleString('en-US')}`,
  className = '',
}: DonutBreakdownProps) {
  const sorted = [...slices].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, maxSlices)
  const tail = sorted.slice(maxSlices)

  const shown: BreakdownSlice[] =
    tail.length > 0
      ? [
          ...head,
          {
            label: `Other (${tail.length} line${tail.length === 1 ? '' : 's'})`,
            value: tail.reduce((sum, s) => sum + s.value, 0),
          },
        ]
      : head

  const total = shown.reduce((sum, s) => sum + s.value, 0) || 1

  /*
    Stops are cumulative, so each slice ends where the next begins. Using
    the same percentage for the previous stop's end and this one's start is
    what produces hard edges rather than a blur between colours.
  */
  let cursor = 0
  const stops = shown.map((slice, i) => {
    const start = cursor
    const end = start + (slice.value / total) * 100
    cursor = end
    const color = slice.color ?? rampColor(i, shown.length)
    return { ...slice, color, start, end, share: (slice.value / total) * 100 }
  })

  const gradient = stops
    .map((s) => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`)
    .join(', ')

  return (
    <section
      aria-labelledby="donut-breakdown-heading"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 id="donut-breakdown-heading" className="text-lg font-semibold text-foreground">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
          <div aria-hidden className="relative shrink-0">
            <div
              className="h-44 w-44 rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
            />
            {/* The hole, and the only place the total makes sense. */}
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-card text-center">
              <span className="text-xs text-muted-foreground">{totalLabel}</span>
              <span className="text-xl font-bold tracking-tight text-foreground">
                {format(total)}
              </span>
            </div>
          </div>

          <dl className="w-full min-w-0 flex-1 divide-y divide-border/60">
            {stops.map((slice) => (
              <div key={slice.label} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: slice.color }}
                />
                <dt className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {slice.label}
                </dt>
                <dd className="shrink-0 text-right">
                  <span className="font-mono text-sm text-foreground">
                    {format(slice.value)}
                  </span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {slice.share.toFixed(1)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
