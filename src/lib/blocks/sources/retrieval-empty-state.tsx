/**
 * <RetrievalEmptyState> — what an assistant says when it found nothing, and
 * refuses to invent an answer.
 *
 * The most valuable screen in a RAG product and the one nobody designs. The
 * default failure is a model that pads the gap with something plausible; the
 * design job is to make "I don't know" feel like competence rather than a
 * dead end.
 *
 * Structure of an honest miss:
 *
 *  1. Say plainly that nothing was found — not "no results", which reads as
 *     a broken search.
 *  2. Show *where it looked*, so the user can see the gap is in coverage
 *     rather than in the question. This is what converts frustration into a
 *     next action.
 *  3. Offer the near-misses that scored too low to use, with their scores,
 *     rather than discarding them silently.
 *  4. Offer the two real ways out: broaden the search, or connect the source
 *     that would have had the answer.
 *
 * `role="status"`, not `role="alert"` — an empty result is information, not
 * an emergency, and assertive announcements interrupt whatever the user is
 * reading. The heading is the first thing in the region so it is what gets
 * read.
 */

import * as React from 'react'
import { Database, FileQuestion, FileText, Globe, Plus, RefreshCw, Search } from 'lucide-react'

export interface SearchedScope {
  id: string
  label: string
  detail: string
  kind: 'doc' | 'table' | 'web'
}

export interface NearMiss {
  id: string
  title: string
  score: number
}

export interface RetrievalEmptyStateProps {
  query?: string
  headline?: string
  body?: string
  searched?: SearchedScope[]
  nearMisses?: NearMiss[]
  /** The gap the user could close, named specifically. */
  suggestion?: string
  className?: string
}

const KIND_ICON = {
  doc: FileText,
  table: Database,
  web: Globe,
} as const

const DEFAULT_SEARCHED: SearchedScope[] = [
  { id: '1', label: 'Company handbook', detail: '214 documents', kind: 'doc' },
  { id: '2', label: 'Analytics warehouse', detail: '18 tables', kind: 'table' },
  { id: '3', label: 'help.acme.com', detail: '480 pages', kind: 'web' },
]

const DEFAULT_NEAR_MISSES: NearMiss[] = [
  { id: '1', title: 'Refund policy for annual plans', score: 0.31 },
  { id: '2', title: 'Ticket #3820 — chargeback process', score: 0.28 },
]

export function RetrievalEmptyState({
  query = 'what is our EU VAT registration number',
  headline = 'I could not find this in anything I can read.',
  body = 'Rather than guess at a number that has to be exact, here is where I looked and what came closest.',
  searched = DEFAULT_SEARCHED,
  nearMisses = DEFAULT_NEAR_MISSES,
  suggestion = 'Tax registrations usually live in the finance drive, which is not connected.',
  className = '',
}: RetrievalEmptyStateProps) {
  return (
    <section
      role="status"
      className={`mx-auto w-full max-w-xl rounded-2xl border border-border/60 bg-card p-6 ${className}`}
    >
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileQuestion aria-hidden className="h-5 w-5" />
        </span>

        <h3 className="mt-4 text-balance text-base font-semibold">{headline}</h3>

        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>

        <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5">
          <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs text-muted-foreground">{query}</span>
        </p>
      </div>

      {/* -- Where it looked --------------------------------------------- */}
      <div className="mt-6">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Searched
        </h4>
        <ul className="space-y-1.5">
          {searched.map((scope) => {
            const Icon = KIND_ICON[scope.kind]
            return (
              <li
                key={scope.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 px-3 py-2 text-xs"
              >
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{scope.label}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">{scope.detail}</span>
                <span className="shrink-0 text-muted-foreground">· 0 matches</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* -- Near misses -------------------------------------------------- */}
      {nearMisses.length > 0 ? (
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Closest, but below the threshold
          </h4>
          <ul className="space-y-1.5">
            {nearMisses.map((miss) => (
              <li key={miss.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate">{miss.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {miss.score.toFixed(2)}
                    <span className="sr-only"> similarity, below the 0.45 cutoff</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* -- The two ways out --------------------------------------------- */}
      {suggestion ? (
        <p className="mt-5 rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {suggestion}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Search without the cutoff
        </button>

        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Connect a source
        </button>
      </div>
    </section>
  )
}
