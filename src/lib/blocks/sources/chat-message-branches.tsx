'use client'

/**
 * <ChatMessageBranches> — the answers a regenerate throws away.
 *
 * Agent Chat had the empty state, the prompt bar, a streaming answer and
 * the thread panel: everything about a conversation moving forwards. This
 * is the one surface about a conversation that went sideways. Every chat
 * product ships regenerate; almost none ship anywhere to *stand*, so the
 * previous answer — often the better one — is gone the moment somebody
 * taps it out of idle curiosity.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Regenerating adds a sibling. It does not replace. The pair of arrows and
 * the "2 of 3" between them are not chrome: they are the promise that the
 * button is safe to press. Take the switcher away and regenerate becomes a
 * destructive action wearing a refresh icon.
 *
 * EDITING THE QUESTION BRANCHES TOO
 *
 * An edited prompt is a new version of the *user* turn, not a new turn at
 * the bottom. Products that append the edit leave the thread reading as
 * though the person asked nearly the same thing twice and got two answers,
 * which is unreadable a week later. Here both roles carry the same
 * switcher, and the answer shown always belongs to the question shown.
 *
 * THE CONSEQUENCE IS STATED, BECAUSE IT IS THE SCARY PART
 *
 * Switching to a branch that has replies underneath it does not delete
 * them — it puts the thread on a different path, and the replies are still
 * on the old one. That sentence sits under the switcher whenever there is
 * something below to lose. Most implementations either silently truncate
 * or silently keep a mismatched tail; both make people distrust the arrows
 * and stop using the feature.
 *
 * ACCESSIBILITY: the switcher is a labelled `role="group"`, so a screen
 * reader hears "response versions, previous, 2 of 3, next" rather than two
 * unlabelled arrows. The count is text, not a bare number in a badge, and
 * the message body carries `aria-live="polite"` so the new version is read
 * out on switch — the change is off-screen for anybody not looking at the
 * arrows they just pressed.
 */

import * as React from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitBranch,
  Pencil,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'

export interface ChatBranch {
  /** What the person asked, in this version of the turn. */
  question: string
  /** What came back for that question. */
  answer: string
  /** Model or setting that produced it — the reason to compare at all. */
  producedBy: string
}

export interface ChatMessageBranchesProps {
  branches?: ChatBranch[]
  /** Replies that already exist below this turn, on the newest branch. */
  repliesBelow?: number
  className?: string
}

const DEFAULT_BRANCHES: ChatBranch[] = [
  {
    question: 'Summarise the Q3 churn report for the board.',
    answer:
      'Churn was 4.1% for the quarter, up from 3.6%. The rise is concentrated in accounts under 20 seats that joined during the March promotion — cohort retention for that group is 12 points below the trailing average. Enterprise renewals were unaffected.',
    producedBy: 'First attempt',
  },
  {
    question: 'Summarise the Q3 churn report for the board.',
    answer:
      'Q3 churn: 4.1%, up 0.5 points. One cause, not several — the March promotion cohort. Those accounts are small, under 20 seats, churned 12 points below average retention, and are now fully out of contract. Everything above 20 seats held. The board should read this as the cost of a pricing experiment, not as a product problem.',
    producedBy: 'Regenerated, longer',
  },
  {
    question:
      'Summarise the Q3 churn report for the board — one paragraph, and no numbers in the first line.',
    answer:
      'Churn rose this quarter for a single, traceable reason: the accounts we discounted in March did not stay. The headline figure is 4.1% against 3.6% last quarter, and every point of the increase sits in that one cohort. Renewals elsewhere, including all enterprise accounts, were flat.',
    producedBy: 'After editing the question',
  },
]

export function ChatMessageBranches({
  branches = DEFAULT_BRANCHES,
  repliesBelow = 3,
  className = '',
}: ChatMessageBranchesProps) {
  const [index, setIndex] = React.useState(branches.length - 1)
  const [copied, setCopied] = React.useState(false)
  const [vote, setVote] = React.useState<'up' | 'down' | null>(null)

  const current = branches[index]
  const total = branches.length
  /*
    Only the newest branch is the one the visible replies hang off.
    Standing anywhere else means the tail below belongs to a different
    path, and that is exactly what has to be said out loud.
  */
  const onNewestPath = index === total - 1
  const questionEdited =
    index > 0 && branches[index].question !== branches[index - 1].question

  const go = (delta: number) => {
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)))
    setVote(null)
    setCopied(false)
  }

  const switcher = (label: string) => (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
    >
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index === 0}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">Previous version</span>
      </button>
      <span className="px-1 text-xs tabular-nums text-muted-foreground">
        {index + 1} of {total}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={index === total - 1}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">Next version</span>
      </button>
    </div>
  )

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        {/* ---- The user turn, which branches as well ------------------ */}
        <div className="flex justify-end">
          <div className="max-w-[85%]">
            <div className="rounded-2xl rounded-ee-sm bg-muted px-4 py-3 text-sm text-foreground">
              {current.question}
            </div>
            <div className="mt-1.5 flex items-center justify-end gap-2">
              {questionEdited ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Pencil aria-hidden className="h-3 w-3" />
                  Edited
                </span>
              ) : null}
              {total > 1 ? switcher('Question versions') : null}
            </div>
          </div>
        </div>

        {/* ---- The answer belonging to the question above -------------- */}
        <div className="mt-6 flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <GitBranch className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            {/*
              Live region on the body, not on the whole card: switching is
              a silent visual change for anyone who is not watching the
              arrows they just pressed.
            */}
            <div aria-live="polite" className="text-sm leading-relaxed text-foreground">
              {current.answer}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">{current.producedBy}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {switcher('Response versions')}

              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(current.answer)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                }}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? (
                  <Check aria-hidden className="h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw aria-hidden className="h-3.5 w-3.5" />
                Regenerate
              </button>

              <div className="ms-auto flex items-center gap-0.5">
                <button
                  type="button"
                  aria-pressed={vote === 'up'}
                  onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    vote === 'up'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ThumbsUp aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Good response</span>
                </button>
                <button
                  type="button"
                  aria-pressed={vote === 'down'}
                  onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    vote === 'down'
                      ? 'text-destructive'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ThumbsDown aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Bad response</span>
                </button>
              </div>
            </div>

            {/*
              The sentence that makes the arrows trustworthy. Shown only
              when there is actually a tail on another path to lose.
            */}
            {!onNewestPath && repliesBelow > 0 ? (
              <p
                role="status"
                className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
              >
                You are looking at an earlier version. The {repliesBelow}{' '}
                {repliesBelow === 1 ? 'message' : 'messages'} below this turn
                belong to version {total} and are still there — replying here
                starts a new path from this answer instead.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
