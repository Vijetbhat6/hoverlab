/**
 * <ReviewDistributionBand> — The rating summary with the numbers that make an average trustworthy — the count, the spread and the verified share.
 *
 * An average with nothing beside it is unreadable. 4.6 from nine reviews
 * and 4.6 from nine hundred are different facts, and the layout problem is
 * that the star row — the obvious wrong answer — shows only the first
 * number and implies the second.
 *
 * So the average is one tile of four, and the other three are what make it
 * mean something: the count, the verified share, and the proportion of low
 * ratings.
 *
 * That last tile is the one that earns trust, and it is the one no
 * storefront ships. Publishing "6% one and two star" and saying it sorts to
 * the top on filter is a stronger signal of honesty than the 4.6 is of
 * quality — a product with no bad reviews is read as a product with hidden
 * reviews.
 *
 * The verified figure is stated as a percentage rather than as a badge,
 * because 91% verified with the remainder labelled is a fact, while a
 * "verified" badge on some reviews and not others is an unexplained
 * inconsistency the reader has to interpret.
 *
 * Accessibility: the tiles are a `<dl>` with `<dt>`/`<dd>` pairs, so a
 * screen reader announces "Average, 4.6" rather than four unrelated numbers
 * in a row — which on a band of bare figures is the difference between a
 * section and noise. The detail sits in a `<p>` inside the tile rather than
 * a second `<dd>`, because two values under one term are announced as
 * alternatives.
 *
 * `tabular-nums` keeps the figures aligned on their digits, and the grid is
 * `gap-px` over a `bg-border` parent so the seams are true hairlines with no
 * doubled edges. Server component — no state.
 */

export interface ReviewDistributionBandMetric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface ReviewDistributionBandProps {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: ReviewDistributionBandMetric[]
  className?: string
}

const METRICS: ReviewDistributionBandMetric[] = [
  { label: "Average", value: "4.6", detail: "Across every review, including the ones left after a return." },
  { label: "Reviews", value: "1,284", detail: "Unfiltered. Nothing is hidden for being low." },
  { label: "Verified purchase", value: "91%", detail: "Matched to an order. The other 9% are labelled as such." },
  { label: "One and two star", value: "6%", detail: "Shown, and sorted to the top when you filter by lowest." },
]

export function ReviewDistributionBand({
  eyebrow = "Reviews",
  heading = "4.6, and the numbers behind it",
  intro = "An average with nothing beside it is unreadable: 4.6 from nine reviews and 4.6 from nine hundred are different facts. These are what make the first number mean something.",
  metrics = METRICS,
  className,
}: ReviewDistributionBandProps) {
  return (
    <section
      aria-labelledby="review-distribution-band-heading"
      className={`w-full bg-background px-6 py-16 sm:py-20 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id="review-distribution-band-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">{intro}</p>

        {/*
          A <dl>, not a grid of divs. Each tile is a term and its value, and
          a screen reader reading "Uptime, 99.98%" is the whole point of the
          section — a div soup reads as five unrelated numbers.
        */}
        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-card p-6">
              <dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {metric.value}
              </dd>
              {metric.detail ? (
                <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
