/**
 * <HeroBooking> — a hero whose call to action is a date, not a signup.
 *
 * For local businesses, clinics, studios, restaurants and anything sold by
 * the appointment. The visitor's question is "can I get in on Thursday",
 * so the fold answers it with a strip of real days instead of sending them
 * to a booking page to find out.
 *
 * The day strip is a radio group, not a row of buttons. Picking a day is a
 * single choice among several, which is exactly what radios are, and it
 * buys arrow-key navigation between the days for free — a row of buttons
 * would need eleven Tab presses to reach the last one.
 *
 * The inputs are visually hidden rather than `hidden`: `display: none`
 * removes an input from the tab order entirely, which would make the whole
 * strip unreachable by keyboard. `sr-only` keeps it focusable, and
 * `peer-focus-visible` draws the ring on the label the sighted user sees.
 */

'use client'

import * as React from 'react'
import { CalendarDays, Clock, MapPin } from 'lucide-react'

export interface HeroBookingDay {
  /** Weekday abbreviation, e.g. "Thu". */
  weekday: string
  /** Day of month, e.g. "14". */
  day: string
  /** Slots left. Zero renders the day as unavailable. */
  slots: number
}

export interface HeroBookingProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  submitLabel?: string
  days?: HeroBookingDay[]
  /** Called with the selected day when the form is submitted. */
  onBook?: (day: HeroBookingDay) => void
  className?: string
}

const DEFAULT_DAYS: HeroBookingDay[] = [
  { weekday: 'Mon', day: '11', slots: 2 },
  { weekday: 'Tue', day: '12', slots: 0 },
  { weekday: 'Wed', day: '13', slots: 5 },
  { weekday: 'Thu', day: '14', slots: 3 },
  { weekday: 'Fri', day: '15', slots: 7 },
]

export function HeroBooking({
  eyebrow = 'Shoreditch · open until 8pm',
  heading = 'A cut that survives the week.',
  subheading =
    'Forty-five minutes, no rush, no upsell. Book the chair rather than the shop and you get the same hands every time.',
  submitLabel = 'Check availability',
  days = DEFAULT_DAYS,
  onBook,
  className = '',
}: HeroBookingProps) {
  const firstAvailable = days.find((d) => d.slots > 0) ?? days[0]
  const [selected, setSelected] = React.useState(firstAvailable?.day ?? '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const day = days.find((d) => d.day === selected)
    if (day) onBook?.(day)
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ------------------------------------------------------ */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-primary" />
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock aria-hidden className="h-4 w-4" />
            Average wait for a first appointment: 2 days
          </p>
        </div>

        {/* -- Booking card ---------------------------------------------- */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-7"
        >
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays aria-hidden className="h-4 w-4 text-primary" />
              Pick a day
            </legend>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {days.map((d) => {
                const unavailable = d.slots === 0
                const id = `hero-booking-day-${d.day}`

                return (
                  <div key={d.day}>
                    <input
                      type="radio"
                      id={id}
                      name="hero-booking-day"
                      value={d.day}
                      checked={selected === d.day}
                      disabled={unavailable}
                      onChange={() => setSelected(d.day)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border border-border/60 px-1 py-3 text-center transition-colors hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary/10 peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:hover:border-border/60 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
                    >
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {d.weekday}
                      </span>
                      <span className="text-lg font-bold tracking-tight">{d.day}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {unavailable ? 'Full' : `${d.slots} left`}
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {submitLabel}
          </button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Free to cancel up to 24 hours before.
          </p>
        </form>
      </div>
    </section>
  )
}
