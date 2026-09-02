/**
 * <ChangelogTimeline> — a dated release list on a vertical rail.
 *
 * The rail is a `border-s` on the list with dots absolutely positioned over
 * it, rather than a separate spine element. That way the line ends exactly
 * where the last entry does instead of running past it, and it stays
 * aligned when an entry's height changes.
 *
 * Dates use <time datetime> so the machine-readable value is the ISO
 * string, whatever human format the label is written in.
 */

import * as React from 'react'

export type ReleaseKind = 'added' | 'changed' | 'fixed'

export interface ReleaseEntry {
  /** ISO date — `2026-07-14`. */
  date: string
  version: string
  title: string
  items: { kind: ReleaseKind; text: string }[]
}

export interface ChangelogTimelineProps {
  entries?: ReleaseEntry[]
  heading?: string
  subheading?: string
  className?: string
}

const KIND_STYLE: Record<ReleaseKind, string> = {
  added: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  changed: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  fixed: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

const DEFAULT_ENTRIES: ReleaseEntry[] = [
  {
    date: '2026-07-14',
    version: 'v2.4.0',
    title: 'Dashboard blocks',
    items: [
      { kind: 'added', text: 'Twelve dashboard and data-table sections' },
      { kind: 'added', text: 'Keyboard navigation across every table block' },
      { kind: 'changed', text: 'Sidebar collapses below 1024px instead of 768px' },
    ],
  },
  {
    date: '2026-06-02',
    version: 'v2.3.1',
    title: 'Accessibility pass',
    items: [
      { kind: 'fixed', text: 'Focus ring clipped inside overflow containers' },
      { kind: 'fixed', text: 'Marquee ignored prefers-reduced-motion' },
    ],
  },
  {
    date: '2026-05-19',
    version: 'v2.3.0',
    title: 'Theming',
    items: [
      { kind: 'added', text: 'Token generator with contrast validation' },
      { kind: 'changed', text: 'All blocks now read semantic colour tokens' },
    ],
  },
]

export function ChangelogTimeline({
  entries = DEFAULT_ENTRIES,
  heading = 'What shipped recently',
  subheading = 'Every release, in plain language.',
  className = '',
}: ChangelogTimelineProps) {
  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <ol className="relative ms-3 space-y-10 border-s border-border/60 ps-8">
        {entries.map((entry) => (
          <li key={entry.version} className="relative">
            <span
              aria-hidden
              className="absolute -left-[2.3rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary ring-4 ring-primary/15"
            />

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg font-bold tracking-tight">{entry.title}</h3>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                {entry.version}
              </span>
              <time
                dateTime={entry.date}
                className="text-xs text-muted-foreground"
              >
                {formatDate(entry.date)}
              </time>
            </div>

            <ul className="mt-4 space-y-2">
              {entry.items.map((item) => (
                <li key={item.text} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${KIND_STYLE[item.kind]}`}
                  >
                    {item.kind}
                  </span>
                  <span className="text-muted-foreground">{item.text}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

function formatDate(iso: string): string {
  // Parsed as UTC and formatted as UTC — a bare `new Date('2026-07-14')` is
  // midnight UTC, which renders as the previous day for anyone west of it.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
