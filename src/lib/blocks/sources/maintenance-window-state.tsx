'use client'

/**
 * <MaintenanceWindowState> — planned downtime, with the two facts people
 * actually want.
 *
 * The catalog covers the unplanned failures: an error state with a retry,
 * an offline banner, a permission wall. Planned maintenance is a different
 * message with a different job. Nobody reading it needs to be apologised
 * to; they need to know when it ends and where to watch.
 *
 * WHAT MAINTENANCE PAGES GET WRONG
 *
 * They give a start time and no end, or an end time in a timezone the
 * reader has to convert, or — most commonly — a spinner and the word
 * "soon". This renders an explicit end time in the reader's own timezone,
 * a live countdown to it, and a link to a status page that is *not* on the
 * same infrastructure, because a status page hosted inside the outage is a
 * joke the reader has heard before.
 *
 * OVERRUNNING IS A FIRST-CLASS STATE
 *
 * Windows overrun. When the end time passes and the service is still down,
 * a countdown showing "-00:14:32" is worse than useless. Past the deadline
 * the component switches to a different sentence that stops promising a
 * time it has already missed and points at the status page instead. That
 * transition is the one thing here that is hard to get right and is the
 * reason this is a block rather than a paragraph.
 *
 * THE CLOCK CLEANS UP AFTER ITSELF. `setInterval` in an effect with a
 * matching `clearInterval`, and it stops once the deadline passes rather
 * than ticking forever in a background tab.
 *
 * ACCESSIBILITY: the countdown is `aria-live="off"` on purpose — a region
 * announcing every second is unusable — with a polite summary that updates
 * only when the state changes. The remaining time is also written out in
 * words for screen readers, since "02:14:09" is read as three numbers.
 */

import * as React from 'react'
import { ArrowUpRight, Clock, Wrench } from 'lucide-react'

export interface MaintenanceWindowStateProps {
  title?: string
  summary?: string
  /** ISO 8601 instant the window is expected to end. */
  endsAt?: string
  /** Fixed "now" so the preview and screenshots are deterministic. */
  now?: Date
  statusUrl?: string
  /** What still works while the rest is down. Empty renders nothing. */
  stillWorking?: string[]
  className?: string
}

const DEFAULT_WORKING = [
  'Published sites stay online and serving',
  'The public API continues to read from cache',
  'Existing sessions are not signed out',
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Milliseconds as `hh:mm:ss` plus a spoken form for assistive tech. */
function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return {
    clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    spoken:
      hours > 0
        ? `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`
        : `${minutes} minute${minutes === 1 ? '' : 's'}`,
  }
}

export function MaintenanceWindowState({
  title = 'Scheduled maintenance in progress',
  summary = 'We are migrating the primary database. Dashboards, the CLI and sign-in are unavailable until this finishes.',
  endsAt = '2026-08-31T04:30:00Z',
  now = new Date(Date.UTC(2026, 7, 31, 2, 15, 51)),
  statusUrl = 'https://status.example.com',
  stillWorking = DEFAULT_WORKING,
  className = '',
}: MaintenanceWindowStateProps) {
  const deadline = React.useMemo(() => new Date(endsAt).getTime(), [endsAt])
  const [current, setCurrent] = React.useState(() => now.getTime())

  /*
   * Ticks once a second and stops at the deadline. An interval that keeps
   * running after the countdown is meaningless is the reason maintenance
   * pages left open overnight burn a phone battery.
   */
  React.useEffect(() => {
    if (current >= deadline) return
    const id = setInterval(() => setCurrent((value) => value + 1000), 1000)
    return () => clearInterval(id)
  }, [current, deadline])

  const overrunning = current >= deadline
  const { clock, spoken } = splitDuration(deadline - current)

  /*
   * The end time in the reader's timezone — resolved after mount, never
   * during render.
   *
   * `toLocaleString(undefined, …)` asks the *runtime* for a locale and a
   * zone, and the server's answers are not the browser's: this rendered
   * "10:00 am IST" on the server and "10:00 GMT+5:30" in the client, which
   * React discards the subtree over. It is invisible on screen and shows up
   * only as a hydration error in the console — the same bug this codebase
   * already fixed once in `article-header.tsx`, one API over.
   *
   * So the first paint uses an explicit UTC rendering that both sides agree
   * on, and the effect swaps in the local one. A reader with JavaScript off
   * gets a correct time in a named zone rather than a wrong one in theirs.
   */
  const utcEnd = React.useMemo(
    () =>
      new Date(deadline).toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short',
      }),
    [deadline],
  )
  const [localEnd, setLocalEnd] = React.useState(utcEnd)

  React.useEffect(() => {
    setLocalEnd(
      new Date(deadline).toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    )
  }, [deadline])

  return (
    <section
      className={`mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center text-card-foreground sm:p-12 ${className}`}
    >
      <span
        aria-hidden
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10"
      >
        <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </span>

      <h1 className="mt-5 text-xl font-semibold sm:text-2xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-muted-foreground">{summary}</p>

      {/* The countdown, or the sentence that replaces it once it is wrong. */}
      <div className="mt-7 rounded-xl border border-border bg-muted/40 p-5">
        {overrunning ? (
          <p aria-live="polite" className="text-sm">
            <span className="font-semibold">This is taking longer than planned.</span>{' '}
            <span className="text-muted-foreground">
              We have passed the {localEnd} estimate. The status page has the current
              position and is hosted separately from the systems under maintenance.
            </span>
          </p>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Expected back in
            </p>
            {/*
              Live region off: a per-second announcement is unusable. The
              spoken duration below carries the same information once.
            */}
            <p
              aria-live="off"
              className="mt-1.5 font-mono text-3xl font-bold tabular-nums sm:text-4xl"
            >
              {clock}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="sr-only">About {spoken} remaining. </span>
              Estimated finish at{' '}
              <time dateTime={endsAt} className="font-medium text-foreground">
                {localEnd}
              </time>
            </p>
          </>
        )}
      </div>

      {stillWorking.length > 0 ? (
        <div className="mt-7 text-left">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Still working
          </h2>
          <ul className="mt-2.5 space-y-1.5">
            {stillWorking.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <a
        href={statusUrl}
        className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Clock aria-hidden className="h-4 w-4" />
        Live status
        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
      </a>

      <p className="mt-3 text-xs text-muted-foreground">
        Hosted separately, so it stays up when this does not.
      </p>
    </section>
  )
}
