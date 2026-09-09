/**
 * <DataMigrationSplit> — What a migration actually moves and what it cannot, stated before the switch rather than discovered after it.
 *
 * Every migration page promises that everything comes across. Something
 * never does, and finding out which thing after the cutover is how a switch
 * becomes a rollback. The layout problem is that the honest version of this
 * section has a negative in it, and negatives are what marketing pages
 * remove.
 *
 * So the third point is what does not come across, and it is specific:
 * custom automations, because the triggers have no equivalent. The obvious
 * wrong answer is to omit it and handle the objection in the sales call,
 * which works right up until the customer has already switched.
 *
 * The fourth point is the one that makes the third survivable. A trial
 * migration into a sandbox lets the gap be discovered before the cutover
 * rather than after, and it is free — a paid trial migration would defeat
 * the purpose of offering one.
 *
 * The permissions point says the role mapping is shown for approval before
 * anything is written. That is the step most migrations skip, and it is
 * where a "successful" migration quietly gives twelve people admin.
 *
 * Accessibility: the tick `<svg>` is `aria-hidden` with `currentColor`, so
 * it is decoration that inherits the text colour rather than four
 * announcements of nothing; the heading provides the section's accessible
 * name through `aria-labelledby`; the points are a genuine `<ul>`.
 *
 * The panel is drawn rather than an `<img>` — no asset, no layout shift, and
 * it themes with the page instead of being somebody's light-mode
 * screenshot sitting in a dark one.
 */

import * as React from 'react'

export interface DataMigrationSplitPoint {
  label: string
  detail?: string
}

export interface DataMigrationSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: DataMigrationSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: DataMigrationSplitPoint[] = [
  { label: "Records, history and attachments", detail: "Everything with a stable id, including the timestamps, so reports still line up." },
  { label: "Users and their permissions", detail: "Roles are mapped, and the mapping is shown for approval before anything is written." },
  { label: "What does not come across", detail: "Custom automations. The triggers have no equivalent here and a silent half-migration is worse." },
  { label: "Run it twice", detail: "A trial into a sandbox first, then the real one. The trial is free and does not count against anything." },
]

export function DataMigrationSplit({
  eyebrow = "Switching",
  heading = "We move it, and we say what we cannot",
  intro = "Every migration page promises everything comes across. Something never does, and finding out which thing after the cutover is how a switch becomes a rollback.",
  points = POINTS,
  media,
  className,
}: DataMigrationSplitProps) {
  return (
    <section
      aria-labelledby="data-migration-split-heading"
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="data-migration-split-heading"
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
