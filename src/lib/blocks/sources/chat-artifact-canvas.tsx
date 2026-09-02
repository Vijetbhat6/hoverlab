'use client'

/**
 * <ChatArtifactCanvas> — the conversation beside the thing it is making.
 *
 * Agent Chat had the thread, the composer, the streaming answer, the
 * starter screen and the version switcher: five surfaces about messages.
 * The layout every assistant that produces *work* has converged on — chat
 * on the left, the document or component it is building on the right —
 * was not among them.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The two panes disagree, constantly, and almost nothing says so. Scroll
 * back to an earlier message and the canvas is still showing the latest
 * version; ask about "the header" and it is ambiguous which header. Here
 * the canvas names the version it is showing and, when that is not the
 * newest, says it plainly with one control to return — because a silent
 * mismatch between what you are reading and what you are pointing at is
 * how people ask the assistant to fix something it already fixed.
 *
 * A VERSION KNOWS WHICH MESSAGE MADE IT
 *
 * Each version carries the turn that produced it, so the history is a
 * record of decisions rather than a list of numbers. Selecting a message
 * moves the canvas; selecting a version highlights the message. One
 * relationship, navigable from both ends.
 *
 * EDITS DO NOT SILENTLY BRANCH
 *
 * The canvas is editable, and an edit on top of an old version would fork
 * the document invisibly. It is refused with a reason and a choice —
 * return to the newest, or branch on purpose — instead of being allowed
 * and quietly discarded on the next turn.
 *
 * ACCESSIBILITY: two labelled regions so a screen reader can move between
 * panes; the version list is a real list with `aria-current`; the
 * out-of-date warning is `role="status"`. On a narrow screen the panes
 * stack, with the canvas first — the answer matters more than the ask.
 */

import * as React from 'react'
import { ArrowDown, Code2, FileText, History, MessageSquare, Sparkles } from 'lucide-react'

export interface CanvasVersion {
  id: string
  label: string
  /** The user turn that produced this version. */
  fromMessage: string
  at: string
  /** Lines shown in the canvas. Kept as text — this is a demo, not an IDE. */
  body: string[]
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Version this turn produced, for assistant turns that changed the canvas. */
  producedVersion?: string
}

export interface ChatArtifactCanvasProps {
  turns?: ChatTurn[]
  versions?: CanvasVersion[]
  className?: string
}

/*
 * The sample deliberately contains no angle-bracket markup.
 *
 * `scripts/audit-a11y.mts` reads block sources as text, so a literal tag
 * inside a code sample is indistinguishable from one the block renders —
 * a demo showing an example table failed the table-headers rule for a
 * table that does not exist. Prose-and-signature form says the same thing
 * and keeps the audit reading only real markup.
 */
const DEFAULT_VERSIONS: CanvasVersion[] = [
  {
    id: 'v1',
    label: 'v1',
    fromMessage: 'm-1',
    at: '14:02',
    body: [
      'export function PriceCard({ plan }) {',
      '  // heading, price, feature list, one call to action',
      '  // three of these side by side, no period switch',
      '}',
    ],
  },
  {
    id: 'v2',
    label: 'v2',
    fromMessage: 'm-3',
    at: '14:06',
    body: [
      'export function PriceCard({ plan, annual }) {',
      '  // price derived from the period rather than hard-coded',
      '  // the heading names the period, so the switch is not',
      '  // the only place the state is visible',
      '}',
    ],
  },
  {
    id: 'v3',
    label: 'v3',
    fromMessage: 'm-5',
    at: '14:11',
    body: [
      'export function PriceCard({ plan, annual }) {',
      '  // per-seat note moved out of the price element, so it is',
      '  // no longer announced as part of the number',
      '  // aria-describedby links the two back together',
      '}',
    ],
  },
]

const DEFAULT_TURNS: ChatTurn[] = [
  { id: 'm-1', role: 'user', text: 'Build me a pricing card, three plans side by side.' },
  {
    id: 'm-2',
    role: 'assistant',
    text: 'Here it is — one heading, one price, one call to action per plan.',
    producedVersion: 'v1',
  },
  { id: 'm-3', role: 'user', text: 'Add a monthly / yearly toggle.' },
  {
    id: 'm-4',
    role: 'assistant',
    text: 'Added. The heading says which period is showing rather than only the switch.',
    producedVersion: 'v2',
  },
  { id: 'm-5', role: 'user', text: 'A screen reader reads the per-seat note as part of the price.' },
  {
    id: 'm-6',
    role: 'assistant',
    text: 'Moved it out of the price and linked the two with aria-describedby.',
    producedVersion: 'v3',
  },
]

export function ChatArtifactCanvas({
  turns = DEFAULT_TURNS,
  versions = DEFAULT_VERSIONS,
  className = '',
}: ChatArtifactCanvasProps) {
  const newest = versions[versions.length - 1]
  /*
   * Opens on the second-newest version, not the newest.
   *
   * On the newest, the two panes agree and the component looks like any
   * other split layout. The out-of-date banner — the one thing here that
   * most implementations leave silent — only exists when they disagree,
   * so the demo starts where the disagreement is. "Go to v3" resolves it.
   */
  const [shownId, setShownId] = React.useState(
    versions[versions.length - 2]?.id ?? newest?.id ?? '',
  )
  const [editAttempt, setEditAttempt] = React.useState(false)

  const shown = versions.find((v) => v.id === shownId) ?? newest
  const stale = Boolean(newest && shown && shown.id !== newest.id)

  if (!shown || !newest) return null

  function show(id: string) {
    setShownId(id)
    setEditAttempt(false)
  }

  return (
    <section className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Canvas first in the source order: on a phone the artifact is
            what the visitor came for, and the thread is the context. */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section
            aria-label="Conversation"
            className="order-2 flex flex-col border-border lg:order-1 lg:border-e"
          >
            <header className="flex items-center gap-2 border-y border-border px-4 py-2.5 lg:border-t-0">
              <MessageSquare aria-hidden className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Thread</h2>
            </header>

            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {turns.map((turn) => {
                const active = turn.producedVersion === shown.id
                return (
                  <li key={turn.id} className={turn.role === 'user' ? 'text-end' : ''}>
                    <div
                      className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-start text-sm ${
                        turn.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : `border bg-background ${
                              active ? 'border-primary/50' : 'border-border'
                            }`
                      }`}
                    >
                      <p className="leading-relaxed">{turn.text}</p>
                      {turn.producedVersion ? (
                        /* Navigable from the message end of the relationship. */
                        <button
                          type="button"
                          onClick={() => show(turn.producedVersion!)}
                          className="mt-1.5 inline-flex items-center gap-1 rounded text-xs font-medium text-primary underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Sparkles aria-hidden className="h-3 w-3" />
                          {active ? `Showing ${turn.producedVersion}` : `Show ${turn.producedVersion}`}
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-border p-3">
              <div className="flex h-10 items-center rounded-xl border border-field bg-background px-3 text-sm text-muted-foreground">
                Ask for another change…
              </div>
            </div>
          </section>

          <section aria-label="Canvas" className="order-1 flex flex-col lg:order-2">
            <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
              <Code2 aria-hidden className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">PriceCard.tsx</h2>
              {/* The version this pane is showing, always named. */}
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {shown.label} · {shown.at}
              </span>
              <button
                type="button"
                onClick={() => setEditAttempt(true)}
                className="ms-auto inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FileText aria-hidden className="h-3.5 w-3.5" />
                Edit
              </button>
            </header>

            {/*
              The mismatch, said out loud. Everything above this line is
              ordinary; this is the part most implementations leave silent.
            */}
            {stale ? (
              <div
                role="status"
                className="flex flex-wrap items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5"
              >
                <p className="min-w-0 flex-1 text-xs text-amber-800 dark:text-amber-300">
                  You are looking at {shown.label}. The assistant&apos;s latest answer is
                  about {newest.label} — anything you ask now applies to that one.
                </p>
                <button
                  type="button"
                  onClick={() => show(newest.id)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg bg-foreground px-2.5 text-xs font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                  Go to {newest.label}
                </button>
              </div>
            ) : null}

            {editAttempt && stale ? (
              <div className="border-b border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                Editing {shown.label} would create a branch, because {newest.label} already
                exists.{' '}
                <button
                  type="button"
                  onClick={() => show(newest.id)}
                  className="rounded font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Edit {newest.label} instead
                </button>
                , or branch from here on purpose.
              </div>
            ) : null}

            <pre className="min-h-0 flex-1 overflow-auto bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>{shown.body.join('\n')}</code>
            </pre>

            <div className="border-t border-border px-4 py-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History aria-hidden className="h-3.5 w-3.5" />
                Versions
              </h3>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {versions.map((version) => {
                  const current = version.id === shown.id
                  return (
                    <li key={version.id}>
                      <button
                        type="button"
                        aria-current={current ? 'true' : undefined}
                        onClick={() => show(version.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          current
                            ? 'border-primary bg-primary/10 font-semibold text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {version.label}
                        <span className="tabular-nums opacity-70">{version.at}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
