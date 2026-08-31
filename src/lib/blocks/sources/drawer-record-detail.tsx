'use client'

/**
 * <DrawerRecordDetail> — one record beside the list it came from.
 *
 * The catalog has a slide-over panel, which is the mechanism. This is the
 * pattern built on it: the record inspector that a table grows the moment
 * someone needs to check three rows in a row without losing their place in
 * the list.
 *
 * WHY NOT A DETAIL PAGE
 *
 * Because the job is comparison, not study. A page swaps context, loses the
 * scroll position and the selection, and makes checking four accounts a
 * four-navigation task. A drawer keeps the list on screen — which is why
 * the previous/next control at the top is not a nicety: moving between
 * records without closing is the entire reason this shape exists.
 *
 * THE PART THAT IS USUALLY MISSING
 *
 * Most inspectors show fields. The useful ones show fields *and* the
 * record's recent history, because "why is this account like this" is
 * answered by what changed, not by the current values. The tabs here are
 * Details and Activity for that reason, and Activity is not an afterthought
 * pushed below the fold.
 *
 * WIDTH IS CONSTRAINED, NOT FULL-BLEED. A drawer that covers the list
 * defeats itself. It caps at 28rem and goes full width only below the
 * breakpoint where the list is not visible anyway.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal="false"` — this one is
 * deliberately non-modal, because the list behind it stays usable and
 * claiming modality would lie to a screen reader. Tabs are a real tablist;
 * Escape closes; the heading is the accessible name.
 */

import * as React from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Pencil, X } from 'lucide-react'

export interface RecordField {
  label: string
  value: string
  /** Rendered in a monospace face — ids, keys, addresses. */
  mono?: boolean
}

export interface RecordEvent {
  id: string
  what: string
  who: string
  when: string
}

export interface DetailRecord {
  id: string
  title: string
  subtitle: string
  status: 'active' | 'trialing' | 'past due'
  fields: RecordField[]
  events: RecordEvent[]
}

export interface DrawerRecordDetailProps {
  records?: DetailRecord[]
  className?: string
}

const DEFAULT_RECORDS: DetailRecord[] = [
  {
    id: 'acme',
    title: 'Acme Corp',
    subtitle: 'Studio · 40 seats',
    status: 'active',
    fields: [
      { label: 'Account ID', value: 'acct_7Hn2Kq91', mono: true },
      { label: 'Owner', value: 'Rhea Patel' },
      { label: 'Plan', value: 'Studio (annual)' },
      { label: 'Renews', value: '1 August 2027' },
      { label: 'ARR', value: '$48,000' },
      { label: 'Region', value: 'United Kingdom' },
    ],
    events: [
      { id: '1', what: 'Upgraded from Team to Studio', who: 'Rhea Patel', when: '20 Aug 2026' },
      { id: '2', what: 'Added 16 seats', who: 'Rhea Patel', when: '20 Aug 2026' },
      { id: '3', what: 'Invoice INV-2026-0841 paid', who: 'Billing system', when: '31 Aug 2026' },
    ],
  },
  {
    id: 'globex',
    title: 'Globex',
    subtitle: 'Pro · 8 seats',
    status: 'trialing',
    fields: [
      { label: 'Account ID', value: 'acct_2Bd8Xr40', mono: true },
      { label: 'Owner', value: 'Jordan Lee' },
      { label: 'Plan', value: 'Pro (trial)' },
      { label: 'Trial ends', value: '12 September 2026' },
      { label: 'ARR', value: '—' },
      { label: 'Region', value: 'Germany' },
    ],
    events: [
      { id: '1', what: 'Started a 30-day trial', who: 'Jordan Lee', when: '13 Aug 2026' },
      { id: '2', what: 'Invited 6 teammates', who: 'Jordan Lee', when: '14 Aug 2026' },
    ],
  },
  {
    id: 'initech',
    title: 'Initech',
    subtitle: 'Studio · 51 seats',
    status: 'past due',
    fields: [
      { label: 'Account ID', value: 'acct_9Kp4Lm22', mono: true },
      { label: 'Owner', value: 'Sam Okafor' },
      { label: 'Plan', value: 'Studio (monthly)' },
      { label: 'Renews', value: 'Payment failed' },
      { label: 'ARR', value: '$61,200' },
      { label: 'Region', value: 'United States' },
    ],
    events: [
      { id: '1', what: 'Payment failed — card expired', who: 'Billing system', when: '28 Aug 2026' },
      { id: '2', what: 'Dunning email sent (1 of 3)', who: 'Billing system', when: '29 Aug 2026' },
    ],
  },
]

const STATUS_STYLE: Record<DetailRecord['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  trialing: 'bg-primary/10 text-primary',
  'past due': 'bg-destructive/10 text-destructive',
}

export function DrawerRecordDetail({
  records = DEFAULT_RECORDS,
  className = '',
}: DrawerRecordDetailProps) {
  const [index, setIndex] = React.useState(0)
  const [tab, setTab] = React.useState<'details' | 'activity'>('details')
  const [open, setOpen] = React.useState(true)

  const record = records[index]

  return (
    <div
      className={`relative flex min-h-[30rem] gap-4 overflow-hidden rounded-2xl bg-muted/30 p-4 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      {/* The list stays on screen — the whole argument for a drawer. */}
      <ul className="hidden min-w-0 flex-1 space-y-1.5 sm:block">
        {records.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                setIndex(i)
                setOpen(true)
              }}
              aria-current={open && i === index ? 'true' : undefined}
              className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                open && i === index
                  ? 'border-primary bg-card'
                  : 'border-border bg-card/50 hover:bg-card'
              }`}
            >
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          role="dialog"
          // Non-modal on purpose: the list behind stays usable, and claiming
          // aria-modal here would be a lie to assistive tech.
          aria-modal="false"
          aria-labelledby="record-title"
          className="flex w-full flex-col rounded-xl border border-border bg-card text-card-foreground sm:w-[28rem] sm:shrink-0"
        >
          <header className="border-b border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="record-title" className="truncate text-base font-semibold">
                    {record.title}
                  </h2>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[record.status]}`}
                  >
                    {record.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{record.subtitle}</p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {/* Moving between records without closing. */}
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  aria-label="Previous record"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronUp aria-hidden className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(records.length - 1, i + 1))}
                  disabled={index === records.length - 1}
                  aria-label="Next record"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDown aria-hidden className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close record"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div role="tablist" aria-label="Record sections" className="mt-4 flex gap-1">
              {(['details', 'activity'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`record-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`record-panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    tab === id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'details' ? (
              <dl
                id="record-panel-details"
                role="tabpanel"
                aria-labelledby="record-tab-details"
                className="space-y-3"
              >
                {record.fields.map((field) => (
                  <div key={field.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className={`text-right ${field.mono ? 'font-mono text-xs' : ''}`}>
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <ol
                id="record-panel-activity"
                role="tabpanel"
                aria-labelledby="record-tab-activity"
                className="space-y-4"
              >
                {record.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm">{event.what}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.who} · {event.when}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <footer className="flex items-center gap-2 border-t border-border p-4">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </button>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open full record
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </footer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reopen the inspector
          </button>
        </div>
      )}
    </div>
  )
}
