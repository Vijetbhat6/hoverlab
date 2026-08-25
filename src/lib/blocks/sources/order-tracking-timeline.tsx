/**
 * <OrderTrackingTimeline> — where the parcel is, and when it stopped being
 * useful to ask.
 *
 * Orders & Reviews had the confirmation, the history list and the reviews.
 * Between buying and reviewing there is a fortnight in which the only
 * question anyone has is this one, and answering it badly is what generates
 * the "where is my order" contact that dominates every support queue in
 * commerce.
 *
 * WHAT MAKES A TRACKING VIEW ANSWER THE QUESTION
 *
 *   An estimate with a shape, not a date. "Arriving Thursday" is a promise;
 *   "Thursday 4 – Friday 5 September" is information. Ranges are honest
 *   about what a carrier actually knows, and a range that slips by a day
 *   costs far less trust than a date that does.
 *
 *   The exception is louder than the progress. A delayed or failed delivery
 *   is the only state where somebody must act, so it gets its own line at
 *   the top rather than being a differently coloured dot two thirds down a
 *   list nobody reads to the end of.
 *
 *   The carrier's own reference, copyable. Half the people on this screen
 *   are about to go and paste it into the carrier's site, and a tracking
 *   number that has to be transcribed by eye is a support ticket in
 *   waiting.
 *
 * WHY THE TIMELINE IS AN ORDERED LIST
 *
 * It is a sequence of events in time, which is what `<ol>` means. A stack
 * of divs with a border-left is the same picture and none of the meaning:
 * a screen reader announces "list, 5 items" and then each step in order,
 * which is exactly the structure a sighted reader gets from the rail.
 *
 * The current step carries `aria-current="step"`. Without it the only thing
 * marking "you are here" is a filled circle, and a filled circle is not
 * information anybody can hear.
 *
 * Future steps are dimmed AND labelled. "Out for delivery — not yet" reads
 * correctly in a screen reader; a pale grey circle does not.
 *
 * Server component — no state, no effects.
 */

import type * as React from 'react'
import { AlertTriangle, Check, Copy, MapPin, Package, Truck } from 'lucide-react'

export type TrackingState = 'done' | 'current' | 'upcoming' | 'failed'

export interface TrackingStep {
  label: string
  /** Where it happened. Omitted for steps that have not happened. */
  place?: string
  /** When, already formatted. */
  at?: string
  state: TrackingState
  detail?: string
}

export interface OrderTrackingTimelineProps {
  orderRef?: string
  carrier?: string
  trackingNumber?: string
  /** A range, not a date. See the note above. */
  estimate?: string
  steps?: TrackingStep[]
  /** The one line that outranks the timeline when something is wrong. */
  exception?: { headline: string; body: string; actionLabel: string }
  className?: string
}

const DEFAULT_STEPS: TrackingStep[] = [
  {
    label: 'Order placed',
    place: 'Online',
    at: '29 Aug, 14:02',
    state: 'done',
  },
  {
    label: 'Packed',
    place: 'Peterborough fulfilment centre',
    at: '30 Aug, 08:41',
    state: 'done',
  },
  {
    label: 'Collected by carrier',
    place: 'Peterborough',
    at: '30 Aug, 17:15',
    state: 'done',
  },
  {
    label: 'In transit',
    place: 'Warrington hub',
    at: '31 Aug, 03:22',
    state: 'current',
    detail: 'Scanned at the sorting hub. The next scan is usually the local depot.',
  },
  { label: 'Out for delivery', state: 'upcoming' },
  { label: 'Delivered', state: 'upcoming' },
]

const ICONS: Record<TrackingState, React.ComponentType<{ className?: string }>> = {
  done: Check,
  current: Truck,
  upcoming: Package,
  failed: AlertTriangle,
}

export function OrderTrackingTimeline({
  orderRef = 'NW-84213',
  carrier = 'Evri',
  trackingNumber = 'H00 4471 9928 3310',
  estimate = 'Thursday 4 – Friday 5 September',
  steps = DEFAULT_STEPS,
  exception,
  className = '',
}: OrderTrackingTimelineProps) {
  return (
    <section
      aria-labelledby="tracking-heading"
      className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Order {orderRef}
          </p>
          <h2 id="tracking-heading" className="mt-1 text-lg font-semibold text-foreground">
            Arriving {estimate}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden className="h-4 w-4" />
              {carrier}
            </span>
            {/* Copyable, because the next thing they do is paste it. */}
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-foreground">{trackingNumber}</span>
              <button
                type="button"
                className="rounded p-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Copy aria-hidden className="h-3.5 w-3.5" />
                <span className="sr-only">Copy tracking number {trackingNumber}</span>
              </button>
            </span>
          </div>
        </header>

        {/* Above the timeline, because it is the only state that needs
            somebody to do something. */}
        {exception ? (
          <div className="border-b border-border bg-destructive/5 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle aria-hidden className="h-4 w-4 text-destructive" />
              {exception.headline}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{exception.body}</p>
            <button
              type="button"
              className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {exception.actionLabel}
            </button>
          </div>
        ) : null}

        {/* An ordered list, because that is what this is. */}
        <ol className="px-6 py-5">
          {steps.map((step, i) => {
            const Icon = ICONS[step.state]
            const last = i === steps.length - 1
            const muted = step.state === 'upcoming'

            return (
              <li
                key={step.label}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {/* The rail. Drawn per item and stopped on the last one, so
                    there is no trailing line under the final marker. */}
                {last ? null : (
                  <span
                    aria-hidden
                    className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${
                      step.state === 'done' ? 'bg-primary/40' : 'bg-border'
                    }`}
                  />
                )}

                <span
                  aria-hidden
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${
                    step.state === 'done'
                      ? 'bg-primary/15 text-primary'
                      : step.state === 'current'
                        ? 'bg-primary text-primary-foreground'
                        : step.state === 'failed'
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={`text-sm font-medium ${muted ? 'text-muted-foreground' : 'text-foreground'}`}
                  >
                    {step.label}
                    {/* The state in words. A pale circle is not information
                        anybody can hear. */}
                    {muted ? (
                      <span className="font-normal text-muted-foreground"> — not yet</span>
                    ) : null}
                  </p>

                  {step.place || step.at ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[step.place, step.at].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}

                  {step.detail ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">{step.detail}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
