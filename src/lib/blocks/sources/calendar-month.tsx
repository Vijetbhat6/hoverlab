/**
 * <CalendarMonth> — a month grid for August 2026.
 *
 * A month view's job is density without noise. Event chips truncate to a
 * single line and never wrap, so every week keeps the same row height;
 * when a day holds more than the cell can carry, the overflow collapses
 * to "+2 more" instead of stretching one row and knocking the whole
 * month out of rhythm. Out-of-month days render muted but present —
 * hiding them would break the weekday columns. Colour marks which
 * calendar an event belongs to, and the legend above the grid states
 * that mapping instead of leaving it to be guessed.
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarId = 'product' | 'design' | 'personal'

export interface CalendarEvent {
  label: string
  calendar: CalendarId
}

export interface CalendarMonthProps {
  /** Events keyed by ISO date (YYYY-MM-DD). */
  events?: Record<string, CalendarEvent[]>
  className?: string
}

const CAL_STYLE: Record<CalendarId, { label: string; chip: string; dot: string }> = {
  product: { label: 'Product', chip: 'bg-primary/15 text-primary', dot: 'bg-primary' },
  design: { label: 'Design', chip: 'bg-sky-500/15 text-sky-500', dot: 'bg-sky-500' },
  personal: { label: 'Personal', chip: 'bg-emerald-500/15 text-emerald-500', dot: 'bg-emerald-500' },
}

const DEFAULT_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-08-03': [{ label: 'Sprint 42 kickoff', calendar: 'product' }],
  '2026-08-06': [{ label: 'Design crit', calendar: 'design' }],
  '2026-08-13': [{ label: 'v3.1 release', calendar: 'product' }],
  '2026-08-17': [{ label: 'Flight to Lisbon', calendar: 'personal' }],
  '2026-08-20': [
    { label: 'Roadmap review', calendar: 'product' },
    { label: 'Portfolio review', calendar: 'design' },
    { label: 'Dentist, 15:30', calendar: 'personal' },
    { label: '1:1 with Sam', calendar: 'product' },
  ],
  '2026-08-27': [{ label: 'Q3 planning', calendar: 'product' }],
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TODAY_ISO = '2026-08-13'
/** Monday before Aug 1, 2026 (a Saturday) — the grid's first cell. */
const FIRST_CELL_UTC = Date.UTC(2026, 6, 27)
const MAX_CHIPS = 2

interface DayCell {
  iso: string
  day: number
  monthName: string
  inMonth: boolean
}

function buildWeeks(): DayCell[][] {
  const cells: DayCell[] = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(FIRST_CELL_UTC + i * 86_400_000)
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      monthName: MONTHS[date.getUTCMonth()],
      inMonth: date.getUTCMonth() === 7,
    }
  })
  return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

const WEEKS = buildWeeks()

export function CalendarMonth({ events = DEFAULT_EVENTS, className = '' }: CalendarMonthProps) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold tracking-tight">August 2026</h2>

        <ul className="flex items-center gap-3 text-xs text-muted-foreground sm:ms-4">
          {(Object.keys(CAL_STYLE) as CalendarId[]).map((id) => (
            <li key={id} className="flex items-center gap-1.5">
              <span aria-hidden className={`h-2 w-2 rounded-full ${CAL_STYLE[id].dot}`} />
              {CAL_STYLE[id].label}
            </li>
          ))}
        </ul>

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ms-1 rounded-lg border border-border/60 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Today
          </button>
        </div>
      </div>

      <div
        role="grid"
        aria-label="August 2026"
        className="overflow-hidden rounded-xl border border-border/60"
      >
        <div role="row" className="grid grid-cols-7 gap-px bg-border/60">
          {WEEKDAYS.map((weekday) => (
            <span
              key={weekday}
              role="columnheader"
              className="bg-muted/60 px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {weekday}
            </span>
          ))}
        </div>

        {WEEKS.map((week) => (
          <div key={week[0].iso} role="row" className="grid grid-cols-7 gap-px border-t border-border/60 bg-border/60">
            {week.map((cell) => {
              const dayEvents = events[cell.iso] ?? []
              const overflow = dayEvents.length - MAX_CHIPS
              const isToday = cell.iso === TODAY_ISO
              return (
                <div key={cell.iso} role="gridcell" className={cell.inMonth ? 'bg-card' : 'bg-muted/30'}>
                  <button
                    type="button"
                    aria-label={`${cell.day} ${cell.monthName} 2026${
                      dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''
                    }`}
                    aria-current={isToday ? 'date' : undefined}
                    className="flex min-h-[5.25rem] w-full flex-col items-stretch gap-1 p-1.5 text-start transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs ${
                        isToday
                          ? 'font-bold ring-2 ring-primary'
                          : cell.inMonth
                            ? 'font-medium'
                            : 'text-muted-foreground/60'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                      <span
                        key={event.label}
                        className={`block truncate rounded px-1.5 py-0.5 text-[0.65rem] font-medium ${CAL_STYLE[event.calendar].chip}`}
                      >
                        {event.label}
                      </span>
                    ))}

                    {overflow > 0 ? (
                      <span className="px-1.5 text-[0.65rem] font-medium text-muted-foreground">
                        +{overflow} more
                      </span>
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
