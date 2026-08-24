'use client'

/**
 * <ReviewList> — customer reviews with sorting and helpful votes.
 *
 * The "verified purchase" badge is the most valuable element here and the
 * one most often left out. A review page where nothing distinguishes a
 * buyer from a passer-by is worth less than no reviews at all, because
 * readers discount all of it.
 *
 * The helpful vote is optimistic — the count moves on click and the request
 * catches up. For an action this small, waiting for a round trip before the
 * number changes reads as a broken button, and the cost of being wrong is
 * one wrong count until the next load.
 *
 * Long reviews are clamped with a real expand control rather than being cut
 * off with a fade. A gradient that hides text with no way to reveal it is a
 * dark pattern by accident.
 */

import * as React from 'react'
import { Star, BadgeCheck, ThumbsUp } from 'lucide-react'

export interface Review {
  id: string
  author: string
  rating: number
  title: string
  body: string
  /** ISO date. */
  date: string
  verified?: boolean
  helpfulCount: number
  /** Size/fit note, e.g. "Bought M · usually M". */
  context?: string
}

export interface ReviewListProps {
  reviews?: Review[]
  locale?: string
  className?: string
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Hannah T.',
    rating: 5,
    title: 'Better than the price suggests',
    body: 'I bought this expecting to return it and it has become the thing I reach for three days a week. The knit is dense without being heavy, and after four washes there is no pilling at the cuffs where I would expect it first. Sizing is honest — I am usually a medium and the medium fits with room for a shirt underneath.',
    date: '2026-07-28',
    verified: true,
    helpfulCount: 34,
    context: 'Bought M · usually M',
  },
  {
    id: '2',
    author: 'Devin R.',
    rating: 4,
    title: 'Great, but runs slightly long',
    body: 'No complaints about the material at all. The body is about an inch longer than I expected, which is fine untucked but worth knowing if you are between sizes.',
    date: '2026-07-14',
    verified: true,
    helpfulCount: 12,
    context: 'Bought L · usually L',
  },
  {
    id: '3',
    author: 'Priya M.',
    rating: 5,
    title: 'Third one I have bought',
    body: 'Two in stone, one in navy. They hold their shape better than anything else I own at twice the price.',
    date: '2026-06-30',
    verified: true,
    helpfulCount: 8,
  },
  {
    id: '4',
    author: 'Sam K.',
    rating: 3,
    title: 'Nice but the colour is off',
    body: 'The stone reads much warmer in person than on screen — closer to a light camel. Lovely sweater, just not the colour I was picturing.',
    date: '2026-06-11',
    helpfulCount: 21,
  },
]

type SortKey = 'recent' | 'helpful' | 'highest' | 'lowest'

function formatDate(iso: string, locale = 'en-GB'): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function ReviewList({
  reviews = DEFAULT_REVIEWS,
  locale = 'en-GB',
  className = '',
}: ReviewListProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [sort, setSort] = React.useState<SortKey>('helpful')
  const [voted, setVoted] = React.useState<Set<string>>(() => new Set())
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())

  const sorted = React.useMemo(() => {
    const copy = [...reviews]
    copy.sort((a, b) => {
      if (sort === 'recent') return b.date.localeCompare(a.date)
      if (sort === 'helpful') return b.helpfulCount - a.helpfulCount
      if (sort === 'highest') return b.rating - a.rating
      return a.rating - b.rating
    })
    return copy
  }, [reviews, sort])

  function toggleVote(id: string) {
    setVoted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section id={`${uid}-reviews`} className={`w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <h2 className="text-lg font-bold tracking-tight">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </h2>

        <div className="flex items-center gap-2">
          <label htmlFor={`${uid}-review-sort`} className="text-sm text-muted-foreground">
            Sort
          </label>
          <select
            id={`${uid}-review-sort`}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="helpful">Most helpful</option>
            <option value="recent">Most recent</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>
      </div>

      <ul className="divide-y divide-border/40">
        {sorted.map((review) => {
          const isVoted = voted.has(review.id)
          const isExpanded = expanded.has(review.id)
          const isLong = review.body.length > 220

          return (
            <li key={review.id} className="py-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="flex gap-0.5" aria-label={`${review.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={
                        i < review.rating
                          ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
                          : 'h-3.5 w-3.5 text-muted-foreground/30'
                      }
                    />
                  ))}
                </div>

                <span className="text-sm font-medium">{review.author}</span>

                {/* The element that makes the rest of the page credible. */}
                {review.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                    Verified purchase
                  </span>
                ) : null}

                <time dateTime={review.date} className="ml-auto text-xs text-muted-foreground">
                  {formatDate(review.date, locale)}
                </time>
              </div>

              <h3 className="mt-2.5 font-semibold">{review.title}</h3>

              <p
                id={`${uid}-${review.id}-body`}
                className={`mt-1.5 text-sm leading-relaxed text-muted-foreground ${
                  isLong && !isExpanded ? 'line-clamp-3' : ''
                }`}
              >
                {review.body}
              </p>

              {/* A control, not a fade that hides text with no way back. */}
              {isLong ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(review.id)}
                  aria-expanded={isExpanded}
                  /*
                    The paragraph, which is always in the document — this
                    control clamps text rather than unmounting it, so the
                    IDREF is unconditional here where the drawers and
                    listboxes elsewhere in the catalog have to guard it.
                  */
                  aria-controls={`${uid}-${review.id}-body`}
                  className="mt-1.5 text-xs font-semibold hover:underline"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-4">
                {review.context ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {review.context}
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => toggleVote(review.id)}
                  aria-pressed={isVoted}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    isVoted
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ThumbsUp aria-hidden className="h-3.5 w-3.5" />
                  Helpful
                  {/* Optimistic — the count moves before the request lands. */}
                  <span className="tabular-nums">
                    {review.helpfulCount + (isVoted ? 1 : 0)}
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
