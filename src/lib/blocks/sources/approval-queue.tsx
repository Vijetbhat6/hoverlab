'use client'

/**
 * <ApprovalQueue> — a queue of decisions, and the honest way to bulk them.
 *
 * Human in the Loop already had the single approval card, the diff review,
 * the confidence recommendation and the scope dialog: four surfaces that
 * assume one decision at a time. That assumption survives a demo and dies
 * in week two, when the queue has forty items and the reviewer starts
 * hunting for a way to clear it.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Bulk approve exists — refusing to build it just moves the rubber-stamp
 * into a rage-click on every row — but it cannot reach the items that
 * matter. Anything the agent marked high-impact is checkbox-less by
 * design, with the reason in its place: "opens individually". So the fast
 * path stays fast for the eighteen refunds under a tenner, and the two
 * decisions that can lose money or delete data still cost a person a
 * click each.
 *
 * SELECT-ALL MEANS WHAT IS ON SCREEN
 *
 * A select-all that silently spans the filter is how a reviewer approves
 * things they never saw. The header checkbox says how many it will take,
 * and when a filter is on it says that too. Its indeterminate state is
 * set through a ref — the attribute does not exist in markup, and a
 * three-state box drawn as a styled span is invisible to a screen reader.
 *
 * TIME IS PART OF THE DECISION
 *
 * Real approval systems auto-approve on a timer, or the work stops. If
 * that is true, the row says when — "auto-approves in 3h" is the most
 * decision-changing text on this screen, and burying it in a policy doc
 * is how a reviewer discovers the rule by being surprised by it.
 *
 * ACCESSIBILITY: a real `<table>`, because this is tabular and reviewers
 * sort it. Every row checkbox is labelled with what it approves, so the
 * screen-reader run is "approve refund, order 41822" and not twenty
 * identical "select" boxes. The action bar is `aria-live="polite"` and
 * counts in words.
 */

import * as React from 'react'
import { AlertTriangle, ArrowRight, Check, Clock, ShieldAlert, X } from 'lucide-react'

export interface ApprovalItem {
  id: string
  /** What the agent wants to do, phrased as the action it will take. */
  action: string
  context: string
  amount?: string
  /** Hours until the policy approves it without a human. */
  autoApproveIn?: number
  /**
   * High-impact items are excluded from every bulk control. The string is
   * shown in place of the checkbox — the reason has to be readable, or the
   * missing box reads as a bug.
   */
  needsIndividualReview?: string
}

export interface ApprovalQueueProps {
  items?: ApprovalItem[]
  className?: string
}

const DEFAULT_ITEMS: ApprovalItem[] = [
  {
    id: '41822',
    action: 'Refund order 41822',
    context: 'Damaged on arrival · photo attached · customer since 2023',
    amount: '£38.00',
    autoApproveIn: 3,
  },
  {
    id: '41830',
    action: 'Refund order 41830',
    context: 'Never delivered · carrier confirmed loss',
    amount: '£12.50',
    autoApproveIn: 3,
  },
  {
    id: '41833',
    action: 'Refund order 41833',
    context: 'Duplicate charge · matched to payment intent pi_3Qk',
    amount: '£64.00',
    autoApproveIn: 6,
  },
  {
    id: 'acct-9921',
    action: 'Close account for Meridian Foods',
    context: 'Requested by an admin · 41 users · 3 years of data',
    needsIndividualReview: 'Deletes data — opens individually',
  },
  {
    id: '41840',
    action: 'Refund order 41840',
    context: 'Late delivery · goodwill, within policy',
    amount: '£9.99',
    autoApproveIn: 12,
  },
  {
    id: 'cr-4402',
    action: 'Issue account credit to Halden Group',
    context: 'Outage compensation · agent proposed 3 months',
    amount: '£4,200.00',
    needsIndividualReview: 'Above the bulk limit — opens individually',
  },
]

export function ApprovalQueue({ items = DEFAULT_ITEMS, className = '' }: ApprovalQueueProps) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [resolved, setResolved] = React.useState<Record<string, 'approved' | 'declined'>>({})

  const pending = items.filter((i) => !resolved[i.id])
  /* The set a bulk control is allowed to touch, and nothing beyond it. */
  const bulkable = pending.filter((i) => !i.needsIndividualReview)
  const allSelected = bulkable.length > 0 && selected.length === bulkable.length
  const someSelected = selected.length > 0 && !allSelected

  const headerBox = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    /* Indeterminate is a property, not an attribute — it cannot be set in JSX. */
    if (headerBox.current) headerBox.current.indeterminate = someSelected
  }, [someSelected])

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const resolve = (ids: string[], outcome: 'approved' | 'declined') => {
    setResolved((r) => ({ ...r, ...Object.fromEntries(ids.map((id) => [id, outcome])) }))
    setSelected((s) => s.filter((id) => !ids.includes(id)))
  }

  const held = pending.filter((i) => i.needsIndividualReview).length

  return (
    <section className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Waiting for you</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {pending.length} {pending.length === 1 ? 'action' : 'actions'} the agent
              will not take on its own
              {held > 0 ? ` · ${held} must be opened individually` : ''}
            </p>
          </div>
        </header>

        {/*
          Live region and a count in words: the bar appears and changes
          under the reviewer's hands, and the number in it is the whole
          basis for pressing a button labelled "approve".
        */}
        {selected.length > 0 ? (
          <div
            aria-live="polite"
            className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 px-5 py-3"
          >
            <p className="min-w-0 flex-1 text-sm text-foreground">
              {selected.length} selected — every one of them a refund under the
              bulk limit.
            </p>
            <button
              type="button"
              onClick={() => resolve(selected, 'declined')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
              Decline {selected.length}
            </button>
            <button
              type="button"
              onClick={() => resolve(selected, 'approved')}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Check aria-hidden className="h-3.5 w-3.5" />
              Approve {selected.length}
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Actions awaiting approval. High-impact actions have no bulk
              checkbox and must be opened individually.
            </caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="w-10 px-5 py-2">
                  <input
                    ref={headerBox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? [] : bulkable.map((i) => i.id))}
                    /*
                      accent-primary, not a hand-drawn box: the tokens here
                      are oklch(), so hsl(var(--primary)) is not a colour
                      and the check would render browser-blue.
                    */
                    className="h-4 w-4 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                  <span className="sr-only">
                    Select the {bulkable.length} actions that can be approved in bulk
                  </span>
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Action
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Amount
                </th>
                <th scope="col" className="px-5 py-2 text-right font-medium">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const outcome = resolved[item.id]
                const boxId = `approve-${item.id}`
                return (
                  <tr key={item.id} className={outcome ? 'opacity-60' : undefined}>
                    <td className="px-5 py-3 align-top">
                      {item.needsIndividualReview || outcome ? (
                        <span
                          aria-hidden
                          className="flex h-4 w-4 items-center justify-center text-muted-foreground"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <>
                          <label htmlFor={boxId} className="sr-only">
                            {item.action}
                          </label>
                          <input
                            id={boxId}
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={() => toggle(item.id)}
                            className="h-4 w-4 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          />
                        </>
                      )}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <p className="font-medium text-foreground">{item.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.context}</p>
                      {item.needsIndividualReview && !outcome ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle aria-hidden className="h-3 w-3" />
                          {item.needsIndividualReview}
                        </p>
                      ) : null}
                      {outcome ? (
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {outcome === 'approved' ? 'Approved' : 'Declined'} just now ·{' '}
                          <button
                            type="button"
                            onClick={() =>
                              setResolved(({ [item.id]: _drop, ...rest }) => rest)
                            }
                            className="rounded underline underline-offset-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Undo
                          </button>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 text-right align-top tabular-nums text-foreground">
                      {item.amount ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right align-top">
                      {item.needsIndividualReview ? (
                        <a
                          href="#review"
                          className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Open
                          <ArrowRight aria-hidden className="h-3 w-3" />
                          <span className="sr-only"> {item.action}</span>
                        </a>
                      ) : item.autoApproveIn ? (
                        /* The rule people otherwise learn by being surprised. */
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock aria-hidden className="h-3 w-3" />
                          Auto-approves in {item.autoApproveIn}h
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No deadline</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
