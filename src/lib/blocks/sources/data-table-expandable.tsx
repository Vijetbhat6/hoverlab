'use client'

/**
 * <DataTableExpandable> — rows that open to reveal detail.
 *
 * The alternative to a detail drawer when the extra fields are few enough
 * to read in place. Two things worth copying rather than reinventing:
 *
 *  - The detail lives in its own <tr> with a `colSpan` covering the table,
 *    which is the only way to put a full-width panel inside a table without
 *    breaking column alignment.
 *  - The trigger carries `aria-expanded` and `aria-controls` pointing at
 *    the detail row's id. A chevron that rotates but announces nothing
 *    leaves a screen-reader user unable to tell the row opened.
 *
 * Multiple rows can be open at once — this is for comparing, and an
 * accordion that closes the row you were reading defeats the purpose.
 */

import * as React from 'react'
import { ChevronRight, Mail, Calendar, CreditCard } from 'lucide-react'

export interface ExpandableRow {
  id: string
  name: string
  email: string
  plan: string
  status: string
  joined: string
  lastPayment: string
  notes: string
}

export interface DataTableExpandableProps {
  rows?: ExpandableRow[]
  className?: string
}

const DEFAULT_ROWS: ExpandableRow[] = [
  {
    id: '1',
    name: 'Northwind Ltd',
    email: 'ops@northwind.com',
    plan: 'Team',
    status: 'Active',
    joined: '12 Mar 2024',
    lastPayment: '$490 on 1 Aug 2026',
    notes: 'Migrated from the legacy plan in June. Renewal is annual.',
  },
  {
    id: '2',
    name: 'Contoso',
    email: 'billing@contoso.io',
    plan: 'Pro',
    status: 'Active',
    joined: '3 Jan 2025',
    lastPayment: '$190 on 28 Jul 2026',
    notes: 'Requested SSO — flagged for the Team upgrade conversation.',
  },
  {
    id: '3',
    name: 'Initech',
    email: 'admin@initech.dev',
    plan: 'Pro',
    status: 'Trialing',
    joined: '22 Jul 2026',
    lastPayment: '—',
    notes: 'Trial ends 21 Aug. Two seats active out of five.',
  },
]

export function DataTableExpandable({
  rows = DEFAULT_ROWS,
  className = '',
}: DataTableExpandableProps) {
  const [open, setOpen] = React.useState<Set<string>>(() => new Set())

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th scope="col" className="w-10 px-4 py-3">
                <span className="sr-only">Expand</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Customer
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Plan
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const expanded = open.has(row.id)
              const detailId = `row-detail-${row.id}`

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={`border-b border-border/40 transition-colors ${
                      expanded ? 'bg-muted/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(row.id)}
                        aria-expanded={expanded}
                        aria-controls={detailId}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} details for ${row.name}`}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight
                          aria-hidden
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{row.email}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.plan}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.status}</td>
                  </tr>

                  {expanded ? (
                    <tr id={detailId} className="border-b border-border/40 bg-muted/10">
                      {/* Spans every column so the panel is full width without
                          disturbing the header's column widths. */}
                      <td colSpan={4} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <DetailField
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            label="Joined"
                            value={row.joined}
                          />
                          <DetailField
                            icon={<CreditCard className="h-3.5 w-3.5" />}
                            label="Last payment"
                            value={row.lastPayment}
                          />
                          <DetailField
                            icon={<Mail className="h-3.5 w-3.5" />}
                            label="Billing contact"
                            value={row.email}
                          />
                        </div>

                        <p className="mt-4 rounded-xl bg-background/60 p-3 text-sm text-muted-foreground">
                          {row.notes}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="mt-1 block text-sm">{value}</span>
    </div>
  )
}
