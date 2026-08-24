/**
 * <TestimonialRatings> — the aggregate, not the anecdote.
 *
 * <TestimonialGrid> and <TestimonialSpotlight> both argue from individuals:
 * here is a person, here is what they said. That argument has a known hole,
 * and a sceptical buyer finds it immediately — six quotes on a vendor's own
 * page are six quotes the vendor chose. Nothing about a wall of praise tells
 * you what the unhappy customers said, or how many of them there are.
 *
 * This block makes the opposite kind of claim. A mean score over a stated
 * number of reviews, with the distribution left visible, is a statement that
 * survives the objection: the one-star row is right there, and showing it is
 * what makes the four- and five-star rows worth believing. A distribution
 * with the bottom bars quietly omitted is worse than no distribution at all,
 * so `breakdown` takes all five and renders all five, including zeroes.
 *
 * The sources rail carries the same weight. "4.8 out of 5" means nothing
 * without who counted, and a score attributed to a third party the reader
 * can go and check is the only version of this section that is evidence
 * rather than decoration.
 *
 * Stars are decorative here and marked `aria-hidden`; the score is announced
 * from the text beside them, because a screen reader counting eight path
 * elements communicates nothing. The bars are a <dl>, so each rating band is
 * programmatically tied to its count instead of being two adjacent numbers
 * that happen to sit on one line.
 */

import * as React from 'react'
import { Star } from 'lucide-react'

export interface RatingSource {
  name: string
  score: string
  href?: string
}

export interface RatingBand {
  /** Stars, 5 down to 1. */
  stars: number
  count: number
}

export interface TestimonialRatingsProps {
  score?: string
  outOf?: number
  totalReviews?: string
  headline?: string
  /** All five bands, including the empty ones. See the note above. */
  breakdown?: RatingBand[]
  sources?: RatingSource[]
  className?: string
}

const DEFAULT_BREAKDOWN: RatingBand[] = [
  { stars: 5, count: 1783 },
  { stars: 4, count: 402 },
  { stars: 3, count: 71 },
  { stars: 2, count: 24 },
  { stars: 1, count: 18 },
]

const DEFAULT_SOURCES: RatingSource[] = [
  { name: 'G2', score: '4.8' },
  { name: 'Capterra', score: '4.7' },
  { name: 'Product Hunt', score: '4.9' },
]

export function TestimonialRatings({
  score = '4.8',
  outOf = 5,
  totalReviews = '2,298',
  headline = 'Rated by the people paying for it',
  breakdown = DEFAULT_BREAKDOWN,
  sources = DEFAULT_SOURCES,
  className = '',
}: TestimonialRatingsProps) {
  const total = breakdown.reduce((sum, band) => sum + band.count, 0)
  const filled = Math.round(Number(score))

  return (
    <section
      aria-labelledby="ratings-heading"
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="grid gap-10 rounded-2xl border border-border/60 bg-card/80 p-8 sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-16">
        <div className="lg:min-w-56">
          <h2
            id="ratings-heading"
            className="text-sm font-medium uppercase tracking-wider text-muted-foreground"
          >
            {headline}
          </h2>

          <p className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-foreground">{score}</span>
            <span className="text-lg text-muted-foreground">out of {outOf}</span>
          </p>

          <p className="mt-3 flex items-center gap-1">
            {Array.from({ length: outOf }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={
                  i < filled
                    ? 'h-5 w-5 fill-primary text-primary'
                    : 'h-5 w-5 fill-muted text-muted'
                }
              />
            ))}
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            from {totalReviews} verified reviews
          </p>
        </div>

        <dl className="grid content-center gap-2.5 border-border/60 max-lg:border-t max-lg:pt-8 lg:border-l lg:pl-16">
          {breakdown.map((band) => {
            const share = total === 0 ? 0 : (band.count / total) * 100
            return (
              <div key={band.stars} className="flex items-center gap-4">
                <dt className="w-16 shrink-0 text-sm text-muted-foreground">
                  {band.stars} star{band.stars === 1 ? '' : 's'}
                </dt>
                <dd className="flex flex-1 items-center gap-4">
                  <span
                    aria-hidden
                    className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {band.count.toLocaleString()}
                  </span>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {sources.map((source) => {
          const label = (
            <>
              <Star aria-hidden className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{source.score}</span>
              <span className="text-muted-foreground">on {source.name}</span>
            </>
          )
          return (
            <li key={source.name}>
              {source.href ? (
                <a
                  href={source.href}
                  className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm transition-colors hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {label}
                </a>
              ) : (
                <span className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm">
                  {label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
