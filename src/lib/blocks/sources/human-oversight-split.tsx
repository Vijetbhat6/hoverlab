/**
 * <HumanOversightSplit> — Where a person sits in an automated run, written as four guarantees rather than as a promise that a human is involved.
 *
 * "A human is in the loop" is a claim with no shape, and the layout problem
 * is turning it into something falsifiable. The obvious wrong answer is a
 * paragraph about responsible AI, which commits to nothing and is
 * indistinguishable from every other such paragraph.
 *
 * Four points, each naming a place where the system will not proceed
 * without a person. Written as guarantees rather than as intentions,
 * because a guarantee can be checked against the product and an intention
 * cannot.
 *
 * The second point — pausing on low confidence — is the one that separates
 * real oversight from theatre. A system that always produces an answer has
 * no low-confidence branch, and the human in its loop is only ever
 * reviewing outputs that were going to be produced anyway.
 *
 * The fourth point is deliberately mundane. A stop button that is always on
 * screen is worth more than the three principles above it, because it is
 * the one that works when the other three have failed, and "always on
 * screen" is the part that is usually not true.
 *
 * Accessibility: the tick `<svg>` carries `aria-hidden` and
 * `fill="currentColor"`, so it inherits the text colour and is not
 * announced; the section is named by its heading through `aria-labelledby`;
 * the points are a genuine `<ul>` so a screen reader announces four items
 * before reading them, which is what makes a list of guarantees scannable
 * by ear.
 *
 * The panel is drawn rather than an image, so it themes correctly and adds
 * no asset. Pass `media` to show the actual approval card.
 */

import * as React from 'react'

export interface HumanOversightSplitPoint {
  label: string
  detail?: string
}

export interface HumanOversightSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: HumanOversightSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: HumanOversightSplitPoint[] = [
  { label: "Before anything leaves", detail: "External messages and payments stop and wait. The full payload is shown, not a summary of it." },
  { label: "On low confidence", detail: "The run pauses rather than picking the best of four bad options and presenting it as an answer." },
  { label: "After the fact, in the log", detail: "Every unattended action is recorded with its inputs, and the log is exportable." },
  { label: "The stop button", detail: "One press halts a run mid-step and rolls back anything reversible. It is always on screen." },
]

export function HumanOversightSplit({
  eyebrow = "Oversight",
  heading = "Where the person actually is",
  intro = "\"A human is in the loop\" is a claim with no shape. These are the four points where one really is, and each is a thing the system will not do without them.",
  points = POINTS,
  media,
  className,
}: HumanOversightSplitProps) {
  return (
    <section
      aria-labelledby="human-oversight-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="human-oversight-split-heading"
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
