'use client'

/**
 * <OfflineStateBanner> — the connection is gone; here is what still works.
 *
 * Empty & Error States had the empty state, the retry, the 404, the
 * skeleton and the 403. All five are answers the *server* gave. Losing
 * the network is the one failure where there is no answer at all, and it
 * is the most common one on a train, in a lift, or on hotel wifi.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The banner leads with what is still safe to do, not with the failure.
 * "You are offline" tells someone what they already suspect; "your last
 * three edits are saved on this device and will send when you reconnect"
 * is the sentence that decides whether they keep typing or close the tab
 * and lose the work. The unsent count is the headline number.
 *
 * THE RETRY IS VISIBLY BACKING OFF
 *
 * A spinner that has been going for four minutes teaches people that the
 * app is broken. Showing the interval — "trying again in 8s", then 16, then
 * 30 — is honest about exponential backoff and makes "Retry now" a
 * meaningful button rather than a placebo, because it is the only thing
 * that skips the wait.
 *
 * WHAT WILL NOT WORK IS LISTED
 *
 * Offline is not a single state: local edits queue, but anything needing
 * the server — search across the workspace, inviting somebody, publishing
 * — cannot. Naming those three stops the user discovering them one
 * failed click at a time.
 *
 * ACCESSIBILITY: `role="status"` with `aria-live="polite"`, not `alert` —
 * losing wifi is not an emergency and an assertive region interrupts
 * whatever the user is typing, which is precisely the thing this banner
 * is reassuring them they may continue to do.
 */

import * as React from 'react'
import { CloudOff, RefreshCw, WifiOff } from 'lucide-react'

export interface OfflineStateBannerProps {
  /** Changes saved locally and waiting to send. */
  queuedChanges?: number
  /** What is unavailable until the connection returns. */
  unavailable?: string[]
  className?: string
}

const DEFAULT_UNAVAILABLE = [
  'Searching across the workspace',
  'Inviting people',
  'Publishing or sharing a link',
]

/** Backoff intervals, in seconds. Shown, not just used. */
const BACKOFF = [8, 16, 30, 60]

export function OfflineStateBanner({
  queuedChanges = 3,
  unavailable = DEFAULT_UNAVAILABLE,
  className = '',
}: OfflineStateBannerProps) {
  const [attempt, setAttempt] = React.useState(0)
  const [seconds, setSeconds] = React.useState(BACKOFF[0]!)
  const [trying, setTrying] = React.useState(false)

  /*
   * Declared before the effects that call it, and memoised.
   *
   * Both are the lint rule's doing rather than taste, and both are right:
   * a function hoisted past the effect that depends on it is invisible to
   * dependency checking, and an un-memoised one would restart the
   * countdown on every render — which is a timer that never reaches zero.
   */
  const retry = React.useCallback(() => {
    setTrying(true)
    window.setTimeout(() => {
      setAttempt((a) => {
        const next = Math.min(a + 1, BACKOFF.length - 1)
        setSeconds(BACKOFF[next]!)
        return next
      })
      setTrying(false)
    }, 900)
  }, [])

  /* The visible countdown. A wait nobody can see reads as a hang. */
  React.useEffect(() => {
    if (trying || seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds, trying])

  React.useEffect(() => {
    if (trying || seconds > 0) return
    // Firing when the countdown reaches zero is the whole intent — this is
    // the automatic attempt the visible timer has been counting down to.
    retry()
  }, [seconds, trying, retry])

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div
        role="status"
        aria-live="polite"
        className="overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/5"
      >
        <div className="flex flex-wrap items-start gap-3 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <WifiOff aria-hidden className="h-4.5 w-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            {/* Reassurance first. The failure is the subheading. */}
            <h2 className="text-base font-semibold text-foreground">
              {queuedChanges === 0
                ? 'Everything you have done is saved on this device'
                : `${queuedChanges} ${
                    queuedChanges === 1 ? 'change is' : 'changes are'
                  } saved on this device`}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You are offline. Keep working — edits are written locally and sent
              automatically the moment the connection is back. Nothing is lost by
              closing this tab, though it will not send until you open it again.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={retry}
                disabled={trying}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <RefreshCw
                  aria-hidden
                  className={`h-3.5 w-3.5 ${trying ? 'motion-safe:animate-spin' : ''}`}
                />
                {trying ? 'Trying' : 'Retry now'}
              </button>

              {/* The interval, in the open. */}
              <span className="text-xs tabular-nums text-muted-foreground">
                {trying
                  ? 'Reaching the server…'
                  : `Trying again in ${seconds}s · attempt ${attempt + 2}`}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-500/30 bg-background/40 px-5 py-3">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <CloudOff aria-hidden className="h-3.5 w-3.5" />
            Not available until you reconnect
          </h3>
          {/* Named, so they are not discovered one failed click at a time. */}
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {unavailable.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
