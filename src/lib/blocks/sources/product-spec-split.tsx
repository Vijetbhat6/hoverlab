/**
 * <ProductSpecSplit> — The specification table beside the product image, with the two or three figures that decide the purchase pulled out of it.
 *
 * A forty-row specification table is a good place to hide the three figures
 * someone is comparing. The layout problem is that the full table has to
 * stay — the person who wants row thirty-one is real — while the three that
 * decide the purchase are pulled in front of it.
 *
 * The obvious wrong answer is to shorten the table. That serves neither
 * reader: the comparer still has to scan, and the specialist goes to a
 * competitor's page to find the port layout.
 *
 * So this block is the pulled-out set and it links to the full table rather
 * than replacing it. Four points, because a fifth stops being a shortlist.
 *
 * Each detail names the measurement condition, which is where specification
 * sheets are usually dishonest. "18 hours" is meaningless; "18 hours of
 * mixed use, measured at 150 nits rather than at minimum brightness" is a
 * figure a reader can compare against another one. The weight is quoted with
 * the battery in, for the same reason — it is the only way anyone carries
 * it.
 *
 * The repairability row is there because it is increasingly the deciding
 * figure and is almost never in the pulled-out set. If it does not apply,
 * cut the row rather than replacing it with a marketing line.
 *
 * Accessibility: the tick <svg> is `aria-hidden` with `fill="currentColor"`,
 * so it is decoration that inherits the text colour and is not announced
 * four times; the section takes its accessible name from the heading through
 * `aria-labelledby`; and the points are a genuine <ul> so their number is
 * announced before they are read.
 *
 * The panel on the right is drawn rather than an image — nothing to host,
 * no layout shift, and it follows the theme. Pass `media` to put a real
 * product photograph there, which is the one place in this block where a
 * photograph is the right answer.
 */

import * as React from 'react'

export interface ProductSpecSplitPoint {
  label: string
  detail?: string
}

export interface ProductSpecSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: ProductSpecSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: ProductSpecSplitPoint[] = [
  { label: "Weight", detail: "1.24 kg with the battery, which is the only way anyone carries it." },
  { label: "Battery", detail: "18 hours of mixed use, measured at 150 nits rather than at minimum brightness." },
  { label: "Ports", detail: "Two USB-C, one HDMI, one headphone. No dongle in the box and none needed." },
  { label: "Repairability", detail: "Battery and SSD are user-replaceable. Parts and the manual are public." },
]

export function ProductSpecSplit({
  eyebrow = "Specification",
  heading = "The numbers that decide it",
  intro = "A forty-row spec table is a place to hide the three figures someone is actually comparing. These are pulled out; the full table is still below for the person who wants it.",
  points = POINTS,
  media,
  className,
}: ProductSpecSplitProps) {
  return (
    <section
      aria-labelledby="product-spec-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="product-spec-split-heading"
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
