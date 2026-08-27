'use client'

/**
 * <RetrievalIndexStatus> — how old the assistant's knowledge is.
 *
 * Retrieval & Context had the chunk cards, the citations, the source
 * picker, the honest empty state and the context budget. All five describe
 * a single question being answered. None of them describes the thing that
 * decides whether the answer is *right*: when each source was last read.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * A green tick beside a connector means "the connection works", and
 * everybody reads it as "the answers are current". Those are different
 * claims and the gap between them is where a support agent confidently
 * quotes a refund policy that changed on Tuesday. So freshness is stated
 * as an age in words next to every source, and the panel's headline is
 * the *oldest* source rather than an average — an index is only as
 * current as its stalest corner.
 *
 * A FAILING SYNC IS NOT A FAILING ANSWER
 *
 * When a crawl breaks, the old documents are still there and still being
 * answered from. Saying "sync failed" alone implies the assistant has
 * gone quiet; it has not, it is answering from data of a known age. Both
 * facts go on the row, in that order.
 *
 * PARTIAL IS ITS OWN STATE
 *
 * A source that indexed 812 of 1,340 documents is neither ready nor
 * broken, and collapsing it into either is a lie in one direction or the
 * other. It gets a progress figure and a sentence about what is missing.
 *
 * ACCESSIBILITY: a real list with one heading per source; every status is
 * text before it is a colour, so nothing here depends on distinguishing
 * amber from green; the refresh confirmation is `aria-live="polite"`.
 */

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react'

export type IndexState = 'fresh' | 'stale' | 'partial' | 'failed'

export interface IndexedSource {
  id: string
  name: string
  kind: string
  state: IndexState
  /** Age of the newest content, in words. Never a bare timestamp. */
  age: string
  documents: number
  /** Set on `partial`: how many of `documents` are actually searchable. */
  indexed?: number
  /** Set on `failed`: what broke, in a sentence a customer can act on. */
  problem?: string
}

export interface RetrievalIndexStatusProps {
  sources?: IndexedSource[]
  className?: string
}

const DEFAULT_SOURCES: IndexedSource[] = [
  {
    id: 'help',
    name: 'Help centre',
    kind: 'Website · 4 domains',
    state: 'fresh',
    age: '11 minutes ago',
    documents: 486,
  },
  {
    id: 'notion',
    name: 'Internal handbook',
    kind: 'Notion workspace',
    state: 'partial',
    age: '2 hours ago',
    documents: 1340,
    indexed: 812,
  },
  {
    id: 'zendesk',
    name: 'Past tickets',
    kind: 'Zendesk · resolved only',
    state: 'stale',
    age: '9 days ago',
    documents: 22190,
  },
  {
    id: 'drive',
    name: 'Policy documents',
    kind: 'Google Drive folder',
    state: 'failed',
    age: '6 weeks ago',
    documents: 74,
    problem: 'The connected account lost access to the folder on 3 August.',
  },
]

const STATE_TEXT: Record<IndexState, string> = {
  fresh: 'Up to date',
  stale: 'Behind',
  partial: 'Partly indexed',
  failed: 'Not syncing',
}

const STATE_ICON: Record<IndexState, React.ComponentType<{ className?: string }>> = {
  fresh: CheckCircle2,
  stale: Clock,
  partial: AlertTriangle,
  failed: XCircle,
}

/* Colour is the second signal, never the first — every state is spelled
   out in STATE_TEXT above. */
const STATE_TONE: Record<IndexState, string> = {
  fresh: 'text-primary',
  stale: 'text-amber-700 dark:text-amber-400',
  partial: 'text-amber-700 dark:text-amber-400',
  failed: 'text-destructive',
}

export function RetrievalIndexStatus({
  sources = DEFAULT_SOURCES,
  className = '',
}: RetrievalIndexStatusProps) {
  const [refreshing, setRefreshing] = React.useState(false)
  const [message, setMessage] = React.useState('')

  /* The headline is the worst row, not the average. */
  const worst =
    sources.find((s) => s.state === 'failed') ??
    sources.find((s) => s.state === 'stale') ??
    sources.find((s) => s.state === 'partial') ??
    sources[0]

  function refresh() {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setMessage(
        'Re-crawl queued for every source. Answers keep using the current index until it finishes.',
      )
    }, 900)
  }

  if (!worst) return null

  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Knowledge freshness</h2>
            {/* The sentence the green ticks were being read as. */}
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Answers can only be as current as the source they come from. The oldest
              connected source was last read{' '}
              <strong className="font-semibold text-foreground">{worst.age}</strong>, so
              anything changed since then may not be reflected yet.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RefreshCw
              aria-hidden
              className={`h-3.5 w-3.5 ${refreshing ? 'motion-safe:animate-spin' : ''}`}
            />
            {refreshing ? 'Queuing' : 'Re-crawl all'}
          </button>
        </header>

        <ul className="divide-y divide-border">
          {sources.map((source) => {
            const Icon = STATE_ICON[source.state]
            const share =
              source.indexed === undefined
                ? null
                : Math.round((source.indexed / source.documents) * 100)
            return (
              <li key={source.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <Icon
                  aria-hidden
                  className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${STATE_TONE[source.state]}`}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground">{source.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{source.kind}</p>

                  <p className="mt-1.5 text-xs">
                    <span className={`font-medium ${STATE_TONE[source.state]}`}>
                      {STATE_TEXT[source.state]}
                    </span>
                    <span className="text-muted-foreground"> · last read {source.age}</span>
                  </p>

                  {/* Partial gets a number and a consequence. */}
                  {source.state === 'partial' && source.indexed !== undefined ? (
                    <>
                      <div
                        aria-hidden
                        className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {source.indexed.toLocaleString('en-US')} of{' '}
                        {source.documents.toLocaleString('en-US')} documents searchable —
                        the remaining {(source.documents - source.indexed).toLocaleString('en-US')}{' '}
                        cannot be cited yet.
                      </p>
                    </>
                  ) : null}

                  {/* Failed: what broke, and that answers continue. */}
                  {source.state === 'failed' && source.problem ? (
                    <p className="mt-1.5 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                      {source.problem} The {source.documents} documents already indexed are
                      still being answered from, at the age above.
                    </p>
                  ) : null}
                </div>

                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {source.documents.toLocaleString('en-US')} docs
                </p>
              </li>
            )
          })}
        </ul>

        <p aria-live="polite" className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {message}
        </p>
      </div>
    </section>
  )
}
