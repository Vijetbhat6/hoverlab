'use client'

/**
 * <SubscriptionCancelFlow> — the screen a company would rather not build.
 *
 * Billing & Usage had the plan, the invoices and the card on file, which is
 * every screen except the one someone actually goes looking for. Cancelling
 * is the most emotionally loaded flow in a subscription product and it is
 * almost always the worst-built one, because nobody wants to design it and
 * the person who eventually does is asked to reduce churn rather than to
 * make it work.
 *
 * WHAT THIS BLOCK REFUSES TO DO
 *
 * No dark patterns, and the omissions are deliberate rather than lazy:
 *
 *   No hidden button. Cancel is a real control, findable, not a link in
 *   the footer of a settings tab.
 *   No fake urgency, no countdown, no "are you sure?" repeated three
 *   times. One confirmation, because destructive actions deserve one.
 *   No support-chat interception. A queue between someone and the exit is
 *   a hostage negotiation with a spinner.
 *   No requirement to give a reason. The reason select can be skipped, and
 *   the button works either way.
 *
 * These are not only ethics. The EU's own consumer rules are moving toward
 * cancellation being as easy as signup, several US states already require
 * it, and a flow built on friction is a rewrite waiting for a regulator.
 *
 * WHAT IT DOES INSTEAD, AND WHY IT STILL SAVES SOME
 *
 * It tells the truth about what happens next, precisely: the date access
 * ends, that the plan runs to the end of the period already paid for, how
 * long the data is kept, and what would be lost. A surprising share of
 * cancellations are "I don't need it this quarter" rather than "I am
 * leaving", and the honest alternatives — pause, or move down a tier —
 * are offered once, plainly, next to the real button rather than in front
 * of it.
 *
 * The reason select earns its place by being useful to the person leaving
 * too: picking "too expensive" surfaces the cheaper tier, picking "missing
 * a feature" surfaces the changelog. An answer that changes what the page
 * shows is worth giving.
 *
 * ACCESSIBILITY: the consequence list is read before the button in DOM
 * order, and the confirmation input is a real labelled field rather than a
 * placeholder — someone using a screen reader hears what they are about to
 * lose and what they must type, in that order.
 */

import * as React from 'react'
import { ArrowDownRight, CalendarClock, PauseCircle, ShieldAlert } from 'lucide-react'

export interface CancelReason {
  value: string
  label: string
  /** Shown when picked. The one thing that might genuinely help. */
  followUp?: { text: string; actionLabel: string }
}

export interface SubscriptionCancelFlowProps {
  planName?: string
  /** Human date the paid period runs to. */
  paidUntil?: string
  /** How long data is retained after access ends. */
  retentionDays?: number
  losses?: string[]
  reasons?: CancelReason[]
  /** Typed to confirm. Kept short — this is a speed bump, not a test. */
  confirmWord?: string
  onCancel?: (reason: string) => void
  onPause?: () => void
  onDowngrade?: () => void
  className?: string
}

const DEFAULT_REASONS: CancelReason[] = [
  {
    value: 'expensive',
    label: 'Too expensive',
    followUp: {
      text: 'Starter is $9 a month and keeps your projects, history and API access. Most of what you use is in it.',
      actionLabel: 'Move to Starter instead',
    },
  },
  {
    value: 'missing',
    label: 'Missing something I need',
    followUp: {
      text: 'Worth checking the changelog before you go — a lot shipped this quarter, and if it is still missing we would like to know what it is.',
      actionLabel: 'See what shipped',
    },
  },
  {
    value: 'unused',
    label: 'Not using it enough',
    followUp: {
      text: 'You can pause for up to three months. Billing stops, nothing is deleted, and everything is where you left it.',
      actionLabel: 'Pause instead',
    },
  },
  { value: 'switching', label: 'Moving to something else' },
  { value: 'project-over', label: 'The project ended' },
  { value: 'other', label: 'Something else' },
]

const DEFAULT_LOSSES = [
  'API keys stop working, and any integration using them fails',
  'Team members lose access to shared projects',
  'Scheduled exports stop running',
]

export function SubscriptionCancelFlow({
  planName = 'Team',
  paidUntil = '14 October 2026',
  retentionDays = 30,
  losses = DEFAULT_LOSSES,
  reasons = DEFAULT_REASONS,
  confirmWord = 'cancel',
  onCancel,
  onPause,
  onDowngrade,
  className = '',
}: SubscriptionCancelFlowProps) {
  const [reason, setReason] = React.useState('')
  const [typed, setTyped] = React.useState('')

  const picked = reasons.find((r) => r.value === reason)
  const confirmed = typed.trim().toLowerCase() === confirmWord.toLowerCase()

  return (
    <section
      aria-labelledby="cancel-heading"
      className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 id="cancel-heading" className="text-xl font-bold tracking-tight text-foreground">
          Cancel your {planName} plan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can do this yourself, right here, and it takes one click once you
          have read what happens.
        </p>

        {/* The consequences, before anything is asked of them. */}
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock aria-hidden className="h-4 w-4 text-muted-foreground" />
            What happens, and when
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              You keep {planName} until{' '}
              <span className="font-medium text-foreground">{paidUntil}</span> — the
              period you have already paid for. Nothing stops today.
            </li>
            <li>
              You will not be charged again, and there is no cancellation fee.
            </li>
            <li>
              After that, your data is kept for{' '}
              <span className="font-medium text-foreground">{retentionDays} days</span>{' '}
              and restoring is one click. It is deleted after that.
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert aria-hidden className="h-4 w-4 text-destructive" />
            What breaks on {paidUntil}
          </h3>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
            {losses.map((loss) => (
              <li key={loss}>{loss}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <label htmlFor="cancel-reason" className="text-sm font-medium text-foreground">
            Why are you cancelling?{' '}
            <span className="font-normal text-muted-foreground">
              — optional, and it does not change anything below
            </span>
          </label>
          <select
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="">Rather not say</option>
            {reasons.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/*
            Offered once, beside the exit rather than in front of it. If it
            is not relevant they scroll past one paragraph.
          */}
          {picked?.followUp ? (
            <div
              role="status"
              className="mt-3 rounded-xl border border-border bg-background p-4"
            >
              <p className="text-sm text-muted-foreground">{picked.followUp.text}</p>
              <button
                type="button"
                onClick={picked.value === 'unused' ? onPause : onDowngrade}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {picked.value === 'unused' ? (
                  <PauseCircle aria-hidden className="h-4 w-4" />
                ) : (
                  <ArrowDownRight aria-hidden className="h-4 w-4" />
                )}
                {picked.followUp.actionLabel}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <label htmlFor="cancel-confirm" className="block text-sm font-medium text-foreground">
            Type <span className="font-mono text-foreground">{confirmWord}</span> to
            confirm
          </label>
          <input
            id="cancel-confirm"
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="mt-2 h-9 w-full rounded-lg border border-field bg-background px-3 font-mono text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-48"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!confirmed}
              onClick={() => onCancel?.(reason)}
              className="inline-flex h-9 items-center rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel my subscription
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Keep my plan
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
