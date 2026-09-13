'use client'

/**
 * <ReviewHistoryList> — the reviews *you* wrote, and the ones you owe.
 *
 * `review-list` and `review-distribution-band` in this catalog are the buyer's
 * view of a product's reviews. This is the customer's view of their own
 * account, and it is a different screen with a different job: it is the only
 * place a review can be edited, withdrawn, or written late.
 *
 * THE PENDING SECTION IS THE POINT
 *
 * Delivered items with no review are listed first, with the deadline the
 * retailer set on them. That is the one thing this screen can do that an email
 * campaign cannot — the customer is already signed in, already looking at
 * their orders, and the friction is a text box rather than a link in a
 * message they have to trust.
 *
 * PUBLISHED REVIEWS ARE EDITABLE, AND SAY SO HONESTLY
 *
 * An edited review is marked as edited on the public page. Hiding that is
 * dishonest to the next buyer; hiding it from the *author* is worse, because
 * they find out afterwards. So the state is on the card: published, edited on
 * a date, or held for moderation with the reason.
 *
 * MODERATION IS EXPLAINED, NOT JUST FLAGGED. "Held" with no reason is how a
 * customer concludes their bad review was suppressed. Naming the rule —
 * a competitor's name, a phone number, a delivery complaint that is not about
 * the product — makes the same decision look like a policy instead of a
 * cover-up.
 *
 * ACCESSIBILITY: ratings are rendered as stars with the numeric value in text,
 * never as five decorative icons; each review's actions name the product, so a
 * screen reader hears "Edit review of Meridian task chair" rather than six
 * identical Edits; the pending and published groups are separate headed
 * sections rather than one list with a divider.
 */

import * as React from 'react'
import { Clock, Pencil, ShieldAlert, Star, ThumbsUp, Trash2 } from 'lucide-react'

export type ReviewState = 'published' | 'edited' | 'held'

export interface WrittenReview {
  id: string
  product: string
  rating: number
  title: string
  body: string
  writtenOn: string
  state: ReviewState
  editedOn?: string
  heldReason?: string
  helpful?: number
}

export interface PendingReview {
  id: string
  product: string
  deliveredOn: string
  /** Days left to write it before the window closes. */
  daysLeft: number
}

export interface ReviewHistoryListProps {
  pending?: PendingReview[]
  written?: WrittenReview[]
  className?: string
}

const DEFAULT_PENDING: PendingReview[] = [
  { id: 'p1', product: 'Halo task lamp', deliveredOn: '2 September 2026', daysLeft: 19 },
  { id: 'p2', product: 'Cable spine, 1.2 m', deliveredOn: '2 September 2026', daysLeft: 19 },
]

const DEFAULT_WRITTEN: WrittenReview[] = [
  {
    id: 'w1',
    product: 'Meridian task chair',
    rating: 4,
    title: 'Comfortable, but the armrests creak',
    body:
      'Eight months in and it still supports a full day. The armrests developed a creak around month three that a drop of oil fixed.',
    writtenOn: '11 August 2026',
    state: 'edited',
    editedOn: '3 September 2026',
    helpful: 24,
  },
  {
    id: 'w2',
    product: 'Kestrel sit-stand desk',
    rating: 5,
    title: 'Solid at full height, which is rare',
    body: 'No wobble at 120 cm with two monitors on it. The handset is unnecessarily complicated.',
    writtenOn: '14 June 2026',
    state: 'published',
    helpful: 61,
  },
  {
    id: 'w3',
    product: 'Halo task lamp',
    rating: 2,
    title: 'Arrived three weeks late',
    body: 'Ordered in April, arrived in May, and by then I had bought another one.',
    writtenOn: '19 May 2026',
    state: 'held',
    heldReason:
      'This is about delivery rather than the product, so it is not published on the product page. Delivery feedback goes to the carrier report instead.',
  },
]

function Stars({ rating, product }: { rating: number; product: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={`h-3.5 w-3.5 ${
            n <= rating ? 'fill-current text-amber-500' : 'text-muted-foreground/40'
          }`}
        />
      ))}
      {/* The value in text — five icons announce as nothing. */}
      <span className="sr-only">
        {rating} out of 5 for {product}
      </span>
    </span>
  )
}

const STATE_BADGE: Record<ReviewState, { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  edited: { label: 'Edited', className: 'bg-primary/10 text-primary' },
  held: { label: 'Held', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
}

export function ReviewHistoryList({
  pending = DEFAULT_PENDING,
  written = DEFAULT_WRITTEN,
  className = '',
}: ReviewHistoryListProps) {
  const [removed, setRemoved] = React.useState<string[]>([])
  const visible = written.filter((review) => !removed.includes(review.id))

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight">Your reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {visible.length} written · {pending.length} still to write
        </p>

        {pending.length > 0 ? (
          <section aria-labelledby="review-pending" className="mt-6">
            <h3 id="review-pending" className="text-sm font-semibold">
              Waiting on you
            </h3>
            <ul className="mt-3 space-y-2">
              {pending.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{item.product}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock aria-hidden className="h-3 w-3" />
                      Delivered {item.deliveredOn} · {item.daysLeft} days left to
                      review it
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    Write a review
                    <span className="sr-only"> of {item.product}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="review-written" className="mt-8">
          <h3 id="review-written" className="text-sm font-semibold">
            Written
          </h3>

          {visible.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing here. Reviews you write appear in this list and stay
              editable for as long as the product is sold.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {visible.map((review) => {
                const badge = STATE_BADGE[review.state]
                return (
                  <li key={review.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{review.product}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Stars rating={review.rating} product={review.product} />
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {review.state === 'edited' && review.editedOn
                              ? `Written ${review.writtenOn}, edited ${review.editedOn}`
                              : `Written ${review.writtenOn}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Pencil aria-hidden className="h-3.5 w-3.5" />
                          Edit
                          <span className="sr-only"> review of {review.product}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoved((r) => [...r, review.id])}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                          Withdraw
                          <span className="sr-only"> review of {review.product}</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="mt-3 text-sm font-semibold">{review.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>

                    {/* Naming the rule is what makes this a policy rather than
                        a cover-up. */}
                    {review.state === 'held' && review.heldReason ? (
                      <p className="mt-3 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                        <ShieldAlert
                          aria-hidden
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400"
                        />
                        {review.heldReason}
                      </p>
                    ) : null}

                    {typeof review.helpful === 'number' ? (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ThumbsUp aria-hidden className="h-3.5 w-3.5" />
                        {review.helpful} people found this helpful
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <p className="mt-6 text-xs text-muted-foreground">
          Editing a published review keeps its original date and marks it as
          edited on the product page. Withdrawing removes it entirely and cannot
          be undone.
        </p>
      </div>
    </section>
  )
}
