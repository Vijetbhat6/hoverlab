/**
 * <CrudReadPage> — Read, as a page: the record everything else links to.
 *
 * The R in CRUD is the one that gets built by accident. A create form is
 * obviously a form and a delete is obviously a dialog, but "show the record"
 * turns into a two-column dump of every column in the table, in schema order,
 * and stays that way for years.
 *
 * WHAT THIS ARRANGES INSTEAD
 *
 *  - **A verdict line, not a field list, at the top.** The four facts a
 *    reader came for — status, value, owner, next date — are a band above the
 *    fold. Everything else is below it. Schema order is the database's
 *    priority, not the reader's.
 *  - **Related records are first-class.** "What else is attached to this" is
 *    the question a detail page exists to answer and the one a field dump
 *    cannot. The related rail is a peer of the details, not a tab behind
 *    them.
 *  - **The trail is on the page.** Not in an audit-log screen somewhere else.
 *    "Why is this record like this" is answered by what changed and who
 *    changed it, and the answer is three items long.
 *
 * SERVER COMPONENT. There is no state here — no tabs, no disclosure, no
 * filter. A read page that hydrates is a read page paying for JavaScript it
 * never uses; the interactive cousins of this block are the drawer and the
 * modal, which have a reason.
 *
 * ACCESSIBILITY: one `<h1>`, sections named by their own headings, the fact
 * band as a `<dl>` so each label is programmatically tied to its value, and
 * the status carries a text label rather than colour alone. The action row
 * puts the destructive item last and outside the primary group.
 */

import * as React from 'react'
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react'

export interface ReadFact {
  label: string
  value: string
  note?: string
}

export interface ReadDetail {
  label: string
  value: string
  mono?: boolean
}

export interface ReadRelated {
  id: string
  kind: string
  title: string
  meta: string
}

export interface ReadEvent {
  id: string
  what: string
  who: string
  when: string
}

export interface CrudReadPageProps {
  title?: string
  subtitle?: string
  status?: { label: string; tone: 'good' | 'warn' | 'bad' }
  facts?: ReadFact[]
  details?: ReadDetail[]
  related?: ReadRelated[]
  events?: ReadEvent[]
  className?: string
}

const DEFAULT_FACTS: ReadFact[] = [
  { label: 'Contract value', value: '£248,000', note: 'Annual, indexed to CPI' },
  { label: 'Owner', value: 'Rhea Patel', note: 'Procurement' },
  { label: 'Renews', value: '1 April 2027', note: '90-day notice period' },
  { label: 'Risk tier', value: 'Tier 2', note: 'Reviewed 14 Aug 2026' },
]

const DEFAULT_DETAILS: ReadDetail[] = [
  { label: 'Supplier id', value: 'SUP-0417', mono: true },
  { label: 'Registered name', value: 'Northwind Trading Ltd' },
  { label: 'Company number', value: '09182736', mono: true },
  { label: 'Registered office', value: 'Rotterdam, Netherlands' },
  { label: 'Payment terms', value: 'Net 30' },
  { label: 'Currency', value: 'EUR' },
  { label: 'Insurance expiry', value: '30 November 2026' },
  { label: 'Data processing agreement', value: 'Signed 3 March 2026' },
]

const DEFAULT_RELATED: ReadRelated[] = [
  { id: 'po-2291', kind: 'Purchase order', title: 'PO-2291', meta: '£41,200 · Awaiting delivery' },
  { id: 'po-2264', kind: 'Purchase order', title: 'PO-2264', meta: '£18,900 · Received' },
  { id: 'inv-841', kind: 'Invoice', title: 'INV-2026-0841', meta: '£18,900 · Paid 31 Aug' },
  { id: 'rev-11', kind: 'Review', title: 'Annual supplier review', meta: 'Due 14 Feb 2027' },
]

const DEFAULT_EVENTS: ReadEvent[] = [
  { id: '1', what: 'Risk tier moved from 3 to 2', who: 'Sam Okafor', when: '14 Aug 2026' },
  { id: '2', what: 'Payment terms changed to Net 30', who: 'Rhea Patel', when: '2 Jul 2026' },
  { id: '3', what: 'Record created', who: 'Import · finance-2026', when: '11 Jan 2026' },
]

const TONE: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  bad: 'bg-destructive/10 text-destructive',
}

/*
  Per-instance id, hashed from props that differ between instances.

  A literal id is a latent duplicate the moment this block is rendered
  twice on one document -- two pages on a catalog hub, or one page using
  the section twice. `aria-labelledby` pointing at a duplicated id resolves
  to whichever element comes first, so the second copy is announced with
  the first copy's label. Server component, so no `useId`: hashing props
  gives each instance its own target and stays stable across server and
  client renders in a way a counter would not.
*/
function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export function CrudReadPage({
  title = 'Northwind Trading Ltd',
  subtitle = 'Supplier · Tier 2 · Active since January 2026',
  status = { label: 'Approved', tone: 'good' },
  facts = DEFAULT_FACTS,
  details = DEFAULT_DETAILS,
  related = DEFAULT_RELATED,
  events = DEFAULT_EVENTS,
  className = '',
}: CrudReadPageProps) {
  const uid = instanceId(title, subtitle)

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex items-center gap-1.5">
            <li>
              <a href="#" className="transition-colors hover:text-foreground">
                Suppliers
              </a>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {title}
            </li>
          </ol>
        </nav>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONE[status.tone]}`}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 aria-hidden className="h-4 w-4" />
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Raise an order
            </button>
            {/* Destructive last, and out of the primary group. */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Archive
            </button>
          </div>
        </header>

        {/* The verdict line. Four facts, above everything the schema wants. */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-card p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-1.5 text-lg font-semibold tracking-tight">{fact.value}</dd>
              {fact.note ? (
                <dd className="mt-0.5 text-xs text-muted-foreground">{fact.note}</dd>
              ) : null}
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <section aria-labelledby={`crud-read-details-${uid}`}>
              <h2 id={`crud-read-details-${uid}`} className="text-base font-semibold">
                Details
              </h2>
              <dl className="mt-3 divide-y divide-border/70 rounded-xl border border-border bg-card">
                {details.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className={row.mono ? 'font-mono text-xs' : 'font-medium'}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby={`crud-read-trail-${uid}`}>
              <h2
                id={`crud-read-trail-${uid}`}
                className="flex items-center gap-2 text-base font-semibold"
              >
                <ShieldCheck aria-hidden className="h-4 w-4 text-primary" />
                What changed
              </h2>
              <ol className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm">{event.what}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User aria-hidden className="h-3 w-3" />
                        {event.who} · {event.when}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Related records as a peer of the details, not a tab behind them. */}
          <section aria-labelledby={`crud-read-related-${uid}`}>
            <h2 id={`crud-read-related-${uid}`} className="text-base font-semibold">
              Attached to this record
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((item) => (
                <li key={item.id}>
                  <a
                    href="#"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.kind}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    </span>
                    <ExternalLink
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              <CalendarClock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The annual review is raised automatically 60 days before the
              renewal date. Nothing on this page triggers it.
            </p>
          </section>
        </div>
      </div>
    </section>
  )
}
