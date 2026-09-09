/**
 * <IntegrationDepthSplit> — An integrations section that says how deep each one goes, instead of a wall of logos that all imply the same thing.
 *
 * A grid of thirty logos implies thirty equivalent integrations. Usually
 * four are deep, six are one-way, and the rest are a Zapier entry. The
 * layout problem is that the logo grid is the industry-standard answer and
 * it is structurally incapable of saying which is which.
 *
 * So this replaces the wall with four tiers, each defined by what actually
 * moves. The obvious wrong answer is to keep the grid and add a footnote,
 * which nobody reads and which still lets the grid make the claim.
 *
 * The third tier is the one that earns the section's credibility:
 * notifications only. Posting events into a channel is genuinely useful and
 * is not a sync, so it is not listed as one — and a reader who finds one
 * integration honestly downgraded believes the tier above it.
 *
 * The fourth tier says the API is the same one the deep integrations are
 * built on. That converts "everything else" from an excuse into a
 * capability, and it is only worth saying if it is true.
 *
 * Accessibility: the tick is an inline `<svg>` with `aria-hidden` and
 * `fill="currentColor"` — decoration, inheriting the text colour, skipped by
 * a screen reader rather than announced before every point. The section's
 * accessible name comes from the heading via `aria-labelledby`, and the
 * points are a real `<ul>` so the count is announced up front.
 *
 * The drawn panel replaces a screenshot for the usual reasons: no asset to
 * host, no layout shift, and it is correct in both themes. Pass `media` to
 * put the actual integrations directory there.
 */

import * as React from 'react'

export interface IntegrationDepthSplitPoint {
  label: string
  detail?: string
}

export interface IntegrationDepthSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: IntegrationDepthSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: IntegrationDepthSplitPoint[] = [
  { label: "Two-way sync", detail: "Changes flow both directions and conflicts are resolved, not last-write-wins." },
  { label: "One-way import", detail: "We read from them on a schedule. Nothing is written back, which is often what you want." },
  { label: "Notifications only", detail: "We post events into the channel. Honest, useful, and not a sync — so it is not listed as one." },
  { label: "Via the API", detail: "Everything else. Documented, versioned, and the same API the first row is built on." },
]

export function IntegrationDepthSplit({
  eyebrow = "Integrations",
  heading = "Not all of these mean the same thing",
  intro = "A grid of thirty logos implies thirty equivalent integrations. Usually four are deep, six are one-way, and the rest are a Zapier entry. Saying which is which costs one sentence each.",
  points = POINTS,
  media,
  className,
}: IntegrationDepthSplitProps) {
  return (
    <section
      aria-labelledby="integration-depth-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="integration-depth-split-heading"
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
