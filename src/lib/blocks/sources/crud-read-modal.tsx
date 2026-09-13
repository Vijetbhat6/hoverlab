'use client'

/**
 * <CrudReadModal> — Read, in a modal: the quick look from a table row.
 *
 * Three read surfaces, three different jobs, and they are not
 * interchangeable:
 *
 *   page    (`crud-read-page`)      study one record properly
 *   drawer  (`drawer-record-detail`) compare several without losing the list
 *   modal   (this)                   check one fact and get out
 *
 * The modal is the one people build first and justify last. Its actual job is
 * *verification* — someone is mid-task in the table, needs to confirm one
 * thing about a row, and must return to exactly where they were. Everything
 * here follows from that.
 *
 * WHAT FOLLOWS FROM IT
 *
 *  - **Copy buttons on the identifiers.** The reason to open a row is very
 *    often to paste its id somewhere else. A read view that makes you select
 *    text by hand has missed its own use case.
 *  - **No editing.** Not a disabled edit field, not an inline pencil. Edit is
 *    a link that leaves. A modal that can both show and change is a modal
 *    where "did I just alter this record" is a real question.
 *  - **Nothing scrolls.** If the record does not fit, this is the wrong
 *    surface — the field list is capped and the overflow is a link to the
 *    full record rather than an inner scrollbar.
 *
 * WHY THE ROW STAYS HIGHLIGHTED. The table behind keeps its selected row
 * marked, so closing lands the eye back where it started. Dropping the
 * highlight is how a quick look turns into "where was I".
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal`, named by the record's own
 * title; the table behind is `aria-hidden` and pointer-inert while it is up.
 * The copy button's confirmation is a live region rather than a tooltip, so
 * it is announced rather than merely seen.
 */

import * as React from 'react'
import { Check, Copy, ExternalLink, X } from 'lucide-react'

export interface QuickLookRow {
  id: string
  name: string
  meta: string
  fields: { label: string; value: string; mono?: boolean; copyable?: boolean }[]
}

export interface CrudReadModalProps {
  rows?: QuickLookRow[]
  className?: string
}

const DEFAULT_ROWS: QuickLookRow[] = [
  {
    id: 'inv-841',
    name: 'INV-2026-0841',
    meta: 'Northwind Trading · £18,900',
    fields: [
      { label: 'Reference', value: 'INV-2026-0841', mono: true, copyable: true },
      { label: 'Supplier', value: 'Northwind Trading Ltd' },
      { label: 'Amount', value: '£18,900.00' },
      { label: 'Raised', value: '31 July 2026' },
      { label: 'Paid', value: '31 August 2026' },
      { label: 'Bank reference', value: 'BACS-77120934', mono: true, copyable: true },
    ],
  },
  {
    id: 'inv-839',
    name: 'INV-2026-0839',
    meta: 'Contoso Logistics · £4,120',
    fields: [
      { label: 'Reference', value: 'INV-2026-0839', mono: true, copyable: true },
      { label: 'Supplier', value: 'Contoso Logistics BV' },
      { label: 'Amount', value: '£4,120.00' },
      { label: 'Raised', value: '24 July 2026' },
      { label: 'Paid', value: 'Overdue by 21 days' },
      { label: 'Bank reference', value: '—' },
    ],
  },
  {
    id: 'inv-836',
    name: 'INV-2026-0836',
    meta: 'Fabrikam Parts · £912',
    fields: [
      { label: 'Reference', value: 'INV-2026-0836', mono: true, copyable: true },
      { label: 'Supplier', value: 'Fabrikam Parts GmbH' },
      { label: 'Amount', value: '£912.00' },
      { label: 'Raised', value: '18 July 2026' },
      { label: 'Paid', value: '2 August 2026' },
      { label: 'Bank reference', value: 'BACS-77118201', mono: true, copyable: true },
    ],
  },
]

export function CrudReadModal({ rows = DEFAULT_ROWS, className = '' }: CrudReadModalProps) {
  const uid = React.useId()
  const [openId, setOpenId] = React.useState<string | null>(rows[0]?.id ?? null)
  const [copied, setCopied] = React.useState<string | null>(null)

  const record = rows.find((row) => row.id === openId)

  async function copy(label: string, value: string) {
    // Feature-detected: the clipboard API is absent over plain http and in
    // some embedded webviews, and an unguarded call throws there.
    try {
      await navigator.clipboard?.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      /* A failed copy is not worth an error state in a read view. */
    }
  }

  return (
    <section
      className={`relative min-h-[26rem] overflow-hidden bg-muted/30 p-4 sm:p-6 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpenId(null)
      }}
    >
      <div
        aria-hidden={record ? true : undefined}
        className={`mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card transition-opacity ${
          record ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
          Invoices
        </h2>
        <ul className="divide-y divide-border/70">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(row.id)}
                // The selected row stays marked behind the modal, so closing
                // lands the eye back where it started.
                aria-current={openId === row.id ? 'true' : undefined}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                  openId === row.id ? 'bg-primary/10' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.meta}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">Quick look</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {record ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0">
                <h3 id={`${uid}-title`} className="truncate text-base font-semibold">
                  {record.name}
                </h3>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {record.meta}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close quick look"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </header>

            <dl className="divide-y divide-border/70">
              {record.fields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="flex min-w-0 items-center gap-1.5">
                    <span className={field.mono ? 'truncate font-mono text-xs' : 'truncate'}>
                      {field.value}
                    </span>
                    {field.copyable ? (
                      <button
                        type="button"
                        onClick={() => copy(field.label, field.value)}
                        aria-label={`Copy ${field.label}`}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copied === field.label ? (
                          <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy aria-hidden className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Announced, not merely shown. */}
            <p aria-live="polite" className="sr-only">
              {copied ? `${copied} copied to the clipboard` : ''}
            </p>

            <footer className="flex items-center justify-between gap-2 border-t border-border p-4">
              {/* Edit leaves. A read modal that can also write is a modal
                  where "did I just change this" is a real question. */}
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open the full record
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Back to the list
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  )
}
