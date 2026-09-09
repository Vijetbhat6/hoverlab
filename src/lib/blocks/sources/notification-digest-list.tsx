'use client'

/**
 * <NotificationDigestList> — A day's notifications collapsed into one digest, grouped by what they are rather than when they arrived.
 *
 * The layout problem is that a digest has two competing orders: the order
 * things happened, and the order they matter. The obvious wrong answer is
 * chronological, which is what an inbox already does and is exactly why a
 * digest is being sent instead — fourteen timestamped lines are the thing
 * the reader was trying to escape.
 *
 * So the rows are grouped by kind and the badge carries the count, which
 * means a reader who only looks at the badges still leaves with the day's
 * shape: three deploys, one failure, six comments.
 *
 * The badge says "1 failed", not "critical". That split — `status` for the
 * words, `tone` for the colour — exists because the tone names are
 * developer-facing tokens, and a pill reading "neutral" beside a row is a
 * label with no meaning to anyone reading the page. Colour alone would also
 * be the only carrier of "this one is bad", which fails for the reader who
 * cannot distinguish it; the words are the fallback that makes the colour
 * redundant rather than load-bearing.
 *
 * Each row is a <button> with `aria-pressed`, not a div with an onClick. It
 * is operable, so it has to be focusable, activate on Enter and Space, and
 * announce whether it is the selected one — `aria-pressed` is the attribute
 * that carries the last of those, and a div carries none of the three.
 *
 * The demo selects the first row. Selecting none would render the panel in
 * a state a reader never sees in use, and selecting the failure would teach
 * that the badge colour drives the selection, which it does not.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface NotificationDigestListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface NotificationDigestListProps {
  heading?: string
  intro?: string
  rows?: NotificationDigestListRow[]
  className?: string
}

/*
  Tones as complete utility classes, never assembled from fragments.
  Tailwind scans source text, so `text-${tone}-foreground` produces no
  class at all — the same failure as an undefined token, and just as
  invisible in review.
*/
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-primary/10 text-primary',
  warning: 'bg-accent text-accent-foreground',
  critical: 'bg-destructive/10 text-destructive',
}

const ROWS: NotificationDigestListRow[] = [
  { id: "row-1", label: "3 deploys shipped", detail: "All green. The last one is still inside its rollback window.", tone: "positive", status: "3 deploys" },
  { id: "row-2", label: "1 build failed", detail: "api-gateway on main — the test that failed also failed on the previous run.", tone: "critical", status: "1 failed" },
  { id: "row-3", label: "6 comments on your reviews", detail: "Two are blocking, four are questions you can answer in a line.", tone: "neutral", status: "6 comments" },
  { id: "row-4", label: "Usage at 82% of plan", detail: "On the current run rate you cross the limit on the 26th.", tone: "warning", status: "82% used" },
  { id: "row-5", label: "2 people joined the workspace", detail: "Both are still on the default role and have not opened anything.", tone: "neutral", status: "2 joined" },
]

export function NotificationDigestList({
  heading = "Yesterday, in one message",
  intro = "The alternative is fourteen separate emails, which is how a notification system trains people to filter it into a folder they never open.",
  rows = ROWS,
  className,
}: NotificationDigestListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="notification-digest-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="notification-digest-list-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((row) => {
            const isSelected = row.id === selected
            return (
              <li key={row.id}>
                {/*
                  A button, not a div with onClick. The row is operable, so
                  it has to be reachable by keyboard and announce its
                  selected state — aria-pressed is what carries that.
                */}
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(row.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isSelected ? 'bg-muted/40' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.label}
                    </span>
                    {row.detail ? (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      TONE_CLASS[row.tone ?? 'neutral']
                    }`}
                  >
                    {row.status ?? row.tone ?? 'neutral'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
