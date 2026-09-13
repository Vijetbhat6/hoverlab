'use client'

/**
 * <CrudDeleteCascade> — Delete, when the record is not alone.
 *
 * `confirm-dialog` in this catalog covers the general case: a destructive
 * action, a type-to-confirm guard, a verb on the button. This is the case it
 * deliberately does not cover — deleting a record that other records depend
 * on, where the honest question is not "are you sure" but "do you know what
 * else goes".
 *
 * THE FAILURE THIS PREVENTS
 *
 * A user deletes a workspace expecting to remove an empty shell and takes 41
 * documents, 6 integrations and a year of audit history with it. They were
 * asked "are you sure", they were sure, and they were wrong — because the
 * question tested their confidence rather than their knowledge.
 *
 * So the dialog leads with the dependents, counted, itemised and grouped by
 * what happens to them. Three fates, and they must be visually distinct:
 *
 *   deleted     goes with the record
 *   orphaned    survives, loses its link, becomes someone's problem later
 *   retained    kept deliberately, usually because law says so
 *
 * "Orphaned" is the one every product forgets to tell anyone about, and it is
 * the one that generates the support ticket six weeks later.
 *
 * THE ALTERNATIVE IS OFFERED, NOT BURIED
 *
 * Most people reaching a cascade dialog want the record gone, not its
 * children. Transfer and archive are offered as first-class buttons in the
 * dialog, because sending someone away to find the safer action is how they
 * end up pressing the dangerous one.
 *
 * THE GUARD SCALES WITH THE BLAST RADIUS. Under ten dependents, a plain
 * confirm. Over it, type the record's name. A type-to-confirm on every delete
 * trains people to type without reading; reserving it for the ones that
 * matter keeps it meaningful.
 *
 * ACCESSIBILITY: `role="alertdialog"` — not `dialog` — because this
 * interrupts to warn; described by the consequence summary, so a screen
 * reader hears the blast radius with the title. The confirm button is
 * disabled until the guard passes, and says what it deletes.
 */

import * as React from 'react'
import { ArchiveRestore, TriangleAlert, Unlink, UserRoundCog, X } from 'lucide-react'

export type Fate = 'deleted' | 'orphaned' | 'retained'

export interface Dependent {
  id: string
  label: string
  count: number
  fate: Fate
  note: string
}

export interface CrudDeleteCascadeProps {
  recordName?: string
  recordKind?: string
  dependents?: Dependent[]
  /** Dependents above this switch the guard to type-to-confirm. */
  guardThreshold?: number
  className?: string
}

const DEFAULT_DEPENDENTS: Dependent[] = [
  {
    id: 'docs',
    label: 'Documents',
    count: 41,
    fate: 'deleted',
    note: 'Removed with the workspace. Not recoverable after 30 days.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    count: 6,
    fate: 'deleted',
    note: 'Webhooks stop firing immediately. Third parties are not notified.',
  },
  {
    id: 'shared-links',
    label: 'Shared links',
    count: 18,
    fate: 'orphaned',
    note: 'Stay live and start returning 404. Anyone holding one sees a dead page.',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    count: 12,
    fate: 'retained',
    note: 'Kept for seven years under statutory retention. Detached from the workspace.',
  },
]

const FATE_META: Record<Fate, { label: string; className: string; icon: typeof Unlink }> = {
  deleted: {
    label: 'Deleted',
    className: 'bg-destructive/10 text-destructive',
    icon: TriangleAlert,
  },
  orphaned: {
    label: 'Orphaned',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    icon: Unlink,
  },
  retained: {
    label: 'Retained',
    className: 'bg-muted text-muted-foreground',
    icon: ArchiveRestore,
  },
}

export function CrudDeleteCascade({
  recordName = 'Rotterdam Operations',
  recordKind = 'workspace',
  dependents = DEFAULT_DEPENDENTS,
  guardThreshold = 10,
  className = '',
}: CrudDeleteCascadeProps) {
  const uid = React.useId()
  const [typed, setTyped] = React.useState('')

  const total = dependents.reduce((sum, d) => sum + d.count, 0)
  const destroyed = dependents
    .filter((d) => d.fate === 'deleted')
    .reduce((sum, d) => sum + d.count, 0)
  // The guard scales with the blast radius — see the docblock.
  const needsTyping = total > guardThreshold
  const armed = !needsTyping || typed.trim() === recordName

  return (
    <section
      className={`flex min-h-[30rem] items-center justify-center bg-muted/30 p-4 sm:p-6 ${className}`}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-summary`}
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"
            >
              <TriangleAlert className="h-5 w-5" />
            </span>
            <div>
              <h2 id={`${uid}-title`} className="text-base font-semibold">
                Delete the {recordKind} &ldquo;{recordName}&rdquo;?
              </h2>
              <p id={`${uid}-summary`} className="mt-1 text-sm text-muted-foreground">
                {total} linked records are affected. {destroyed} of them are
                deleted outright and cannot be restored after 30 days.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <ul className="divide-y divide-border/70 rounded-xl border border-border">
            {dependents.map((dependent) => {
              const meta = FATE_META[dependent.fate]
              const Icon = meta.icon
              return (
                <li key={dependent.id} className="flex gap-3 p-3">
                  <span
                    className={`mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
                  >
                    <Icon aria-hidden className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {dependent.count} {dependent.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dependent.note}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Offered here, not buried behind Cancel. */}
          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Two safer options
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserRoundCog aria-hidden className="h-3.5 w-3.5" />
                Transfer to another owner
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArchiveRestore aria-hidden className="h-3.5 w-3.5" />
                Archive instead — keeps everything, hides it
              </button>
            </div>
          </div>

          {needsTyping ? (
            <div>
              <label htmlFor={`${uid}-guard`} className="block text-sm font-medium">
                Type <span className="font-mono text-xs">{recordName}</span> to confirm
              </label>
              <input
                id={`${uid}-guard`}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${uid}-guard-note`}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p id={`${uid}-guard-note`} className="mt-1.5 text-xs text-muted-foreground">
                Asked because more than {guardThreshold} records are affected.
                Smaller deletes get a plain confirm.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-5">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!armed}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Delete {recordKind} and {destroyed} records
          </button>
        </footer>
      </div>
    </section>
  )
}
