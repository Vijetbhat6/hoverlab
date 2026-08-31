'use client'

/**
 * <DashboardComparisonPeriod> — the date range, and the range it is being
 * compared against.
 *
 * Every dashboard in this catalog shows deltas — "+12.4%" beside a number
 * — and not one of them says what the comparison is against. That is the
 * single most load-bearing missing sentence in analytics UI: a figure is up
 * 12% against *something*, and whether that something is the previous seven
 * days or the same week last year changes whether it is good news.
 *
 * WHAT THIS GETS RIGHT THAT MOST PICKERS DO NOT
 *
 * The comparison is a first-class control, not a checkbox in a menu. Most
 * products bury it, default it to "previous period", and then render deltas
 * as if they were facts. Here both ranges are on screen at once, with their
 * actual dates spelled out, because "Jan 1–7 vs Dec 25–31" is a claim a
 * reader can check and "vs previous period" is not.
 *
 * THE CASE THAT IS USUALLY WRONG
 *
 * Period-over-period comparison across a week boundary is misleading for
 * anything with a weekly rhythm — a Tuesday-to-Monday window compared with
 * the seven days before it lands a weekend against a weekday. `alignWeekday`
 * exists for that, and the panel says in words when it is on, rather than
 * quietly shifting the dates by a day or two and hoping nobody reconciles.
 *
 * NO DATE LIBRARY. The ranges are computed with `Date` arithmetic in UTC so
 * a block that ships as source does not drag `date-fns` or `dayjs` into a
 * project that may already have the other one. UTC specifically: local-time
 * arithmetic across a daylight-saving boundary silently produces a
 * six-day-23-hour "week".
 *
 * ACCESSIBILITY: the presets are a real radiogroup rather than a row of
 * buttons that look selected, so a screen reader announces "3 of 5" instead
 * of five unrelated buttons; the resolved dates live in an `aria-live`
 * region so changing a preset is announced rather than only seen.
 */

import * as React from 'react'
import { ArrowLeftRight, CalendarRange, Check, Info } from 'lucide-react'

export type ComparisonMode = 'previous' | 'year' | 'none'

export interface PeriodPreset {
  id: string
  label: string
  /** Length of the window in days. */
  days: number
}

export interface DashboardComparisonPeriodProps {
  presets?: PeriodPreset[]
  initialPresetId?: string
  initialMode?: ComparisonMode
  /**
   * Anchor date the windows are measured back from. Fixed by default so the
   * preview and the screenshots do not change every night.
   */
  today?: Date
  /**
   * Shift the comparison window to start on the same weekday.
   *
   * Off by default because it is the surprising behaviour, and a block that
   * silently moved a customer's reporting window would be worse than one
   * that offers the option in the open.
   */
  alignWeekday?: boolean
  className?: string
}

const DEFAULT_PRESETS: PeriodPreset[] = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '14d', label: 'Last 14 days', days: 14 },
  { id: '28d', label: 'Last 28 days', days: 28 },
  { id: '90d', label: 'Last quarter', days: 90 },
  { id: '365d', label: 'Last year', days: 365 },
]

const MS_PER_DAY = 86_400_000

/** UTC-only arithmetic — see the header for why local time is a trap here. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function formatRange(start: Date, end: Date): string {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
  const from = start.toLocaleDateString('en-US', opts)
  const to = end.toLocaleDateString('en-US', {
    ...opts,
    year: sameYear ? undefined : 'numeric',
  })
  return `${from} – ${to}${sameYear ? `, ${end.getUTCFullYear()}` : ''}`
}

interface Range {
  start: Date
  end: Date
}

function primaryRange(today: Date, days: number): Range {
  const end = today
  // Inclusive of both ends: "last 7 days" is seven days, not eight.
  return { start: addDays(end, -(days - 1)), end }
}

function comparisonRange(
  primary: Range,
  days: number,
  mode: ComparisonMode,
  alignWeekday: boolean,
): Range | null {
  if (mode === 'none') return null

  if (mode === 'year') {
    // Same calendar dates, one year back. Deliberately not "365 days back",
    // which drifts a day every leap year and makes an annual comparison
    // stop lining up with the thing it is comparing.
    const shift = (date: Date) => {
      const next = new Date(date)
      next.setUTCFullYear(next.getUTCFullYear() - 1)
      return next
    }
    return { start: shift(primary.start), end: shift(primary.end) }
  }

  let end = addDays(primary.start, -1)
  if (alignWeekday) {
    // Walk back whole weeks until the weekday matches, so a weekend never
    // gets compared against a Tuesday.
    while (end.getUTCDay() !== primary.end.getUTCDay()) end = addDays(end, -1)
  }
  return { start: addDays(end, -(days - 1)), end }
}

const MODES: { id: ComparisonMode; label: string; hint: string }[] = [
  { id: 'previous', label: 'Previous period', hint: 'The window immediately before this one.' },
  { id: 'year', label: 'Same period last year', hint: 'The same calendar dates, one year back.' },
  { id: 'none', label: 'No comparison', hint: 'Show absolute numbers with no deltas.' },
]

export function DashboardComparisonPeriod({
  presets = DEFAULT_PRESETS,
  initialPresetId = '28d',
  initialMode = 'previous',
  today = new Date(Date.UTC(2026, 7, 31)),
  alignWeekday = false,
  className = '',
}: DashboardComparisonPeriodProps) {
  const [presetId, setPresetId] = React.useState(initialPresetId)
  const [mode, setMode] = React.useState<ComparisonMode>(initialMode)
  const [aligned, setAligned] = React.useState(alignWeekday)

  const preset = presets.find((p) => p.id === presetId) ?? presets[0]
  const primary = primaryRange(today, preset.days)
  const comparison = comparisonRange(primary, preset.days, mode, aligned)

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarRange aria-hidden className="h-4 w-4 text-muted-foreground" />
            Reporting period
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every percentage on this dashboard is measured against the comparison
            window below.
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------ *
       *  Window length
       * ------------------------------------------------------------ */}
      <div
        role="radiogroup"
        aria-label="Reporting window"
        className="mt-5 flex flex-wrap gap-2"
      >
        {presets.map((option) => {
          const selected = option.id === preset.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPresetId(option.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {/* ------------------------------------------------------------ *
       *  Comparison
       * ------------------------------------------------------------ */}
      <fieldset className="mt-6">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Compare against
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {MODES.map((option) => {
            const selected = option.id === mode
            return (
              <label
                key={option.id}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="radio"
                    name="comparison-mode"
                    value={option.id}
                    checked={selected}
                    onChange={() => setMode(option.id)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {option.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* ------------------------------------------------------------ *
       *  The resolved dates — the whole point of the block
       * ------------------------------------------------------------ */}
      <div
        aria-live="polite"
        className="mt-6 rounded-xl border border-border bg-muted/40 p-4"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
            {formatRange(primary.start, primary.end)}
          </span>

          {comparison ? (
            <>
              <ArrowLeftRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span aria-hidden className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                {formatRange(comparison.start, comparison.end)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">— no deltas shown</span>
          )}
        </div>

        {/*
          Stated in words rather than expressed as a silently shifted date.
          A reader reconciling these numbers against a spreadsheet needs to
          know the window moved and why.
        */}
        {mode === 'previous' ? (
          <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={aligned}
              onChange={(event) => setAligned(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-primary"
            />
            <span>
              Align to the same weekdays.{' '}
              {aligned
                ? 'On — the comparison window has been shifted back to whole weeks, so weekends line up.'
                : 'Off — the comparison is the window immediately before this one, which can land a weekend against weekdays.'}
            </span>
          </label>
        ) : null}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Both windows are inclusive of their end dates and computed in UTC, so a
        change of clocks never produces a week of six days and 23 hours.
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reset
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Check aria-hidden className="h-4 w-4" />
          Apply
        </button>
      </div>
    </section>
  )
}
