'use client'

/**
 * <ContextWindowBudget> — what is in the context, and what fell out of it.
 *
 * Retrieval & Context had the source picker, the chunk cards, the citation
 * list and the empty state: four views of what the model *used*. None of
 * them can answer the question people actually ask when an answer is
 * wrong — "did it even see the file?" This is that view.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The dropped items are on screen, with the reason. Every retrieval
 * pipeline evicts something: a chunk that ranked eighth when only seven
 * fit, a conversation turn that aged out, a 4MB PDF nothing was ever going
 * to fit whole. Products show the seven and stay silent about the eighth,
 * so the failure looks like the model ignoring a document rather than the
 * document never arriving. Naming the eighth turns an unfalsifiable
 * complaint into a fixable one — and the fix is usually "pin it", which is
 * a control here.
 *
 * THE RESERVE IS DRAWN AS PART OF THE BAR
 *
 * A context that is 100% full cannot reply. The room held back for the
 * answer is a segment like any other, not headroom left over at the end,
 * because it is the segment that gets eaten first when somebody pins four
 * more files and then wonders why replies got shorter.
 *
 * PERCENTAGES AND TOKENS, BOTH
 *
 * Tokens are the unit that runs out and the one the bill is in; per cent
 * is the only unit anybody can read off a bar. Showing one without the
 * other means either a number nobody can place or a proportion nobody can
 * act on.
 *
 * ACCESSIBILITY: the bar is a `role="img"` with an `aria-label` carrying
 * the whole breakdown in words — a screen-reader user gets the summary in
 * one string instead of a dozen unlabelled divs, and the same numbers are
 * in the legend below for anyone reading it as a list. Pin buttons are
 * `aria-pressed` toggles, so their state is real rather than implied by a
 * filled icon.
 */

import * as React from 'react'
import {
  AlertTriangle,
  CornerDownLeft,
  FileText,
  MessagesSquare,
  Pin,
  Settings2,
  Wrench,
} from 'lucide-react'

export type SegmentKind = 'system' | 'tools' | 'history' | 'retrieved' | 'reserve'

export interface ContextItem {
  id: string
  label: string
  detail: string
  tokens: number
  kind: SegmentKind
  pinned?: boolean
}

export interface DroppedItem {
  label: string
  tokens: number
  /** Why it did not make it in. Never omitted — it is the whole point. */
  reason: string
}

export interface ContextWindowBudgetProps {
  windowTokens?: number
  reserveTokens?: number
  items?: ContextItem[]
  dropped?: DroppedItem[]
  className?: string
}

const DEFAULT_ITEMS: ContextItem[] = [
  { id: 'sys', label: 'System prompt', detail: 'Agent role and house rules', tokens: 1_400, kind: 'system' },
  { id: 'tools', label: 'Tool definitions', detail: '9 tools, JSON schema', tokens: 3_100, kind: 'tools' },
  { id: 'hist', label: 'Conversation', detail: 'Last 14 turns', tokens: 8_200, kind: 'history' },
  {
    id: 'doc-1',
    label: 'refunds-policy.md',
    detail: 'Whole file · pinned by you',
    tokens: 4_800,
    kind: 'retrieved',
    pinned: true,
  },
  {
    id: 'doc-2',
    label: 'Q3-support-metrics.csv',
    detail: 'Rows 1–200 of 4,812',
    tokens: 4_400,
    kind: 'retrieved',
  },
  {
    id: 'doc-3',
    label: 'escalation-runbook.md',
    detail: '3 of 9 sections, ranked by the query',
    tokens: 2_900,
    kind: 'retrieved',
  },
]

const DEFAULT_DROPPED: DroppedItem[] = [
  {
    label: 'Q3-support-metrics.csv — rows 201–4,812',
    tokens: 96_000,
    reason: 'Too large for the window. Only the first 200 rows were sent.',
  },
  {
    label: 'contract-meridian-2024.pdf',
    tokens: 18_300,
    reason: 'Ranked 8th; seven chunks fitted. Pin it to force it in.',
  },
  {
    label: 'Conversation turns 1–6',
    tokens: 7_100,
    reason: 'Aged out of the rolling history window.',
  },
]

const KIND_LABEL: Record<SegmentKind, string> = {
  system: 'System',
  tools: 'Tools',
  history: 'Conversation',
  retrieved: 'Retrieved',
  reserve: 'Held for the reply',
}

const KIND_ICON: Record<SegmentKind, React.ComponentType<{ className?: string }>> = {
  system: Settings2,
  tools: Wrench,
  history: MessagesSquare,
  retrieved: FileText,
  reserve: CornerDownLeft,
}

/*
  The catalog's series ramp: color-mix in oklab, walking each step toward
  the card colour. These tokens are oklch(), so hsl(var(--primary)) is not
  a colour at all — the declaration is dropped and the segment renders
  invisible against the track.
*/
function rampColor(step: number, steps: number) {
  const toward = steps <= 1 ? 0 : (step / (steps - 1)) * 78
  return `color-mix(in oklab, var(--primary) ${100 - toward}%, var(--card))`
}

function compact(tokens: number) {
  return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens)
}

export function ContextWindowBudget({
  windowTokens = 32_000,
  reserveTokens = 2_200,
  items = DEFAULT_ITEMS,
  dropped = DEFAULT_DROPPED,
  className = '',
}: ContextWindowBudgetProps) {
  const [pinned, setPinned] = React.useState<string[]>(
    items.filter((i) => i.pinned).map((i) => i.id),
  )

  const used = items.reduce((sum, i) => sum + i.tokens, 0)
  /* Drawn as a segment, not as leftover space — see the note above. */
  const segments = [
    ...items,
    {
      id: 'reserve',
      label: KIND_LABEL.reserve,
      detail: 'Room the answer needs',
      tokens: reserveTokens,
      kind: 'reserve' as SegmentKind,
    },
  ]
  const committed = used + reserveTokens
  const free = Math.max(0, windowTokens - committed)
  const pct = (t: number) => (t / windowTokens) * 100

  const summary = `${compact(committed)} of ${compact(windowTokens)} tokens committed: ${segments
    .map((s) => `${s.label} ${Math.round(pct(s.tokens))}%`)
    .join(', ')}. ${compact(free)} free.`

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-foreground">Context for this reply</h2>
          <p className="text-sm text-muted-foreground">
            {/* The unit that runs out, and the unit anyone can read. */}
            <span className="tabular-nums text-foreground">{compact(committed)}</span> of{' '}
            <span className="tabular-nums">{compact(windowTokens)}</span> tokens ·{' '}
            <span className="tabular-nums">{Math.round(pct(committed))}%</span>
          </p>
        </header>

        {/* One label carrying the whole breakdown, rather than a dozen divs. */}
        <div
          role="img"
          aria-label={summary}
          className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
        >
          {segments.map((seg, i) => (
            <div
              key={seg.id}
              style={{
                width: `${pct(seg.tokens)}%`,
                background:
                  seg.kind === 'reserve'
                    ? 'color-mix(in oklab, var(--muted-foreground) 45%, var(--card))'
                    : rampColor(i, segments.length - 1),
              }}
              className="h-full first:rounded-s-full"
            />
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {segments.map((seg, i) => {
            const Icon = KIND_ICON[seg.kind]
            const isPinned = pinned.includes(seg.id)
            const canPin = seg.kind === 'retrieved'
            return (
              <li key={seg.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  style={{
                    background:
                      seg.kind === 'reserve'
                        ? 'color-mix(in oklab, var(--muted-foreground) 45%, var(--card))'
                        : rampColor(i, segments.length - 1),
                  }}
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                />
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{seg.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {seg.detail}
                  </span>
                </span>
                <span className="shrink-0 text-end text-xs tabular-nums text-muted-foreground">
                  {compact(seg.tokens)}
                  <span className="ml-1.5 text-foreground">{Math.round(pct(seg.tokens))}%</span>
                </span>
                {canPin ? (
                  <button
                    type="button"
                    aria-pressed={isPinned}
                    onClick={() =>
                      setPinned((p) =>
                        p.includes(seg.id) ? p.filter((x) => x !== seg.id) : [...p, seg.id],
                      )
                    }
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isPinned ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Pin aria-hidden className="h-3.5 w-3.5" />
                    <span className="sr-only">
                      {isPinned ? 'Unpin' : 'Pin'} {seg.label}
                    </span>
                  </button>
                ) : (
                  <span className="h-7 w-7 shrink-0" />
                )}
              </li>
            )
          })}
        </ul>

        {/* The part nobody ships. */}
        {dropped.length > 0 ? (
          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle aria-hidden className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Left out to make it fit
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The model did not see any of this. If an answer looks like it
              ignored a document, start here.
            </p>
            <ul className="mt-3 space-y-2">
              {dropped.map((d) => (
                <li key={d.label} className="flex gap-3 text-xs">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {d.label}
                    </span>
                    <span className="block text-muted-foreground">{d.reason}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {compact(d.tokens)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
