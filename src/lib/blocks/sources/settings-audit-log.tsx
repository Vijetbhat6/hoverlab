'use client'

/**
 * <SettingsAuditLog> — who changed what, filterable, and honest about
 * retention.
 *
 * The catalog already has an activity timeline and an activity feed. Both
 * are product surfaces: they tell a user what happened in their workspace.
 * An audit log is a compliance surface, and the difference is not cosmetic —
 * it is answering a question asked by somebody who does not trust the
 * answer, usually months later, usually during a security review.
 *
 * WHAT MAKES THIS AN AUDIT LOG RATHER THAN A FEED
 *
 *   - The actor is always named, and never as "you". A feed says "You
 *     removed a member"; an audit log says which account did it, from which
 *     IP, because the reader is not the actor.
 *   - Entries have before/after values, not verbs. "Changed the retention
 *     period" is useless in a review; "30 days → 365 days" is the answer.
 *   - It states its own retention window. A log that silently drops entries
 *     older than 90 days while presenting itself as complete is worse than
 *     no log, and this is the fact vendors most often omit.
 *
 * THE FILTER IS PART OF THE EVIDENCE
 *
 * When a filter is active the header says how many entries are hidden by
 * it. A reader who exports a filtered log and files it as "the log" is the
 * failure mode; naming the filtered-out count in the same line as the
 * export button is the cheapest guard against it.
 *
 * ACCESSIBILITY: the filter is a labelled `<select>` rather than a custom
 * menu, results announce through `aria-live`, and each entry is an
 * `<article>` with its timestamp in a `<time datetime>` so the machine
 * reading matches the human one.
 */

import * as React from 'react'
import { ArrowRight, Download, Info, Shield } from 'lucide-react'

export interface AuditEntry {
  id: string
  actor: string
  actorEmail: string
  action: string
  target: string
  /** ISO 8601. Rendered through `<time>` so it is machine-readable. */
  at: string
  ip: string
  before?: string
  after?: string
  category: 'access' | 'billing' | 'security' | 'data'
}

export interface SettingsAuditLogProps {
  entries?: AuditEntry[]
  /** Days of history the plan retains. Named on screen — see the header. */
  retentionDays?: number
  className?: string
}

const DEFAULT_ENTRIES: AuditEntry[] = [
  {
    id: '1',
    actor: 'Rhea Patel',
    actorEmail: 'rhea@acme.com',
    action: 'Changed log retention',
    target: 'Workspace settings',
    at: '2026-08-30T14:22:00Z',
    ip: '203.0.113.42',
    before: '90 days',
    after: '365 days',
    category: 'security',
  },
  {
    id: '2',
    actor: 'Sam Okafor',
    actorEmail: 'sam@acme.com',
    action: 'Removed member',
    target: 'jordan@acme.com',
    at: '2026-08-30T09:05:00Z',
    ip: '198.51.100.9',
    category: 'access',
  },
  {
    id: '3',
    actor: 'Rhea Patel',
    actorEmail: 'rhea@acme.com',
    action: 'Rotated API key',
    target: 'prod-ingest-key',
    at: '2026-08-29T18:40:00Z',
    ip: '203.0.113.42',
    category: 'security',
  },
  {
    id: '4',
    actor: 'Billing system',
    actorEmail: 'system',
    action: 'Changed plan',
    target: 'Acme Corp',
    at: '2026-08-28T02:00:00Z',
    ip: '—',
    before: 'Team, 24 seats',
    after: 'Studio, 40 seats',
    category: 'billing',
  },
  {
    id: '5',
    actor: 'Jordan Lee',
    actorEmail: 'jordan@acme.com',
    action: 'Exported dataset',
    target: 'customers.csv (18,402 rows)',
    at: '2026-08-27T11:13:00Z',
    ip: '192.0.2.77',
    category: 'data',
  },
]

const CATEGORY_LABEL: Record<AuditEntry['category'], string> = {
  access: 'Access',
  billing: 'Billing',
  security: 'Security',
  data: 'Data',
}

const CATEGORY_STYLE: Record<AuditEntry['category'], string> = {
  access: 'bg-muted text-muted-foreground',
  billing: 'bg-primary/10 text-primary',
  security: 'bg-destructive/10 text-destructive',
  data: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

export function SettingsAuditLog({
  entries = DEFAULT_ENTRIES,
  retentionDays = 365,
  className = '',
}: SettingsAuditLogProps) {
  const [category, setCategory] = React.useState<'all' | AuditEntry['category']>('all')

  const shown = category === 'all' ? entries : entries.filter((e) => e.category === category)
  const hidden = entries.length - shown.length

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Shield aria-hidden className="h-4 w-4 text-muted-foreground" />
              Audit log
            </h2>
            <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
              {shown.length} {shown.length === 1 ? 'entry' : 'entries'}
              {/*
                Named next to the export button on purpose. An export of a
                filtered log filed as "the log" is the failure this sentence
                exists to prevent.
              */}
              {hidden > 0 ? (
                <span className="font-medium text-foreground"> · {hidden} hidden by the filter</span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="audit-category">
              Filter by category
            </label>
            <select
              id="audit-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as 'all' | AuditEntry['category'])
              }
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download aria-hidden className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {shown.map((entry) => (
          <li key={entry.id}>
            <article className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CATEGORY_STYLE[entry.category]}`}
                >
                  {CATEGORY_LABEL[entry.category]}
                </span>
                <h3 className="text-sm font-semibold">{entry.action}</h3>
                <span className="text-sm text-muted-foreground">— {entry.target}</span>
              </div>

              {/* Before → after, where there is one. The reason a review asks. */}
              {entry.before && entry.after ? (
                <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground line-through">
                    {entry.before}
                  </span>
                  <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                    {entry.after}
                  </span>
                </p>
              ) : null}

              <p className="mt-2.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{entry.actor}</span>{' '}
                <span className="font-mono">{entry.actorEmail}</span>
                {' · '}
                <time dateTime={entry.at}>{formatWhen(entry.at)}</time>
                {' · '}
                IP <span className="font-mono">{entry.ip}</span>
              </p>
            </article>
          </li>
        ))}
      </ul>

      <p className="flex items-start gap-2 border-t border-border p-5 text-xs text-muted-foreground sm:px-6">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Entries are kept for {retentionDays} days on your plan and then deleted. Export
        before that if you need them for longer — nothing here can be recovered
        afterwards.
      </p>
    </section>
  )
}
