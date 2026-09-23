'use client'

/**
 * <SearchFacetRange> — the facet that is a number, not a checkbox.
 *
 * Checkbox facets are the easy half of faceted search. Price, date and
 * duration are the half that gets shipped as two bare number inputs labelled
 * Min and Max, and that control is unusable for the thing people actually do
 * with a range: work out where the results are before choosing a bound.
 *
 * THE HISTOGRAM IS THE CONTROL, NOT AN ORNAMENT
 *
 * Bars over the track show how many items fall in each bucket, so "under
 * £200" stops being a guess. Bars outside the selected range are dimmed
 * rather than hidden — the same argument `search-facet-panel` makes about
 * zero-count options: a distribution that reshapes itself as you drag is
 * disorienting, and knowing what you excluded is most of the value.
 *
 * TWO SLIDERS, NOT ONE `<input type="range">` WITH A HACK
 *
 * A dual-thumb range has no native element. The honest implementation is two
 * overlaid sliders, each a real `<input type="range">` with its own label,
 * clamped so the lower cannot cross the upper. That keeps keyboard support,
 * arrow-key stepping and screen-reader announcement for free — all of which a
 * div-with-pointer-events reimplementation loses and rarely puts back.
 *
 * THE NUMBER INPUTS STAY. Dragging is for exploring; typing is for "I have a
 * budget of exactly £750". Both write the same state, and the typed value is
 * clamped on blur rather than on every keystroke, so typing "1" on the way to
 * "1200" does not snap the thumb to the floor.
 *
 * PRESETS ARE FOR THE COMMON CASES ONLY. Three, drawn from what people
 * actually filter by, not a decile split of the data. A preset row that
 * mirrors the histogram is a second copy of a control that already exists.
 *
 * ACCESSIBILITY: each thumb is a labelled slider with `aria-valuetext` in
 * currency, because "420" announced bare is not a price. The result count is
 * a polite live region; the histogram is `aria-hidden` and its information is
 * available as the per-bucket counts in the visually hidden summary list.
 */

import * as React from 'react'

export interface RangeBucket {
  /** Lower bound of the bucket. */
  from: number
  count: number
}

export interface SearchFacetRangeProps {
  label?: string
  unit?: string
  min?: number
  max?: number
  step?: number
  buckets?: RangeBucket[]
  presets?: { label: string; from: number; to: number }[]
  className?: string
}

const DEFAULT_BUCKETS: RangeBucket[] = [
  { from: 0, count: 4 },
  { from: 100, count: 11 },
  { from: 200, count: 26 },
  { from: 300, count: 38 },
  { from: 400, count: 31 },
  { from: 500, count: 19 },
  { from: 600, count: 12 },
  { from: 700, count: 7 },
  { from: 800, count: 5 },
  { from: 900, count: 2 },
]

const DEFAULT_PRESETS = [
  { label: 'Under £300', from: 0, to: 300 },
  { label: '£300–£600', from: 300, to: 600 },
  { label: 'Over £600', from: 600, to: 1000 },
]

function money(value: number, unit: string) {
  return `${unit}${value.toLocaleString('en-GB')}`
}

export function SearchFacetRange({
  label = 'Price',
  unit = '£',
  min = 0,
  max = 1000,
  step = 10,
  buckets = DEFAULT_BUCKETS,
  presets = DEFAULT_PRESETS,
  className = '',
}: SearchFacetRangeProps) {
  const uid = React.useId()
  const [from, setFrom] = React.useState(200)
  const [to, setTo] = React.useState(600)
  const [fromText, setFromText] = React.useState('200')
  const [toText, setToText] = React.useState('600')

  const width = buckets.length > 1 ? buckets[1]!.from - buckets[0]!.from : 100
  const tallest = Math.max(...buckets.map((b) => b.count), 1)
  const inRange = buckets
    .filter((b) => b.from + width > from && b.from < to)
    .reduce((sum, b) => sum + b.count, 0)

  function commitFrom(raw: string) {
    const value = Number.parseInt(raw, 10)
    const next = Number.isNaN(value) ? min : Math.min(Math.max(value, min), to - step)
    setFrom(next)
    setFromText(String(next))
  }

  function commitTo(raw: string) {
    const value = Number.parseInt(raw, 10)
    const next = Number.isNaN(value) ? max : Math.max(Math.min(value, max), from + step)
    setTo(next)
    setToText(String(next))
  }

  function apply(a: number, b: number) {
    setFrom(a)
    setTo(b)
    setFromText(String(a))
    setToText(String(b))
  }

  const pct = (value: number) => ((value - min) / (max - min)) * 100

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-5">
        <fieldset className="border-0 p-0">
          <legend className="text-sm font-semibold">{label}</legend>
          <p aria-live="polite" className="mt-0.5 text-xs text-muted-foreground">
            {inRange} products between {money(from, unit)} and {money(to, unit)}
          </p>

          {/* Decorative: the same numbers are in the summary list below. */}
          <div aria-hidden className="mt-4 flex h-16 items-end gap-0.5">
            {buckets.map((bucket) => {
              const inside = bucket.from + width > from && bucket.from < to
              return (
                <span
                  key={bucket.from}
                  style={{ height: `${Math.max(6, (bucket.count / tallest) * 100)}%` }}
                  className={`flex-1 rounded-t-sm border border-transparent transition-colors ${
                    inside ? 'bg-primary/70' : 'bg-muted'
                  }`}
                />
              )
            })}
          </div>

          {/* Two real sliders, overlaid. Both keep keyboard support. */}
          <div className="relative mt-2 h-6">
            <span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted border border-transparent"
            />
            <span
              aria-hidden
              style={{ insetInlineStart: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary border border-transparent"
            />
            <label htmlFor={`${uid}-from`} className="sr-only">
              Lowest {label}
            </label>
            <input
              id={`${uid}-from`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={from}
              aria-valuetext={money(from, unit)}
              onChange={(e) => {
                const next = Math.min(Number(e.target.value), to - step)
                setFrom(next)
                setFromText(String(next))
              }}
              className="absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent accent-primary"
            />
            <label htmlFor={`${uid}-to`} className="sr-only">
              Highest {label}
            </label>
            <input
              id={`${uid}-to`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={to}
              aria-valuetext={money(to, unit)}
              onChange={(e) => {
                const next = Math.max(Number(e.target.value), from + step)
                setTo(next)
                setToText(String(next))
              }}
              className="absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent accent-primary"
            />
          </div>

          {/* Typing is for a known budget; clamped on blur, not per keystroke. */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor={`${uid}-from-text`} className="sr-only">
                Lowest {label}, typed
              </label>
              <input
                id={`${uid}-from-text`}
                inputMode="numeric"
                value={fromText}
                onChange={(e) => setFromText(e.target.value)}
                onBlur={(e) => commitFrom(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <span aria-hidden className="text-sm text-muted-foreground">
              to
            </span>
            <div className="flex-1">
              <label htmlFor={`${uid}-to-text`} className="sr-only">
                Highest {label}, typed
              </label>
              <input
                id={`${uid}-to-text`}
                inputMode="numeric"
                value={toText}
                onChange={(e) => setToText(e.target.value)}
                onBlur={(e) => commitTo(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const on = from === preset.from && to === preset.to
              return (
                <li key={preset.label}>
                  <button
                    type="button"
                    onClick={() => apply(preset.from, preset.to)}
                    aria-pressed={on}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      on
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {preset.label}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* The histogram, as text. */}
          <ul className="sr-only">
            {buckets.map((bucket) => (
              <li key={bucket.from}>
                {money(bucket.from, unit)} to {money(bucket.from + width, unit)}:{' '}
                {bucket.count} products
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </section>
  )
}
