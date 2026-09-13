/**
 * <RefundStatusTracker> — where the money is, and who is holding it.
 *
 * A refund is the only part of e-commerce where the customer is waiting and
 * the company has already been paid, which is why "Refund processed" as a
 * final state is so infuriating: processed by whom, and why is the money not
 * there.
 *
 * THE BLOCK'S ONE IDEA: NAME THE PARTY THAT HAS IT NOW
 *
 * Four stages, and each one says who is responsible and how long they
 * typically take. The last stage is the important one and it belongs to the
 * *bank*, not the retailer — the merchant releases the money on day one and it
 * lands on day four, and that gap is where every "where is my refund" contact
 * comes from. Attributing it correctly is not passing the buck; it is the
 * difference between "we are ignoring you" and "your bank posts on Tuesdays".
 *
 * WHY A VERTICAL RAIL AND NOT A HORIZONTAL STEPPER
 *
 * Each stage carries a date, an actor and a sentence of explanation. That does
 * not fit under a horizontal node at any width, and the responsive fallback of
 * a horizontal stepper is always a vertical one, so it may as well be built
 * that way once. `order-tracking-timeline` in this catalog takes the same
 * shape for the same reason.
 *
 * THE FAILED STATE IS DRAWN, NOT LEFT AS AN EXERCISE. A refund can bounce —
 * a closed card is common on anything bought more than 90 days ago — and the
 * recovery is a form, not a support email. Give any stage `state: 'failed'`
 * and the recovery panel replaces the reassurance note at the foot.
 *
 * SERVER COMPONENT. Nothing here changes without a page load; a status tracker
 * that hydrates to render the same markup is paying for JavaScript twice.
 *
 * ACCESSIBILITY: an ordered list with the current stage marked by
 * `aria-current="step"`; each state carries a word, not just a colour or an
 * icon; the summary at the top repeats the outcome so it is reachable without
 * walking the list.
 */

import * as React from 'react'
import { Building2, Check, CircleAlert, Clock, Landmark, Store } from 'lucide-react'

export type StageState = 'done' | 'current' | 'waiting' | 'failed'

export interface RefundStage {
  id: string
  label: string
  /** Who holds the refund at this stage. The point of the block. */
  actor: string
  actorKind: 'you' | 'retailer' | 'bank'
  detail: string
  when?: string
  state: StageState
}

export interface RefundStatusTrackerProps {
  reference?: string
  amount?: string
  method?: string
  stages?: RefundStage[]
  className?: string
}

const DEFAULT_STAGES: RefundStage[] = [
  {
    id: 'received',
    label: 'Request received',
    actor: 'Northwind',
    actorKind: 'retailer',
    detail: 'Three lines from order ORD-88410, with photographs attached.',
    when: '3 September, 14:20',
    state: 'done',
  },
  {
    id: 'goods',
    label: 'Returned goods checked in',
    actor: 'Northwind · Rotterdam DC',
    actorKind: 'retailer',
    detail: 'Two of three lines arrived. The lamp is still with the carrier.',
    when: '8 September, 09:05',
    state: 'done',
  },
  {
    id: 'released',
    label: 'Refund released',
    actor: 'Northwind',
    actorKind: 'retailer',
    detail:
      'Sent to the card ending 4417. From this point the money is with your bank, not with us.',
    when: '9 September, 11:40',
    state: 'current',
  },
  {
    id: 'posted',
    label: 'Posted to your account',
    actor: 'Your bank',
    actorKind: 'bank',
    detail:
      'Most banks post within 3–5 working days. We cannot make this faster and neither can our payment provider.',
    state: 'waiting',
  },
]

const ACTOR_ICON: Record<RefundStage['actorKind'], typeof Store> = {
  you: Building2,
  retailer: Store,
  bank: Landmark,
}

const STATE_DOT: Record<StageState, string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-primary text-primary-foreground',
  waiting: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive text-destructive-foreground',
}

const STATE_WORD: Record<StageState, string> = {
  done: 'Done',
  current: 'In progress',
  waiting: 'Waiting',
  failed: 'Failed',
}

export function RefundStatusTracker({
  reference = 'REF-20418',
  amount = '£928.00',
  method = 'Visa ending 4417',
  stages = DEFAULT_STAGES,
  className = '',
}: RefundStatusTrackerProps) {
  const failed = stages.find((stage) => stage.state === 'failed')
  const current = stages.find((stage) => stage.state === 'current')

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-2xl">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Refund {reference}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{amount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Back to {method}.{' '}
            {failed
              ? 'The payment bounced — see below.'
              : current
                ? `Currently: ${current.label}.`
                : 'Complete.'}
          </p>
        </header>

        <ol className="mt-6 space-y-1">
          {stages.map((stage, index) => {
            const ActorIcon = ACTOR_ICON[stage.actorKind]
            const last = index === stages.length - 1
            return (
              <li
                key={stage.id}
                aria-current={stage.state === 'current' ? 'step' : undefined}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${STATE_DOT[stage.state]}`}
                  >
                    {stage.state === 'done' ? (
                      <Check className="h-4 w-4" />
                    ) : stage.state === 'failed' ? (
                      <CircleAlert className="h-4 w-4" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </span>
                  {/* border-s, not border-l: the rail follows the text. */}
                  {last ? null : (
                    <span
                      aria-hidden
                      className="my-1 w-px flex-1 border-s border-border"
                    />
                  )}
                </div>

                <div className={`min-w-0 flex-1 ${last ? 'pb-0' : 'pb-6'}`}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold">{stage.label}</h3>
                    <span className="text-xs text-muted-foreground">
                      {STATE_WORD[stage.state]}
                    </span>
                    {stage.when ? (
                      <span className="text-xs text-muted-foreground">· {stage.when}</span>
                    ) : null}
                  </div>

                  {/* The point of the block. */}
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    <ActorIcon aria-hidden className="h-3 w-3" />
                    With {stage.actor}
                  </p>

                  <p className="mt-1.5 text-sm text-muted-foreground">{stage.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {failed ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
          >
            <h3 className="text-sm font-semibold text-destructive">
              The card refused the refund
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually means the card has been cancelled or replaced. Give us
              bank details and the refund is re-sent within one working day — it
              is a form, not an email to support.
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Give alternative bank details
            </button>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
            Nothing has gone wrong if the last stage is still open on day three.
            Banks post refunds in batches, and a weekend does not count as a
            working day.
          </p>
        )}
      </div>
    </section>
  )
}
