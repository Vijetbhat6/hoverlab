/**
 * <ContextChunkCards> — the retrieved passages an answer was built from,
 * with their similarity scores and provenance.
 *
 * The debugging surface for RAG, and the trust surface for the user. When an
 * answer is wrong the first question is always "what did it actually read",
 * and this is the block that answers it.
 *
 * Details worth keeping:
 *
 *  - The matched span inside each chunk is a `<mark>`, not a coloured span.
 *    `<mark>` means "relevant to the current context" — precisely this — and
 *    is exposed as a highlight by screen readers rather than being silent.
 *  - Score is a `<meter>` with a hidden numeric label, so "0.82" is
 *    available to a reader instead of a bar it cannot see.
 *  - Chunks are ordered by score and *say* they are, because a list whose
 *    order carries meaning must declare it. The rank is rendered, not
 *    implied by position.
 *  - Long chunks clamp to four lines with a real expand button rather than a
 *    fade-out that hides text with no way to reach it.
 *  - The filter chips are a `radiogroup`, so arrow keys move between them
 *    and only the active one is in the tab order — the standard pattern for
 *    a single-choice toolbar.
 *
 * Score colouring never carries meaning alone: every card states its band in
 * text beside the meter.
 */

'use client'

import * as React from 'react'
import { ChevronDown, Database, FileText, Globe, MessageSquare } from 'lucide-react'

export type ChunkKind = 'doc' | 'table' | 'web' | 'ticket'

export interface ContextChunk {
  id: string
  kind: ChunkKind
  source: string
  location: string
  /** 0–1. */
  score: number
  text: string
  /** Substring of `text` to mark as the matched span. */
  match?: string
}

export interface ContextChunkCardsProps {
  heading?: string
  query?: string
  chunks?: ContextChunk[]
  className?: string
}

const KIND_ICON = {
  doc: FileText,
  table: Database,
  web: Globe,
  ticket: MessageSquare,
} as const

const KIND_LABEL = {
  doc: 'Document',
  table: 'Table',
  web: 'Web page',
  ticket: 'Support ticket',
} as const

const DEFAULT_CHUNKS: ContextChunk[] = [
  {
    id: '1',
    kind: 'doc',
    source: 'Pricing handbook',
    location: '§4.2 — Volume breaks',
    score: 0.91,
    text: 'Accounts above 1,200 units per order qualify for the tier-two rate of $8.40, held for the duration of the contract year. The break is applied per order, not per quarter, so a single large order beats two smaller ones of the same total volume.',
    match: 'The break is applied per order, not per quarter',
  },
  {
    id: '2',
    kind: 'ticket',
    source: 'Ticket #4192',
    location: 'Northwind Retail · resolved',
    score: 0.78,
    text: 'Customer asked why their November order did not get the tier-two price. Their October and November orders were 700 units each — combined they clear the break, individually they do not. Confirmed with finance that this is working as intended.',
    match: 'combined they clear the break, individually they do not',
  },
  {
    id: '3',
    kind: 'table',
    source: 'warehouse.orders',
    location: '2,481 rows scanned',
    score: 0.64,
    text: 'Aggregated order volume by account for the trailing four quarters, filtered to accounts with more than one order in the period.',
  },
  {
    id: '4',
    kind: 'web',
    source: 'supplier.example.com',
    location: 'Lead times · fetched today',
    score: 0.41,
    text: 'Standard lead time for the winter blend is 21 days from purchase order. Expedited shipping is available at a 15% surcharge and reduces this to 9 days.',
    match: '21 days from purchase order',
  },
]

const FILTERS = ['All', 'Documents', 'Tables', 'Web'] as const

/**
 * `<meter>` restyled while keeping its semantics.
 *
 * Flat selectors in a `<style>` block, not Tailwind utilities, for two
 * reasons that are invisible until the meter renders in platform yellow:
 * Chromium gates `::-webkit-meter-*` on the *prefixed*
 * `-webkit-appearance: none`, which `appearance-none` does not emit; and an
 * arbitrary variant nests as `:is(.cls)::-webkit-meter-bar`, which Chromium
 * rejects outright — a UA shadow pseudo-element cannot sit behind `:is()`.
 * See the fuller note in `confidence-recommendation`.
 */
const METER_CSS = `
  .hl-meter { -webkit-appearance: none; appearance: none; background: none; }
  .hl-meter::-webkit-meter-bar {
    background: var(--muted); border: none; border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-optimum-value {
    background: var(--color-emerald-500, #10b981); border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-suboptimum-value {
    background: var(--color-amber-500, #f59e0b); border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-even-less-good-value {
    background: var(--color-rose-500, #f43f5e); border-radius: 9999px;
  }
  .hl-meter::-moz-meter-bar { border-radius: 9999px; }
`

function band(score: number) {
  if (score >= 0.8) return 'Strong match'
  if (score >= 0.6) return 'Partial match'
  return 'Weak match'
}

export function ContextChunkCards({
  heading = 'Retrieved context',
  query = 'why did northwind not get the volume price',
  chunks = DEFAULT_CHUNKS,
  className = '',
}: ContextChunkCardsProps) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('All')
  const [expanded, setExpanded] = React.useState<string[]>([])

  const visible = React.useMemo(() => {
    const wanted: Record<string, ChunkKind | null> = {
      All: null,
      Documents: 'doc',
      Tables: 'table',
      Web: 'web',
    }
    const kind = wanted[filter]
    const list = kind ? chunks.filter((c) => c.kind === kind) : chunks
    // Order is meaning here, so it is enforced rather than assumed.
    return [...list].sort((a, b) => b.score - a.score)
  }, [chunks, filter])

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      {/* Declared once for every meter below, not once per card. */}
      <style>{METER_CSS}</style>

      {/* -- Header ------------------------------------------------------ */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{heading}</h3>
          {/* Wraps rather than truncates: "ranked by similarity" is the
              part that explains the order, and it was the part being cut. */}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {visible.length} chunks for “{query}”, ranked by similarity
          </p>
        </div>

        {/* Single-choice toolbar: arrow keys move, one stop in the tab
            order. `radiogroup` is the role that describes that. */}
        <div role="radiogroup" aria-label="Filter by source type" className="flex gap-1">
          {FILTERS.map((option) => {
            const active = option === filter
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setFilter(option)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                  e.preventDefault()
                  const i = FILTERS.indexOf(filter)
                  const next =
                    e.key === 'ArrowRight'
                      ? FILTERS[(i + 1) % FILTERS.length]
                      : FILTERS[(i - 1 + FILTERS.length) % FILTERS.length]
                  setFilter(next)
                }}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {/* -- Chunks ------------------------------------------------------ */}
      <ol className="space-y-3">
        {visible.map((chunk, i) => {
          const Icon = KIND_ICON[chunk.kind]
          const open = expanded.includes(chunk.id)
          const panelId = `chunk-${chunk.id}`

          return (
            <li
              key={chunk.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-2.5">
                <span
                  aria-hidden
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-muted-foreground"
                >
                  {i + 1}
                </span>

                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                <span className="min-w-0 truncate text-xs font-semibold">
                  <span className="sr-only">{KIND_LABEL[chunk.kind]}: </span>
                  {chunk.source}
                </span>

                <span className="min-w-0 shrink truncate text-xs text-muted-foreground">
                  · {chunk.location}
                </span>

                <span className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{band(chunk.score)}</span>
                  <meter
                    value={chunk.score}
                    min={0}
                    max={1}
                    low={0.6}
                    high={0.8}
                    optimum={1}
                    aria-label={`Similarity ${chunk.score.toFixed(2)}`}
                    className="hl-meter h-1.5 w-12"
                  >
                    {chunk.score.toFixed(2)}
                  </meter>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {chunk.score.toFixed(2)}
                  </span>
                </span>
              </div>

              <div className="px-4 py-3">
                <p
                  id={panelId}
                  className={`text-xs leading-relaxed text-muted-foreground ${
                    open ? '' : 'line-clamp-4'
                  }`}
                >
                  {highlight(chunk.text, chunk.match)}
                </p>

                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setExpanded((list) =>
                      list.includes(chunk.id)
                        ? list.filter((x) => x !== chunk.id)
                        : [...list, chunk.id],
                    )
                  }
                  className="mt-2 inline-flex items-center gap-1 rounded-md text-xs font-medium text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {open ? 'Show less' : 'Show full chunk'}
                  <ChevronDown
                    aria-hidden
                    className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Wrap the matched span in `<mark>`.
 *
 * Split on the literal substring rather than building a regex from it —
 * chunk text is retrieved content, and a `(` in it would otherwise throw
 * inside `new RegExp`.
 */
function highlight(text: string, match?: string): React.ReactNode {
  if (!match) return text

  const at = text.indexOf(match)
  if (at === -1) return text

  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded bg-primary/15 px-0.5 text-foreground">{match}</mark>
      {text.slice(at + match.length)}
    </>
  )
}
