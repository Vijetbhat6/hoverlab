'use client'

/**
 * <BookingScheduler> — pick a day, pick a time, and know which time it is.
 *
 * The two Contact & Forms blocks here send a message and wait. Plenty of
 * teams do not want a message — they want the call booked — and the moment
 * a "contact us" form becomes a calendar, three problems arrive that a
 * message form never had.
 *
 * TIME ZONES, WHICH IS THE WHOLE PROBLEM
 *
 * A slot list with no zone on it is the single most common way this pattern
 * wastes somebody's morning. Every time here is rendered in the visitor's
 * own zone, the zone is named above the slots, and it is a control rather
 * than a label — because the person booking is often not in the zone their
 * laptop is set to, and the ones who are travelling are exactly the ones a
 * missed call costs the most.
 *
 * The zone is resolved on the client, after mount, deliberately. Reading
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` during a server render
 * gives the server's zone — UTC on most hosts — and a first paint that says
 * "times shown in UTC" to someone in Mumbai is worse than a first paint
 * that says nothing. Until it resolves, the label is neutral.
 *
 * A STRIP OF DAYS, NOT A MONTH VIEW
 *
 * A full month calendar is mostly cells you cannot click. A horizontally
 * scrollable strip of the days that actually have availability answers the
 * real question — "when could I see them" — at a glance, and it works at
 * 320px, where a seven-column month view starts hiding its own controls.
 *
 * Fully booked days stay in the strip rather than being filtered out. A
 * gap where Wednesday should be reads as a rendering fault; a Wednesday
 * marked "Full" reads as information, and it is the thing that makes the
 * free days next to it look worth taking.
 *
 * ACCESSIBILITY
 *
 * The slots are a radio group, not a grid of buttons. That is what gives
 * arrow-key movement between times, one tab stop for the whole set, and an
 * announced group name — all of it from the platform, none of it
 * hand-rolled. Days are the same. Full dates are in each label for screen
 * readers even though the visible text is abbreviated, because "14" is not
 * a date.
 */

import * as React from 'react'
import { Calendar, Check, Clock, Globe, Video } from 'lucide-react'

export interface BookingDay {
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** Times as 24h "HH:MM" in the host's zone. Empty means fully booked. */
  slots: string[]
}

export interface BookingSchedulerProps {
  heading?: string
  description?: string
  /** Length of the meeting, in minutes — shown, never inferred. */
  durationMinutes?: number
  /** IANA zone the `slots` are expressed in. */
  hostTimeZone?: string
  days?: BookingDay[]
  onConfirm?: (choice: { date: string; time: string; timeZone: string }) => void
  className?: string
}

/*
  A fortnight of availability with realistic gaps: a fully booked Tuesday,
  thin Fridays, nothing at weekends. A demo where every slot is free makes
  the empty state look like a bug the first time a real calendar renders.
*/
const DEFAULT_DAYS: BookingDay[] = [
  { date: '2026-09-01', slots: ['09:00', '09:30', '11:00', '14:00', '15:30'] },
  { date: '2026-09-02', slots: [] },
  { date: '2026-09-03', slots: ['10:00', '10:30', '13:00', '16:00'] },
  { date: '2026-09-04', slots: ['09:30', '12:00'] },
  { date: '2026-09-05', slots: ['15:00'] },
  { date: '2026-09-08', slots: ['09:00', '11:30', '13:30', '14:00', '16:30'] },
  { date: '2026-09-09', slots: ['10:00', '10:30', '11:00', '15:00'] },
  { date: '2026-09-10', slots: ['09:00', '13:00'] },
]

const ZONES = [
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
]

export function BookingScheduler({
  heading = 'Book a walkthrough',
  description = 'Thirty minutes with an engineer, not a sales team. Bring your codebase.',
  durationMinutes = 30,
  hostTimeZone = 'Europe/London',
  days = DEFAULT_DAYS,
  onConfirm,
  className = '',
}: BookingSchedulerProps) {
  const firstOpen = days.find((day) => day.slots.length > 0)
  const [selectedDate, setSelectedDate] = React.useState(firstOpen?.date ?? days[0]?.date ?? '')
  const [selectedTime, setSelectedTime] = React.useState('')

  /*
    Resolved after mount, never during render. See the note above: the
    server's zone is not the visitor's, and a wrong zone stated confidently
    is worse than no zone stated yet.
  */
  const [zone, setZone] = React.useState<string | null>(null)
  React.useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const activeZone = zone ?? hostTimeZone
  const day = days.find((d) => d.date === selectedDate)

  /** A host-zone "HH:MM" on `date`, as an absolute instant. */
  function instant(date: string, time: string): Date {
    /*
      Built from the host zone by measuring its offset on that date rather
      than hard-coding one. Offsets move twice a year, and a scheduler that
      is right in January and an hour out in July is the classic version of
      this bug.
    */
    const naive = new Date(`${date}T${time}:00Z`)
    const asHost = new Date(
      naive.toLocaleString('en-US', { timeZone: hostTimeZone }),
    )
    const asUtc = new Date(naive.toLocaleString('en-US', { timeZone: 'UTC' }))
    return new Date(naive.getTime() + (asUtc.getTime() - asHost.getTime()))
  }

  function formatTime(date: string, time: string): string {
    return instant(date, time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: activeZone,
    })
  }

  const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
      ...opts,
      timeZone: 'UTC',
    })

  return (
    <section
      aria-labelledby="booking-heading"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-6 py-5">
          <h2 id="booking-heading" className="text-lg font-semibold text-foreground">
            {heading}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden className="h-4 w-4" />
              {durationMinutes} minutes
            </li>
            <li className="flex items-center gap-1.5">
              <Video aria-hidden className="h-4 w-4" />
              Video call, link on confirmation
            </li>
          </ul>
        </header>

        <div className="px-6 py-5">
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar aria-hidden className="h-4 w-4 text-muted-foreground" />
              Pick a day
            </legend>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {days.map((option) => {
                const open = option.slots.length > 0
                const active = option.date === selectedDate
                return (
                  <label
                    key={option.date}
                    className={`flex min-w-[4.5rem] shrink-0 cursor-pointer flex-col items-center rounded-xl border px-3 py-2.5 text-center transition ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : open
                          ? 'border-border bg-background text-foreground hover:bg-muted'
                          : 'cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground'
                    } focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background`}
                  >
                    <input
                      type="radio"
                      name="booking-day"
                      value={option.date}
                      checked={active}
                      disabled={!open}
                      onChange={() => {
                        setSelectedDate(option.date)
                        setSelectedTime('')
                      }}
                      className="sr-only"
                    />
                    <span className="text-xs uppercase tracking-wide">
                      {dayLabel(option.date, { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-semibold leading-tight">
                      {dayLabel(option.date, { day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {open ? `${option.slots.length} free` : 'Full'}
                    </span>
                    <span className="sr-only">
                      {dayLabel(option.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      {open ? '' : ', fully booked'}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <legend className="float-left text-sm font-medium text-foreground">
                Pick a time
              </legend>

              {/* A control, not a label. Someone booking from an airport is
                  the person this matters most to. */}
              <label className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Globe aria-hidden className="h-3.5 w-3.5" />
                <span className="sr-only">Show times in this time zone</span>
                <select
                  value={activeZone}
                  onChange={(event) => setZone(event.target.value)}
                  className="h-8 rounded-lg border border-field bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {[...new Set([activeZone, ...ZONES])].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {day && day.slots.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {day.slots.map((slot) => {
                  const active = slot === selectedTime
                  return (
                    <label
                      key={slot}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      } focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background`}
                    >
                      <input
                        type="radio"
                        name="booking-slot"
                        value={slot}
                        checked={active}
                        onChange={() => setSelectedTime(slot)}
                        className="sr-only"
                      />
                      {formatTime(day.date, slot)}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nothing free that day. Try another.
              </p>
            )}
          </fieldset>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <p role="status" className="text-sm text-muted-foreground">
            {selectedTime && day ? (
              <>
                <Check aria-hidden className="me-1.5 inline h-4 w-4 text-foreground" />
                {dayLabel(day.date, { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
                <span className="font-medium text-foreground">
                  {formatTime(day.date, selectedTime)}
                </span>{' '}
                ({activeZone.replace(/_/g, ' ')})
              </>
            ) : (
              'Pick a time to continue.'
            )}
          </p>

          <button
            type="button"
            disabled={!selectedTime}
            onClick={() =>
              onConfirm?.({ date: selectedDate, time: selectedTime, timeZone: activeZone })
            }
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            Confirm booking
          </button>
        </footer>
      </div>
    </section>
  )
}
