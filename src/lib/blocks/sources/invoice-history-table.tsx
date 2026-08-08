/**
 * <InvoiceHistoryTable> — past invoices with status and downloads.
 *
 * Money columns are `tabular-nums` and right-aligned, so the digits line up
 * into columns you can scan down. Proportional figures in a currency column
 * are the reason totals look wrong even when they are right.
 *
 * Status is a word plus a tone, never a bare coloured dot — "Failed" and
 * "Refunded" are not the same event and a red circle cannot tell them
 * apart. Each download link names its invoice in an `aria-label`, because a
 * column of links all announced as "Download" is unnavigable.
 *
 * Server component.
 */

import * as React from 'react'
import { Download, ExternalLink } from 'lucide-react'

export type InvoiceStatus = 'paid' | 'open' | 'failed' | 'refunded'

export interface Invoice {
  id: string
  number: string
  /** ISO date. */
  date: string
  description: string
  amount: string
  status: InvoiceStatus
  pdfHref?: string
}

export interface InvoiceHistoryTableProps {
  invoices?: Invoice[]
  heading?: string
  className?: string
}

const STATUS_TONE: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  open: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  failed: 'bg-destructive/15 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'Paid',
  open: 'Due',
  failed: 'Failed',
  refunded: 'Refunded',
}

const DEFAULT_INVOICES: Invoice[] = [
  { id: '1', number: 'INV-2026-0812', date: '2026-08-01', description: 'Team plan — August', amount: '$490.00', status: 'paid' },
  { id: '2', number: 'INV-2026-0745', date: '2026-07-01', description: 'Team plan — July', amount: '$490.00', status: 'paid' },
  { id: '3', number: 'INV-2026-0698', date: '2026-06-14', description: 'Additional seats (3)', amount: '$147.00', status: 'refunded' },
  { id: '4', number: 'INV-2026-0671', date: '2026-06-01', description: 'Team plan — June', amount: '$490.00', status: 'failed' },
  { id: '5', number: 'INV-2026-0602', date: '2026-05-01', description: 'Pro plan — May', amount: '$190.00', status: 'paid' },
]

function formatDate(iso: string): string {
  // Pinned to UTC — a bare `new Date('2026-08-01')` is midnight UTC and
  // renders as 31 July for anyone west of Greenwich.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function InvoiceHistoryTable({
  invoices = DEFAULT_INVOICES,
  heading = 'Invoice history',
  className = '',
}: InvoiceHistoryTableProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">{heading}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every charge on this account. PDFs are available for seven years.
          </p>
        </div>

        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Billing portal
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{heading}</caption>
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th scope="col" className="px-6 py-3 text-left font-semibold">
                Invoice
              </th>
              <th scope="col" className="px-6 py-3 text-left font-semibold">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left font-semibold">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold">
                <span className="sr-only">Download</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20"
              >
                <th scope="row" className="px-6 py-3.5 text-left font-normal">
                  <span className="block font-mono text-xs font-medium">{invoice.number}</span>
                  <span className="block text-xs text-muted-foreground">
                    {invoice.description}
                  </span>
                </th>

                <td className="px-6 py-3.5 text-muted-foreground">
                  <time dateTime={invoice.date}>{formatDate(invoice.date)}</time>
                </td>

                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[invoice.status]}`}
                  >
                    {STATUS_LABEL[invoice.status]}
                  </span>
                </td>

                <td className="px-6 py-3.5 text-right font-medium tabular-nums">
                  {invoice.amount}
                </td>

                <td className="px-6 py-3.5 text-right">
                  <a
                    href={invoice.pdfHref ?? '#'}
                    aria-label={`Download invoice ${invoice.number} as PDF`}
                    className="inline-flex rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Download aria-hidden className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
