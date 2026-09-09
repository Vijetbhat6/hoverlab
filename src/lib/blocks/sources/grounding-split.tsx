/**
 * <GroundingSplit> — How an answer is tied to its sources, and what the system does when it cannot find any.
 *
 * The interesting half of a retrieval system is not what it does when it
 * finds the answer. It is what it does when it does not, and the layout
 * problem is that a features list about grounding naturally describes only
 * the success path.
 *
 * So the third point is the failure path — no passage above the relevance
 * floor produces "I could not find this" rather than a fluent guess — and
 * it is the point the section is built around. The obvious wrong answer is
 * to list citation features and stop, which describes a system that
 * hallucinates confidently and cites nothing.
 *
 * The first point is a placement decision stated as a principle: citations
 * belong on the sentence, not in a source list at the bottom. A list of
 * seven sources under a paragraph of six claims cannot be checked by
 * anyone, which makes it decoration.
 *
 * The second point — quoted rather than paraphrased — is what makes the
 * first useful. A citation you cannot read the source text of only tells
 * you that a document was consulted, not that it says what the answer
 * claims.
 *
 * Accessibility: the tick is an inline `<svg>`, `aria-hidden`, filled with
 * `currentColor` so it inherits the text colour and is skipped rather than
 * announced four times; the heading names the section through
 * `aria-labelledby`; the points are a real `<ul>`.
 *
 * The panel is drawn rather than an `<img>` — no hosting, no layout shift,
 * correct in both themes. Pass `media` to show a real cited answer, which
 * is the strongest possible illustration of this particular section.
 */

import * as React from 'react'

export interface GroundingSplitPoint {
  label: string
  detail?: string
}

export interface GroundingSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: GroundingSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: GroundingSplitPoint[] = [
  { label: "Citations on the sentence", detail: "Not a source list at the bottom. The claim and its evidence are next to each other or the citation is decoration." },
  { label: "Quoted, not paraphrased", detail: "The retrieved passage is shown as written, so you can see whether it says what the answer claims." },
  { label: "It says when it does not know", detail: "No passage above the relevance floor produces \"I could not find this\", not a fluent guess." },
  { label: "Stale sources are flagged", detail: "Age travels with the passage. A confident answer from a two-year-old document is the failure nobody catches." },
]

export function GroundingSplit({
  eyebrow = "Grounding",
  heading = "Every claim points at something",
  intro = "The interesting half of a retrieval system is not what it does when it finds the answer. It is what it does when it does not.",
  points = POINTS,
  media,
  className,
}: GroundingSplitProps) {
  return (
    <section
      aria-labelledby="grounding-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="grounding-split-heading"
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
