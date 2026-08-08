/**
 * <ProductReviewSummary> — average rating and a distribution histogram.
 *
 * The distribution is the point. An average of 4.3 made of forties and
 * fives is a different product from a 4.3 made of ones and fives, and the
 * bar chart is the only way a customer can tell them apart at a glance.
 *
 * Each bar is a real link to the filtered review list — a histogram you
 * cannot click is a picture of information rather than a way in.
 *
 * The bars are `aria-hidden` and the same data is exposed as a plain list
 * to assistive tech: five bars of varying width announce as nothing useful,
 * where "5 stars, 148 reviews, 68 percent" does.
 *
 * Server component.
 */

import * as React from 'react'
import { Star } from 'lucide-react'

export interface ProductReviewSummaryProps {
  /** Count of reviews at each star level, index 0 = 1 star. */
  distribution?: [number, number, number, number, number]
  recommendPercent?: number
  className?: string
}

const DEFAULT_DISTRIBUTION: [number, number, number, number, number] = [3, 5, 14, 48, 148]

export function ProductReviewSummary({
  distribution = DEFAULT_DISTRIBUTION,
  recommendPercent = 94,
  className = '',
}: ProductReviewSummaryProps) {
  const total = distribution.reduce((n, count) => n + count, 0)

  // Weighted mean. Guarded against a product with no reviews yet, where
  // the naive version divides by zero and renders "NaN out of 5".
  const average =
    total === 0
      ? 0
      : distribution.reduce((sum, count, i) => sum + count * (i + 1), 0) / total

  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card/60 p-6 ${className}`}
    >
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        {/* Headline */}
        <div className="text-center sm:text-left">
          <p className="text-4xl font-extrabold tracking-tight">
            {average.toFixed(1)}
            <span className="text-lg font-medium text-muted-foreground">/5</span>
          </p>

          <div className="mt-1.5 flex justify-center gap-0.5 sm:justify-start">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={
                  i < Math.round(average)
                    ? 'h-4 w-4 fill-amber-400 text-amber-400'
                    : 'h-4 w-4 text-muted-foreground/30'
                }
              />
            ))}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {total.toLocaleString('en-GB')} {total === 1 ? 'review' : 'reviews'}
          </p>

          {recommendPercent ? (
            <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {recommendPercent}% would recommend
            </p>
          ) : null}
        </div>

        {/* Histogram — decorative; the real data is the list below. */}
        <div aria-hidden className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars - 1]
            const percent = total === 0 ? 0 : (count / total) * 100

            return (
              <a
                key={stars}
                href={`#reviews?rating=${stars}`}
                className="group flex items-center gap-3 text-sm"
              >
                <span className="w-10 shrink-0 text-muted-foreground">{stars} ★</span>

                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-all group-hover:bg-amber-500"
                    style={{ width: `${percent}%` }}
                  />
                </span>

                <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                  {count}
                </span>
              </a>
            )
          })}
        </div>
      </div>

      {/* The same figures, as something a screen reader can actually use. */}
      <ul className="sr-only">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars - 1]
          const percent = total === 0 ? 0 : Math.round((count / total) * 100)
          return (
            <li key={stars}>
              {stars} stars: {count} reviews, {percent} percent
            </li>
          )
        })}
      </ul>
    </section>
  )
}
