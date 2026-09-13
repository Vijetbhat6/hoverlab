'use client'

/**
 * <RelativeTime> — "3 hours ago", without the hydration bug.
 *
 * Every app writes this and most write it twice, because the obvious version
 * is wrong in a way that only shows up in production:
 *
 *   **It cannot be rendered on the server.** The server formats "2 minutes
 *   ago" at one instant and the browser re-renders it at another, React
 *   compares the two strings, and you get a hydration mismatch on a page
 *   that looked fine in dev. The fix here is that the first client render is
 *   *identical to the server's by construction*: `now` starts as `null` and
 *   both sides render the absolute date. The relative string only appears in
 *   an effect, which never runs on the server and always runs after
 *   hydration has matched.
 *
 *   **It goes stale.** A timestamp that says "1 minute ago" for the twenty
 *   minutes somebody left the tab open is worse than a fixed date. The tick
 *   interval scales with the magnitude — every 10s under a minute, every
 *   minute under an hour, hourly after that — so a feed of a hundred of
 *   these is not a hundred one-second timers.
 *
 * The rendered element is a real `<time dateTime={...}>` carrying the
 * machine-readable instant, with the full absolute date in `title`. That is
 * what makes it copyable, translatable and meaningful to a crawler, and it
 * is why this is not a `<span>`.
 *
 * `Intl.RelativeTimeFormat` does the wording, so "hace 3 horas" costs a
 * locale prop rather than a translation table.
 */

import * as React from 'react'

export interface RelativeTimeProps {
  /** The instant being described. */
  date: Date | string | number
  /** BCP 47 tag. Defaults to the browser's. */
  locale?: string
  /** `'long'` → "3 hours ago", `'narrow'` → "3h ago". */
  style?: 'long' | 'short' | 'narrow'
  /**
   * Past this many seconds, show the absolute date instead. Nobody reads
   * "14 months ago" as a date; default is 30 days.
   */
  absoluteAfter?: number
  className?: string
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** Largest unit that divides the gap, so 90 minutes reads "1 hour" not "90 minutes". */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', YEAR],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
  ['second', 1],
]

/** How often this instant's wording could change. See the header. */
function tickInterval(seconds: number): number {
  const gap = Math.abs(seconds)
  if (gap < MINUTE) return 10_000
  if (gap < HOUR) return 60_000
  return 3_600_000
}

export function RelativeTime({
  date,
  locale,
  style = 'long',
  absoluteAfter = 30 * DAY,
  className = '',
}: RelativeTimeProps) {
  const instant = React.useMemo(() => new Date(date), [date])

  /* null until mounted — this is the whole hydration story, see the header. */
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const seconds = (Date.now() - instant.getTime()) / 1000
      timer = setTimeout(() => {
        tick()
        schedule()
      }, tickInterval(seconds))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [instant])

  const absolute = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(instant),
    [locale, instant],
  )

  const text = React.useMemo(() => {
    if (now === null) return absolute

    const seconds = Math.round((instant.getTime() - now) / 1000)
    if (Math.abs(seconds) > absoluteAfter) return absolute

    const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style })
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size || unit === 'second') {
        /* Truncate toward zero: 59 minutes is "59 minutes ago", not "1 hour
           ago", and rounding away from zero would put it in the future. */
        return format.format(Math.trunc(seconds / size), unit)
      }
    }
    return absolute
  }, [now, instant, locale, style, absoluteAfter, absolute])

  return (
    <time dateTime={instant.toISOString()} title={absolute} className={className}>
      {text}
    </time>
  )
}
