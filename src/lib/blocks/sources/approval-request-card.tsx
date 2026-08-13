/**
 * <ApprovalRequestCard> — the agent stops and asks before it acts.
 *
 * This is the block that decides whether an agent product is trustworthy,
 * and almost every version of it is too vague to approve safely. The rules
 * it follows:
 *
 *  - State the *effect*, not the intention. "Send 214 emails" is approvable;
 *    "proceed with outreach" is not. The consequence line is required, not
 *    decorative, and it names what changes and where.
 *  - Approve is never the pre-focused default. A card that appears under the
 *    user's hands with the destructive option focused will be approved by an
 *    Enter keypress meant for something else, so focus lands on the card's
 *    heading and the user must travel to a choice deliberately.
 *  - The options are radios in a `<fieldset>`, not buttons. Arrow keys move
 *    between them, the legend names the question for a screen reader, and —
 *    crucially — choosing is separate from committing, so a mis-click is not
 *    an irreversible action.
 *  - The decision is announced through `role="status"`, and the card keeps
 *    its resolved state on screen. An approval that vanishes leaves the user
 *    unable to answer "what did I just agree to".
 *
 * Real dialogs get `role="alertdialog"` and a focus trap. This one renders
 * inline in the thread, which is the shape most agents actually use, so it
 * is a `<section>` with a labelled heading instead.
 */

'use client'

import * as React from 'react'
import { AlertTriangle, ArrowRight, Check, ShieldAlert, X } from 'lucide-react'

export interface ApprovalOption {
  id: string
  label: string
  hint?: string
  /** Marks the choice that does the most damage if chosen carelessly. */
  destructive?: boolean
}

export interface ApprovalRequestCardProps {
  question?: string
  rationale?: string
  /** What changes if this is approved. Shown as a consequence list. */
  effects?: string[]
  options?: ApprovalOption[]
  /** Shown when the request touches something irreversible. */
  warning?: string
  className?: string
}

const DEFAULT_OPTIONS: ApprovalOption[] = [
  {
    id: 'core',
    label: 'Email the 38 accounts flagged high-risk',
    hint: 'Smallest blast radius — the cohort the model is most confident about',
  },
  {
    id: 'full',
    label: 'Email all 214 accounts in the at-risk segment',
    hint: 'Includes medium-confidence accounts; ~40 are likely false positives',
    destructive: true,
  },
  { id: 'none', label: 'Draft them for me to review, send nothing', hint: 'No mail leaves today' },
]

const DEFAULT_EFFECTS = [
  'Sends from retention@acme.com via the production Postmark key',
  'Writes a "save offer sent" activity to each CRM account',
  'Cannot be recalled once dispatched',
]

export function ApprovalRequestCard({
  question = 'Who should receive the retention offer?',
  rationale = 'I scored 214 accounts as at-risk for Q4. 38 of them cleared the high-confidence threshold. Sending to the full segment reaches more real churn but also more accounts that were never going to leave.',
  effects = DEFAULT_EFFECTS,
  options = DEFAULT_OPTIONS,
  warning = 'This sends real email from a production account.',
  className = '',
}: ApprovalRequestCardProps) {
  const [choice, setChoice] = React.useState(options[0]?.id ?? '')
  const [decision, setDecision] = React.useState<'approved' | 'declined' | null>(null)

  const selected = options.find((o) => o.id === choice)
  const headingId = React.useId()

  return (
    <section
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-amber-500/30 bg-card ${className}`}
    >
      {/* -- Header ----------------------------------------------------- */}
      <div className="flex items-start gap-3 border-b border-border/60 bg-amber-500/5 px-5 py-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <ShieldAlert aria-hidden className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Waiting on you
          </p>
          <h3 id={headingId} className="mt-0.5 text-base font-semibold leading-snug">
            {question}
          </h3>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{rationale}</p>

        {/* -- What actually happens ----------------------------------- */}
        {effects.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              If you approve
            </h4>
            <ul className="space-y-1.5">
              {effects.map((effect) => (
                <li key={effect} className="flex gap-2 text-xs leading-relaxed">
                  <ArrowRight
                    aria-hidden
                    className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                  />
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* -- Choices --------------------------------------------------- */}
        <fieldset disabled={decision !== null} className="disabled:opacity-60">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Choose one
          </legend>

          <div className="space-y-2">
            {options.map((option) => {
              const active = option.id === choice

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                    active ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${headingId}-choice`}
                    value={option.id}
                    checked={active}
                    onChange={() => setChoice(option.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {option.label}
                      {option.destructive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                          <AlertTriangle aria-hidden className="h-2.5 w-2.5" />
                          Widest reach
                        </span>
                      ) : null}
                    </span>
                    {option.hint ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {warning ? (
          <p className="flex gap-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
            <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {warning}
          </p>
        ) : null}
      </div>

      {/* -- Decision --------------------------------------------------- */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3">
        {decision === null ? (
          <>
            <button
              type="button"
              onClick={() => setDecision('declined')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
              Decline
            </button>

            <button
              type="button"
              onClick={() => setDecision('approved')}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Check aria-hidden className="h-4 w-4" />
              Approve
            </button>
          </>
        ) : (
          <>
            {/* The card resolves in place. A decision that erases what was
                decided is not an audit trail. */}
            <p role="status" className="flex items-center gap-2 text-sm">
              {decision === 'approved' ? (
                <>
                  <Check aria-hidden className="h-4 w-4 text-emerald-500" />
                  <span>
                    Approved — <span className="font-medium">{selected?.label}</span>
                  </span>
                </>
              ) : (
                <>
                  <X aria-hidden className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Declined. Nothing was sent.</span>
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setDecision(null)}
              className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Undo
            </button>
          </>
        )}
      </div>
    </section>
  )
}
