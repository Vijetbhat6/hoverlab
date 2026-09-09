'use client'

/**
 * <NotificationChannelList> — Which channel carries which event, so the loud ones can be moved rather than muted entirely.
 *
 * The all-or-nothing toggle is why people mute products, and the layout
 * problem is that routing has more than two states while a switch has two.
 * The obvious wrong answer is a longer column of switches — same failure,
 * more rows.
 *
 * Routing by event lets the two things that matter stay loud while
 * everything else goes somewhere quiet, and the badge names the destination
 * rather than an on/off state. That is what makes the panel skimmable: four
 * rows, four destinations, one glance.
 *
 * The incident row says it ignores quiet hours. That is the setting most
 * likely to be wrong in either direction, and it is worth stating on the row
 * rather than burying it in a preferences page — someone who does not want
 * to be woken has to be able to see that they will be.
 *
 * The announcements row mentions that the unsubscribe link is not buried.
 * Small, and the kind of thing a notification settings panel should say out
 * loud, because it is the promise that makes the rest credible.
 *
 * Rows are buttons with `aria-pressed` — a real implementation opens the
 * channel picker behind one — and `status` is separate from `tone` so
 * "push" and "digest" are readable without relying on colour. The demo
 * selects the first row, the loudest one, since it is the setting most
 * people come here to change.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface NotificationChannelListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface NotificationChannelListProps {
  heading?: string
  intro?: string
  rows?: NotificationChannelListRow[]
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

const ROWS: NotificationChannelListRow[] = [
  { id: "row-1", label: "Production incidents", detail: "Push and email, immediately, ignoring quiet hours.", tone: "critical", status: "push" },
  { id: "row-2", label: "Someone mentions you", detail: "Push during working hours, batched into the digest outside them.", tone: "warning", status: "push" },
  { id: "row-3", label: "Build results", detail: "Digest only. Failures are already in the incident row above.", tone: "neutral", status: "digest" },
  { id: "row-4", label: "Product announcements", detail: "Email, monthly, and the unsubscribe link is not buried.", tone: "neutral", status: "email" },
]

export function NotificationChannelList({
  heading = "Where each thing goes",
  intro = "The all-or-nothing toggle is why people mute products. Routing by event lets the two that matter stay loud while the rest go somewhere quiet.",
  rows = ROWS,
  className,
}: NotificationChannelListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="notification-channel-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="notification-channel-list-heading"
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
