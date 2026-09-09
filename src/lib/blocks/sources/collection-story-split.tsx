/**
 * <CollectionStorySplit> — The editorial header above a collection grid, carrying the four facts that decide a considered purchase.
 *
 * A grid of forty products under a one-line title is a search result. For
 * anything considered — furniture, tools, clothing meant to last — the
 * reason the collection exists is what does the selling, and the layout
 * problem is where that reasoning goes.
 *
 * The obvious wrong answer is a linked story page. It is the standard
 * pattern and almost nobody opens it, which means the argument for the
 * price is one click away from every person deciding on the price.
 *
 * So four points sit above the grid, and each is a checkable fact rather
 * than a mood: a named city and a family-run factory, repairs charged at
 * cost, deadstock as the reason sizes vanish, and one price all year.
 *
 * That third point is the one that converts a limitation into a reason.
 * "Sizes run out and do not come back" is bad news stated plainly, and it
 * is also the honest explanation for scarcity that a countdown timer fakes.
 *
 * The fourth is a commitment with teeth — no seasonal markdown means
 * nobody who bought in March is punished in July — and it should only be on
 * the page if the merchandising calendar actually honours it.
 *
 * Accessibility: the tick `<svg>` is `aria-hidden` with `currentColor`, so
 * it is decoration rather than four announcements; the heading gives the
 * section its accessible name via `aria-labelledby`; the points are a real
 * `<ul>`. The drawn panel is a placeholder — this is the one block in the
 * wave where `media` should almost certainly be a real photograph, and it
 * is a prop rather than a hard-coded `<img>` for exactly that reason.
 */

import * as React from 'react'

export interface CollectionStorySplitPoint {
  label: string
  detail?: string
}

export interface CollectionStorySplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: CollectionStorySplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: CollectionStorySplitPoint[] = [
  { label: "One factory, named", detail: "Porto, family-run, thirty years. The address is on the about page rather than implied by a photograph." },
  { label: "Repairs, not warranties", detail: "Send it back at any age. Repair is charged at cost and typically beats replacing it." },
  { label: "Deadstock and offcuts", detail: "Which is why sizes run out and do not come back. The stock list says which." },
  { label: "Priced once", detail: "No seasonal markdown, so nobody who bought in March is punished for it in July." },
]

export function CollectionStorySplit({
  eyebrow = "The collection",
  heading = "Made to be repaired, not replaced",
  intro = "A grid of forty products with a one-line title is a search result. For anything considered, the reason the collection exists is what does the selling, and it belongs above the grid rather than on a linked story page nobody opens.",
  points = POINTS,
  media,
  className,
}: CollectionStorySplitProps) {
  return (
    <section
      aria-labelledby="collection-story-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="collection-story-split-heading"
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
