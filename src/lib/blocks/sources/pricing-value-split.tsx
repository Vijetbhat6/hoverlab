/**
 * <PricingValueSplit> — The case for the price, made beside the price — what the alternative costs, in the units a buyer already measures.
 *
 * A price defends itself against the alternative, not against a
 * competitor's price. The layout problem is that the alternative is
 * invisible — it is the week somebody would otherwise spend — so the
 * section has to make it concrete before the comparison means anything.
 *
 * The obvious wrong answer is a competitor comparison table. It moves the
 * argument onto price alone, which is the axis where somebody is always
 * cheaper, and it invites the reader to go and check the competitor.
 *
 * So the points are denominated in engineering time, and the third one
 * concedes: below about four sections, build it yourself. That concession
 * is doing the work of the whole block — a value argument with no boundary
 * is read as a sales page, and naming the point where the case fails is what
 * makes the other three credible.
 *
 * The last point is a different kind of claim and belongs at the end: what
 * you are not buying. "The source lands in your repository and stops being
 * ours" is the objection under most of these purchases, and it is the one
 * that has nothing to do with price.
 *
 * Accessibility: the tick is an inline <svg> with `aria-hidden` and
 * `fill="currentColor"`, so it inherits the text colour and is skipped
 * entirely by a screen reader — a decorative tick announced before every
 * point is four repetitions of nothing. The heading carries the section's
 * accessible name through `aria-labelledby`, and the points are a real <ul>
 * so the count is announced up front.
 *
 * The right-hand panel is drawn rather than an <img>: no asset to host, no
 * layout shift while it loads, and it themes with the page. A screenshot of
 * somebody's light-mode dashboard sitting in a dark page is the usual
 * version of this and it is always wrong in one theme. Pass `media` to
 * replace it.
 */

import * as React from 'react'

export interface PricingValueSplitPoint {
  label: string
  detail?: string
}

export interface PricingValueSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: PricingValueSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: PricingValueSplitPoint[] = [
  { label: "One section, hand-built", detail: "Half a day for the markup, another for the responsive and keyboard passes." },
  { label: "The same section here", detail: "One command, and the accessibility decisions are already made and explained." },
  { label: "Where it stops being close", detail: "Around the fourth section. Before that, honestly, build it yourself." },
  { label: "What you are not buying", detail: "A dependency. The source lands in your repository and stops being ours." },
]

export function PricingValueSplit({
  eyebrow = "Why this price",
  heading = "Cheaper than the week you would spend instead",
  intro = "A price defends itself against the alternative, not against a competitor's price. The alternative here is engineering time, so that is the unit.",
  points = POINTS,
  media,
  className,
}: PricingValueSplitProps) {
  return (
    <section
      aria-labelledby="pricing-value-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="pricing-value-split-heading"
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">{intro}</p>

          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point.label} className="flex gap-3">
                {/*
                  currentColor, not a token in a raw colour function. These
                  are complete oklch() values, so hsl(var(--primary)) is not
                  a colour and the declaration is dropped silently.
                */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  fill="currentColor"
                >
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                </svg>
                <span>
                  <span className="block text-sm font-medium text-foreground">{point.label}</span>
                  {point.detail ? (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {point.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          The drawn panel rather than an <img>. No asset to host, no layout
          shift while it loads, and it themes with the rest of the page —
          which a screenshot of somebody's light-mode dashboard does not.
        */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {media ?? (
            <div aria-hidden="true" className="space-y-3">
              <div className="h-3 w-1/3 rounded bg-primary/30" />
              <div className="h-24 rounded-lg bg-muted" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-14 rounded-lg bg-muted" />
                <div className="h-14 rounded-lg bg-muted" />
                <div className="h-14 rounded-lg bg-muted" />
              </div>
              <div className="h-3 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
