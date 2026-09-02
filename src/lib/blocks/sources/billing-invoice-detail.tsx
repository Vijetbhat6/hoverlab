/**
 * <BillingInvoiceDetail> — one invoice, with the arithmetic shown.
 *
 * The catalog has an invoice *history* table. It lists invoices and links
 * to nothing, because until now there was nothing to link to. This is the
 * page that link goes to, and it is the only billing surface where the
 * numbers have to reconcile against a bank statement rather than merely
 * look plausible.
 *
 * PRORATION IS THE WHOLE DIFFICULTY
 *
 * Nearly every support ticket about an invoice is a mid-cycle plan change,
 * and nearly every invoice UI renders it as one opaque line. Here the
 * credit and the charge are separate lines with their own date ranges,
 * because "why is this £41.29" is answered by seeing the eleven unused days
 * that were credited back — and by nothing else.
 *
 * TAX IS A LINE, NOT A FOOTNOTE. The rate, the jurisdiction and the
 * customer's registration number all appear, because in the EU and the UK
 * an invoice without them is not a valid invoice, and a component that
 * omits them quietly makes its user non-compliant.
 *
 * A SERVER COMPONENT. There is nothing interactive here — an invoice is a
 * record, not a form — so it ships with no `'use client'` and hydrates
 * nothing. The download button is a plain link in real use.
 *
 * ACCESSIBILITY: a real `<table>` with a `<tfoot>` carrying the totals, so
 * the summary is associated with the line items rather than floating beside
 * them; `<dl>` for the invoice metadata, which is what a description list
 * is for.
 */

import * as React from 'react'
import { Download, FileText } from 'lucide-react'

export interface InvoiceLine {
  id: string
  description: string
  /** Date range this line covers, already formatted. */
  period?: string
  quantity: number
  unitCents: number
  amountCents: number
  /** Rendered as a credit — negative amounts read badly without it. */
  credit?: boolean
}

export interface BillingInvoiceDetailProps {
  number?: string
  issuedOn?: string
  dueOn?: string
  status?: 'paid' | 'open' | 'past due'
  billedTo?: string[]
  taxLabel?: string
  taxRate?: number
  vatNumber?: string
  lines?: InvoiceLine[]
  className?: string
}

const DEFAULT_LINES: InvoiceLine[] = [
  {
    id: 'studio',
    description: 'Studio plan — 40 seats',
    period: '1 Aug – 31 Aug 2026',
    quantity: 40,
    unitCents: 1200,
    amountCents: 48_000,
  },
  {
    id: 'proration-credit',
    description: 'Unused time on Team plan',
    period: '20 Aug – 31 Aug 2026',
    quantity: 24,
    unitCents: 1200,
    amountCents: -10_320,
    credit: true,
  },
  {
    id: 'proration-charge',
    description: 'Remaining time on Studio plan',
    period: '20 Aug – 31 Aug 2026',
    quantity: 40,
    unitCents: 1200,
    amountCents: 17_200,
  },
  {
    id: 'credits',
    description: 'AI credit pack — 2,000 credits',
    quantity: 1,
    unitCents: 1500,
    amountCents: 1500,
  },
]

const money = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const STATUS_STYLE: Record<NonNullable<BillingInvoiceDetailProps['status']>, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  open: 'bg-muted text-muted-foreground',
  'past due': 'bg-destructive/10 text-destructive',
}

export function BillingInvoiceDetail({
  number = 'INV-2026-0841',
  issuedOn = '31 August 2026',
  dueOn = '14 September 2026',
  status = 'paid',
  billedTo = ['Acme Corp', '14 Bridgewater Street', 'Manchester M1 5AN', 'United Kingdom'],
  taxLabel = 'VAT (United Kingdom)',
  taxRate = 0.2,
  vatNumber = 'GB 123 4567 89',
  lines = DEFAULT_LINES,
  className = '',
}: BillingInvoiceDetailProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.amountCents, 0)
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + tax

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FileText aria-hidden className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Invoice {number}</h2>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Issued {issuedOn} · Due {dueOn}
          </p>
        </div>

        <a
          href="#"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download aria-hidden className="h-3.5 w-3.5" />
          Download PDF
        </a>
      </header>

      <div className="grid gap-6 border-b border-border p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Billed to
          </h3>
          <address className="mt-2 text-sm not-italic leading-relaxed">
            {billedTo.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Invoice number</dt>
            <dd className="font-mono">{number}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tax registration</dt>
            <dd className="font-mono">{vatNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment method</dt>
            <dd>Visa ending 4242</dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                Description
              </th>
              <th scope="col" className="px-5 py-2.5 text-end font-semibold">
                Qty
              </th>
              <th scope="col" className="px-5 py-2.5 text-end font-semibold">
                Unit
              </th>
              <th scope="col" className="px-5 py-2.5 text-end font-semibold sm:px-6">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-border/60">
                <th scope="row" className="px-5 py-3 font-medium sm:px-6">
                  {line.description}
                  {/*
                    The date range is what makes a proration line legible.
                    Without it the credit and the charge look like a
                    duplicate billing.
                  */}
                  {line.period ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {line.period}
                    </span>
                  ) : null}
                </th>
                <td className="px-5 py-3 text-end tabular-nums text-muted-foreground">
                  {line.quantity}
                </td>
                <td className="px-5 py-3 text-end tabular-nums text-muted-foreground">
                  {money(line.unitCents)}
                </td>
                <td
                  className={`px-5 py-3 text-end tabular-nums sm:px-6 ${
                    line.credit ? 'text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  {money(line.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th scope="row" colSpan={3} className="px-5 pt-4 text-end font-normal text-muted-foreground sm:px-6">
                Subtotal
              </th>
              <td className="px-5 pt-4 text-end tabular-nums sm:px-6">{money(subtotal)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={3} className="px-5 py-1.5 text-end font-normal text-muted-foreground sm:px-6">
                {taxLabel} at {(taxRate * 100).toFixed(0)}%
              </th>
              <td className="px-5 py-1.5 text-end tabular-nums sm:px-6">{money(tax)}</td>
            </tr>
            <tr className="border-t border-border">
              <th scope="row" colSpan={3} className="px-5 py-3 text-end font-semibold sm:px-6">
                Total
              </th>
              <td className="px-5 py-3 text-end text-base font-semibold tabular-nums sm:px-6">
                {money(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
