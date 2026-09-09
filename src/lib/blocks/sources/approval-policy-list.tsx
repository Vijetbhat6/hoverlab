'use client'

/**
 * <ApprovalPolicyList> — Which agent actions run unattended and which need a signature, stated as a policy the operator can read before anything happens.
 *
 * Approval prompts are trusted in proportion to how predictable they are.
 * Someone who cannot say in advance which actions will stop and ask learns
 * to approve everything, at which point the prompts are theatre. The layout
 * problem is therefore not the prompt at all — it is stating the policy
 * before anything runs.
 *
 * The obvious wrong answer is a two-column allowed/blocked table. Real
 * policies have three states, and the third is the interesting one: actions
 * that run unattended, actions that ask, and actions that are refused
 * outright with no approval available. A binary table has to file "delete
 * production data" under the same heading as "send an external message",
 * and they are not the same promise.
 *
 * So the list runs from unattended to blocked, and the badge names which of
 * the three it is. Ordering it that way means the reader's eye stops at the
 * point the policy tightens, which is the boundary they came to find.
 *
 * The money row's detail carries the part most policies leave out — the
 * approval expires rather than waiting indefinitely. An approval that sits
 * open for a day is a signature on something the signer no longer
 * remembers.
 *
 * Rows are buttons with `aria-pressed`: a real implementation opens the rule
 * behind a row, so it is operable. `status` is separate from `tone` so
 * "asks" and "blocked" are readable without colour, which matters more here
 * than anywhere else in this catalog — a policy whose severity is carried
 * only by a red pill is a policy some readers cannot read.
 *
 * The demo selects the first row, the least restrictive one, so the panel
 * opens on the state most actions are in.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface ApprovalPolicyListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface ApprovalPolicyListProps {
  heading?: string
  intro?: string
  rows?: ApprovalPolicyListRow[]
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

const ROWS: ApprovalPolicyListRow[] = [
  { id: "row-1", label: "Read anything", detail: "Runs unattended. Every read is logged with the query that caused it.", tone: "positive", status: "unattended" },
  { id: "row-2", label: "Draft and edit documents", detail: "Runs unattended in a draft state. Publishing is a separate action.", tone: "positive", status: "unattended" },
  { id: "row-3", label: "Send an external message", detail: "Always asks. The recipient and the full body are shown before you sign.", tone: "warning", status: "asks" },
  { id: "row-4", label: "Spend money or change a plan", detail: "Always asks, and the approval expires after five minutes rather than waiting.", tone: "critical", status: "asks" },
  { id: "row-5", label: "Delete production data", detail: "Blocked outright. There is no approval that turns this on from here.", tone: "critical", status: "blocked" },
]

export function ApprovalPolicyList({
  heading = "What runs without asking",
  intro = "Approval prompts are trusted in proportion to how predictable they are. Someone who cannot say in advance which actions will stop and ask learns to approve everything.",
  rows = ROWS,
  className,
}: ApprovalPolicyListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="approval-policy-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="approval-policy-list-heading"
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
