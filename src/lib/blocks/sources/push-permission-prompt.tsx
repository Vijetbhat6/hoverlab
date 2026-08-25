'use client'

/**
 * <PushPermissionPrompt> — the ask before the browser's ask.
 *
 * Notifications had the toast, the inbox and the preferences matrix — the
 * three screens that exist once someone has already said yes. This is the
 * moment they say it, and it is the one with consequences that cannot be
 * undone.
 *
 * WHY A PRE-PROMPT IS NOT A DARK PATTERN
 *
 * `Notification.requestPermission()` can be answered "block" exactly once,
 * and after that the site cannot ask again — not next week, not after
 * shipping the feature that would have made it worth it. Only the user can
 * reverse it, buried in site settings almost nobody opens.
 *
 * So the native dialog is a one-shot with no retry, and firing it on page
 * load, before anyone knows what they would be subscribing to, spends it on
 * a reflex. The soft ask costs nothing when declined: "not now" is
 * recoverable, "block" is not. That is the whole argument, and it is why
 * this pattern is worth having as a block rather than a line of code.
 *
 * WHAT MAKES A SOFT ASK HONEST RATHER THAN MANIPULATIVE
 *
 *   It says what will be sent, specifically, and what will not. "Enable
 *   notifications?" is not a question anyone can answer well.
 *   Declining is a real button of the same weight, not grey text.
 *   It does not reappear on the next page load. One dismissal is an answer.
 *   It is triggered by a moment that earns it — after a build was queued,
 *   an export started, a thread was joined — never on arrival.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not call `requestPermission()` on mount, on scroll, or on any
 * timer. `onEnable` is where the real call goes, and it fires from a click
 * — which is also what Safari requires, and increasingly what Chrome's
 * heuristics expect.
 *
 * The `denied` state is rendered because it will happen and the block is
 * incomplete without it: at that point the only honest thing to show is
 * where the browser setting is, since nothing in the page can reopen it.
 */

import * as React from 'react'
import { Bell, BellOff, Check, X } from 'lucide-react'

export type PushPermission = 'default' | 'granted' | 'denied'

export interface PushPermissionPromptProps {
  heading?: string
  /** What will actually be sent. Be specific or do not ask. */
  willSend?: string[]
  /** What will never be sent. The half that earns the yes. */
  willNotSend?: string
  /** The moment that triggered the ask, named back to them. */
  context?: string
  permission?: PushPermission
  onEnable?: () => void
  onDismiss?: () => void
  className?: string
}

const DEFAULT_WILL_SEND = [
  'A deploy finishes or fails',
  'Someone replies to a thread you are in',
  'A scheduled export is ready to download',
]

export function PushPermissionPrompt({
  heading = 'Want to know when this finishes?',
  willSend = DEFAULT_WILL_SEND,
  willNotSend = 'No marketing, no digests, no re-engagement nudges — those go to email, where you can unsubscribe.',
  context = 'Your build usually takes about nine minutes.',
  permission = 'default',
  onEnable,
  onDismiss,
  className = '',
}: PushPermissionPromptProps) {
  const [state, setState] = React.useState<PushPermission>(permission)
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  if (state === 'granted') {
    return (
      <section className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}>
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Notifications are on.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You can change exactly what gets sent in Settings, and turn them off
              there too.
            </p>
          </div>
        </div>
      </section>
    )
  }

  /*
    Blocked. Nothing in the page can undo this — see the note at the top —
    so the only useful thing left is to say where the switch is.
  */
  if (state === 'denied') {
    return (
      <section className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <BellOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Your browser is blocking notifications for this site.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We cannot ask again from here — browsers only allow that once. To
              turn them back on, open the padlock in the address bar and set
              Notifications to Allow.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="push-prompt-heading"
      className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Bell className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="push-prompt-heading" className="text-sm font-semibold text-foreground">
              {heading}
            </h2>
            {context ? (
              <p className="mt-1 text-sm text-muted-foreground">{context}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(true)
              onDismiss?.()
            }}
            className="-m-1 rounded p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X aria-hidden className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>

        {/* Specific, or do not ask. */}
        <ul className="mt-4 space-y-1.5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
          {willSend.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-muted-foreground">{willNotSend}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              /*
                The real `Notification.requestPermission()` belongs here, in
                a click handler — never on mount, and never on a timer.
              */
              setState('granted')
              onEnable?.()
            }}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Notify me
          </button>
          {/* Same weight as the yes. A grey link here is the tell that a
              soft ask has stopped being a question. */}
          <button
            type="button"
            onClick={() => {
              setDismissed(true)
              onDismiss?.()
            }}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Not now
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          This asks your browser next. We will not ask here again.
        </p>
      </div>
    </section>
  )
}
