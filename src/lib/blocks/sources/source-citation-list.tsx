/**
 * <SourceCitationList> — the footnote apparatus under a generated answer:
 * numbered sources, what each one contributed, and when it was read.
 *
 * Distinct from `<ContextChunkCards>` on purpose. Chunks are the *debugging*
 * view — everything retrieved, scored, including what was ignored. This is
 * the *published* view: only what the answer actually leaned on, in the
 * order it was cited, written for a reader who wants to check a claim.
 *
 * What it gets right:
 *
 *  - It is an `<ol>`. Citations are numbered and the numbers are referenced
 *    from the prose, so the list must genuinely be ordered — a `<ul>` with
 *    hand-drawn numerals breaks the moment one is removed.
 *  - Each entry is a `<cite>` inside a link, which is the element for the
 *    title of a referenced work, and the `<time>` carries a real `dateTime`
 *    so "2 hours ago" is machine-readable rather than a frozen string.
 *  - A staleness warning is text, not a colour. "Read 4 months ago" on a
 *    live page is the single most useful thing this list can tell someone,
 *    and an amber dot does not say it.
 *  - External links announce that they leave the page — `sr-only` text, not
 *    a `title`, and not an icon alone.
 *  - Confidence in a source is expressed as the *claim it supports*, not a
 *    percentage. "Supports: the 6.1% figure" is checkable; "0.82" is not.
 */

import * as React from 'react'
import { AlertTriangle, Database, ExternalLink, FileText, Globe, Quote } from 'lucide-react'

export type CitationKind = 'doc' | 'table' | 'web'

export interface Citation {
  id: number
  title: string
  origin: string
  kind: CitationKind
  /** The claim in the answer this source backs. */
  supports: string
  /** Verbatim excerpt, shown as a pull quote. */
  excerpt?: string
  /** ISO timestamp of when it was read. */
  readAt?: string
  readLabel?: string
  /** Set when the source may have changed since it was read. */
  stale?: string
  href?: string
}

export interface SourceCitationListProps {
  heading?: string
  citations?: Citation[]
  footnote?: string
  className?: string
}

const KIND_ICON = {
  doc: FileText,
  table: Database,
  web: Globe,
} as const

const KIND_LABEL = {
  doc: 'Document',
  table: 'Database table',
  web: 'Web page',
} as const

const DEFAULT_CITATIONS: Citation[] = [
  {
    id: 1,
    title: 'Q3 revenue cohorts',
    origin: 'warehouse.arr_monthly',
    kind: 'table',
    supports: 'The 6.1% churn figure for accounts under 20 seats',
    excerpt: '2,463 accounts · lost ARR $1.24M · seat_band < 20',
    readAt: '2026-08-11T09:14:00Z',
    readLabel: '2 hours ago',
  },
  {
    id: 2,
    title: 'Activation funnel, Jul–Sep',
    origin: 'warehouse.events',
    kind: 'table',
    supports: 'The claim that a second integration predicts retention',
    excerpt: 'Accounts with ≥2 connected sources churned at 1.6%; with 1 source, 6.4%.',
    readAt: '2026-08-11T09:15:00Z',
    readLabel: '2 hours ago',
  },
  {
    id: 3,
    title: 'Pricing handbook',
    origin: 'docs/pricing-handbook.md',
    kind: 'doc',
    supports: 'That the volume break applies per order rather than per quarter',
    excerpt:
      'The break is applied per order, not per quarter, so a single large order beats two smaller ones of the same total volume.',
    readAt: '2026-04-02T11:00:00Z',
    readLabel: '4 months ago',
    stale: 'This document has changed twice since it was indexed.',
  },
  {
    id: 4,
    title: 'Supplier lead times',
    origin: 'supplier.example.com',
    kind: 'web',
    supports: 'The 21-day reorder window',
    readAt: '2026-08-11T09:16:00Z',
    readLabel: '2 hours ago',
    href: '#',
  },
]

export function SourceCitationList({
  heading = 'Sources',
  citations = DEFAULT_CITATIONS,
  footnote = 'Every figure above traces to one of these. Nothing was inferred without a source.',
  className = '',
}: SourceCitationListProps) {
  return (
    <section className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Quote aria-hidden className="h-3.5 w-3.5" />
        {heading}
        <span className="font-mono normal-case tracking-normal">({citations.length})</span>
      </h3>

      <ol className="space-y-2">
        {citations.map((citation) => {
          const Icon = KIND_ICON[citation.kind]
          const external = Boolean(citation.href)

          return (
            <li
              key={citation.id}
              id={`source-${citation.id}`}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[11px] font-bold"
                >
                  {citation.id}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                    {external ? (
                      <a
                        href={citation.href}
                        className="rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="sr-only">{KIND_LABEL[citation.kind]}: </span>
                        <cite className="not-italic">{citation.title}</cite>
                        <ExternalLink aria-hidden className="ms-1 inline h-3 w-3 align-baseline" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="text-sm font-semibold">
                        <span className="sr-only">{KIND_LABEL[citation.kind]}: </span>
                        <cite className="not-italic">{citation.title}</cite>
                      </span>
                    )}

                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {citation.origin}
                    </span>
                  </p>

                  <p className="mt-1.5 text-xs leading-relaxed">
                    <span className="font-medium text-muted-foreground">Supports: </span>
                    {citation.supports}
                  </p>

                  {citation.excerpt ? (
                    <blockquote className="mt-2 border-s-2 border-border ps-3 text-xs italic leading-relaxed text-muted-foreground">
                      {citation.excerpt}
                    </blockquote>
                  ) : null}

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Read{' '}
                    {citation.readAt ? (
                      <time dateTime={citation.readAt}>{citation.readLabel ?? citation.readAt}</time>
                    ) : (
                      'at answer time'
                    )}
                  </p>

                  {/* Said in words. A source that has moved on since it was
                      read is the most consequential thing on this card, and
                      an amber border does not communicate it. */}
                  {citation.stale ? (
                    <p className="mt-2 flex gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                      <AlertTriangle aria-hidden className="mt-px h-3 w-3 shrink-0" />
                      {citation.stale}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {footnote ? <p className="mt-3 text-xs text-muted-foreground">{footnote}</p> : null}
    </section>
  )
}
