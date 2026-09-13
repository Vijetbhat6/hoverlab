'use client'

/**
 * <Calendar> — a month grid you can drive entirely from the keyboard.
 *
 * Almost every hand-built calendar is a `<div>` of `<button>`s, which makes
 * it 42 tab stops and tells a screen reader nothing about where a date sits.
 * This is a real `role="grid"`: rows are weeks, cells are days, and the grid
 * is ONE tab stop with a roving tabindex inside it, so a keyboard user tabs
 * in, walks the month with the arrows, and tabs out. That is the WAI-ARIA
 * grid pattern and it is the whole reason this file is longer than a loop
 * over 42 numbers.
 *
 *   Left / Right     ± one day
 *   Up / Down        ± one week
 *   Home / End       first and last day of the focused week
 *   PageUp / PageDown    ± one month
 *   Shift + PageUp / PageDown   ± one year
 *   Enter / Space    select the focused day
 *
 * Three decisions that are easy to get wrong and expensive to find later:
 *
 *   - **Six rows, always.** A month occupies five or six weeks depending on
 *     where it starts. Rendering only the rows a month needs makes the grid
 *     change height as you page through it, which shifts everything below a
 *     popover and re-lays-out the page under the cursor. The trailing row
 *     costs seven muted cells and buys a fixed height.
 *   - **Arrowing onto an outside day changes the month.** The alternative —
 *     stopping at the edge — means the keyboard cannot reach the 1st of next
 *     month, which is the date people actually want.
 *   - **Focus is only moved once the grid already has it.** Writing
 *     `element.focus()` in an effect keyed on the focused date steals focus
 *     on mount, which for a calendar inside a popover scrolls the page to it
 *     before the popover has opened. The `hasFocus` ref gates that.
 *
 * Dates are compared by local midnight, never by `getTime()` on the values
 * handed in. A `Date` is an instant, two of them on the same calendar day
 * are not equal, and `sameDay` is the only comparison this file trusts.
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalendarProps {
  /** The selected day. `null` for no selection. */
  value?: Date | null
  onChange?: (date: Date) => void
  /** Month on show. Pass with `onMonthChange` to control paging yourself. */
  month?: Date
  onMonthChange?: (month: Date) => void
  /** Days before `min` or after `max` cannot be focused or chosen. */
  min?: Date
  max?: Date
  /** Per-day veto, for the days a rule rather than a range rules out. */
  isDisabled?: (date: Date) => boolean
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1
  /** BCP 47 tag for the month and weekday names. */
  locale?: string
  /** Names the grid — "Departure date", "Due date". */
  label?: string
  className?: string
}

/* ---------------------------------------------------------------- *
 *  Date maths, all of it local-midnight and none of it a dependency
 * ---------------------------------------------------------------- */

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * Add months without the 31st silently becoming the 1st.
 *
 * `new Date(2024, 0, 31)` plus one month is 31 February, which the Date
 * constructor rolls forward to 2 March. Clamping to the last day of the
 * target month is what a person means by "the next month".
 */
function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  )
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** The grid always starts on the week containing the 1st. */
function gridStart(month: Date, weekStartsOn: 0 | 1): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const shift = (first.getDay() - weekStartsOn + 7) % 7
  return addDays(first, -shift)
}

export function Calendar({
  value = null,
  onChange,
  month,
  onMonthChange,
  min,
  max,
  isDisabled,
  weekStartsOn = 0,
  locale,
  label = 'Calendar',
  className = '',
}: CalendarProps) {
  const today = React.useMemo(() => startOfDay(new Date()), [])

  /* Uncontrolled month, used only while `month` is absent. Seeded from the
     selection so opening on a chosen date shows that date's month. */
  const [ownMonth, setOwnMonth] = React.useState<Date>(() =>
    startOfDay(month ?? value ?? today),
  )
  const shownMonth = month ?? ownMonth

  const [focused, setFocused] = React.useState<Date>(() =>
    startOfDay(value ?? month ?? today),
  )

  const gridRef = React.useRef<HTMLDivElement>(null)
  /* See the header: without this, the effect below steals focus on mount. */
  const hasFocus = React.useRef(false)

  const outOfRange = React.useCallback(
    (date: Date) => {
      if (min && date < startOfDay(min)) return true
      if (max && date > startOfDay(max)) return true
      return isDisabled?.(date) ?? false
    },
    [min, max, isDisabled],
  )

  const setMonth = React.useCallback(
    (next: Date) => {
      if (month === undefined) setOwnMonth(next)
      onMonthChange?.(next)
    },
    [month, onMonthChange],
  )

  /* Keep the shown month and the focused day in step — arrowing off the
     edge of a month is how the keyboard reaches the next one. */
  const moveFocus = React.useCallback(
    (next: Date) => {
      setFocused(next)
      if (!sameMonth(next, shownMonth)) setMonth(next)
    },
    [shownMonth, setMonth],
  )

  React.useEffect(() => {
    if (!hasFocus.current) return
    const cell = gridRef.current?.querySelector<HTMLElement>('[data-focused="true"]')
    cell?.focus()
  }, [focused])

  const fullDate = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [locale],
  )

  /*
   * The 42 cells and their spoken labels, built together.
   *
   * The labels belong in the memo rather than in the cell, because
   * `Intl.DateTimeFormat.format` is not free and the alternative re-formats
   * all 42 of them on every arrow keypress — which is most of the work this
   * component does while somebody holds Right down.
   */
  const days = React.useMemo(() => {
    const start = gridStart(shownMonth, weekStartsOn)
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i)
      return { date, label: fullDate.format(date) }
    })
  }, [shownMonth, weekStartsOn, fullDate])

  const weekdayNames = React.useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
    /* 2024-01-07 was a Sunday, so it is a safe origin for "day N of week". */
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(2024, 0, 7 + ((i + weekStartsOn) % 7))
      return { short: format.format(day), long: long.format(day) }
    })
  }, [locale, weekStartsOn])

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        shownMonth,
      ),
    [locale, shownMonth],
  )

  const select = (date: Date) => {
    if (outOfRange(date)) return
    onChange?.(date)
    moveFocus(date)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key
    let next: Date | null = null

    if (key === 'ArrowLeft') next = addDays(focused, -1)
    else if (key === 'ArrowRight') next = addDays(focused, 1)
    else if (key === 'ArrowUp') next = addDays(focused, -7)
    else if (key === 'ArrowDown') next = addDays(focused, 7)
    else if (key === 'Home') {
      next = addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7))
    } else if (key === 'End') {
      next = addDays(focused, 6 - ((focused.getDay() - weekStartsOn + 7) % 7))
    } else if (key === 'PageUp') next = addMonths(focused, e.shiftKey ? -12 : -1)
    else if (key === 'PageDown') next = addMonths(focused, e.shiftKey ? 12 : 1)
    else if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      select(focused)
      return
    }

    if (!next) return
    e.preventDefault()
    moveFocus(next)
  }

  return (
    <div
      className={`w-[17.5rem] rounded-xl border border-border bg-background p-3 ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setMonth(addMonths(shownMonth, -1))}
          aria-label="Previous month"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
        {/*
          Polite, not assertive: paging the month should be read out, and it
          should never cut off whatever the user is already being told.
        */}
        <div aria-live="polite" className="text-sm font-medium text-foreground">
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => setMonth(addMonths(shownMonth, 1))}
          aria-label="Next month"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={label}
        onKeyDown={onKeyDown}
        onFocus={() => {
          hasFocus.current = true
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            hasFocus.current = false
          }
        }}
      >
        <div role="row" className="grid grid-cols-7">
          {weekdayNames.map((day) => (
            <div
              key={day.long}
              role="columnheader"
              aria-label={day.long}
              className="py-1 text-center text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {day.short}
            </div>
          ))}
        </div>

        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" key={week} className="grid grid-cols-7">
            {days.slice(week * 7, week * 7 + 7).map(({ date, label: dayLabel }) => {
              const outside = !sameMonth(date, shownMonth)
              const disabled = outOfRange(date)
              const selected = sameDay(date, value)
              const isFocused = sameDay(date, focused)

              return (
                <div role="gridcell" key={date.toISOString()} aria-selected={selected}>
                  <button
                    type="button"
                    // Roving tabindex: exactly one cell is reachable by Tab.
                    tabIndex={isFocused ? 0 : -1}
                    data-focused={isFocused}
                    disabled={disabled}
                    aria-label={dayLabel}
                    aria-current={sameDay(date, today) ? 'date' : undefined}
                    onClick={() => select(date)}
                    className={[
                      'relative mx-auto flex h-9 w-9 items-center justify-center rounded-md text-sm outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring',
                      disabled
                        ? 'cursor-not-allowed text-muted-foreground/40 line-through'
                        : 'hover:bg-muted',
                      selected
                        ? 'bg-primary font-medium text-primary-foreground hover:bg-primary'
                        : outside
                          ? 'text-muted-foreground/60'
                          : 'text-foreground',
                    ].join(' ')}
                  >
                    {date.getDate()}
                    {sameDay(date, today) && !selected ? (
                      <span
                        aria-hidden
                        className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                      />
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
