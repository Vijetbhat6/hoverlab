'use client'

/**
 * <AiActionMenu> — The actions offered on a selection, each saying whether it rewrites in place or opens a draft beside it.
 *
 * The layout problem is not which actions to offer. It is that two of them
 * overwrite the reader's work and two do not, and nothing in a conventional
 * action menu distinguishes them until after the click.
 *
 * The obvious wrong answer is an icon list. An AI action that silently
 * replaces the paragraph someone spent ten minutes on is the fastest route
 * to the feature being switched off permanently, and an icon cannot carry
 * "this replaces your text".
 *
 * So every row states where the result lands, and the badge reduces that to
 * one word: in place, draft, read only. The two destructive rows also
 * promise that one undo restores the original exactly — which is a real
 * implementation constraint this component is documenting, not decoration.
 * If your undo cannot do that, do not offer the in-place actions.
 *
 * The ordering runs from most invasive to least, so the reader meets the
 * consequential ones while they are still reading carefully.
 *
 * Rows are `<button>`s with `aria-pressed` rather than menu items with click
 * handlers on divs: they are operable, so they must be keyboard-reachable
 * and announce their state. In a real editor this panel should also be a
 * `role="menu"` with roving focus if it opens on selection — the scaffold's
 * list semantics are correct for a persistent panel, not for a popup.
 *
 * The demo selects the first row, which is the most common action and also
 * the most invasive, which is the pairing this block exists to make visible.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface AiActionMenuRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface AiActionMenuProps {
  heading?: string
  intro?: string
  rows?: AiActionMenuRow[]
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

const ROWS: AiActionMenuRow[] = [
  { id: "row-1", label: "Rewrite for clarity", detail: "Replaces the selection. One undo puts it back exactly.", tone: "warning", status: "in place" },
  { id: "row-2", label: "Shorten to one sentence", detail: "Replaces the selection. Undo restores the original wording.", tone: "warning", status: "in place" },
  { id: "row-3", label: "Suggest three alternatives", detail: "Opens beside the text. Nothing changes until one is picked.", tone: "positive", status: "draft" },
  { id: "row-4", label: "Explain this passage", detail: "Read-only. Never touches the document.", tone: "positive", status: "read only" },
]

export function AiActionMenu({
  heading = "Do something with the selection",
  intro = "Every row says where the result lands. An AI action that silently replaces the paragraph someone spent ten minutes on is the fastest way to have the feature turned off.",
  rows = ROWS,
  className,
}: AiActionMenuProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="ai-action-menu-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="ai-action-menu-heading"
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
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
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
