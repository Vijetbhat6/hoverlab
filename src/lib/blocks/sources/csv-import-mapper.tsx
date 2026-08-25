'use client'

/**
 * <CsvImportMapper> — the screen between "file uploaded" and "data imported".
 *
 * Every product that accepts a spreadsheet needs this and almost nobody
 * ships a good one. <FileDropzone> ends at "customers.csv, 2.4 MB, done",
 * which is the moment the actual problem starts: the file's columns are
 * named whatever the person exporting them called them, and none of those
 * names are yours.
 *
 * The three failure modes this is shaped against, in the order they bite:
 *
 *   Importing silently into the wrong field. "Name" mapped to `company`
 *   because it sorted first, and nobody notices until a mail merge greets
 *   four hundred people by their employer. Every mapping here shows a real
 *   value from row one underneath it, because a column header is a guess
 *   and a sample is evidence.
 *
 *   Discovering a required field is missing after the import runs. The
 *   summary bar is live and blocking: the button says how many required
 *   fields are still unmapped and stays disabled until none are.
 *
 *   Duplicate mapping. Two source columns pointed at `email` is not a
 *   validation error anyone expects, so it is caught here — picking a
 *   destination that is already taken releases it from the other row rather
 *   than refusing the choice, because refusing means the user has to
 *   remember which row to go and clear first.
 *
 * `skip` is a first-class destination, not an absence. A real export has
 * columns you do not want, and leaving them "unmapped" makes the unmapped
 * count meaningless — it can no longer distinguish "not dealt with yet"
 * from "deliberately ignored", which is the whole job of that counter.
 *
 * Accessibility: each select is labelled by its source column name, so a
 * screen reader hears "Full Name, mapping" rather than twelve identical
 * "select" announcements. The blocking summary is a `role="status"` so the
 * count is heard as it changes, not just seen.
 */

import * as React from 'react'
import { AlertTriangle, ArrowRight, Check, FileSpreadsheet, X } from 'lucide-react'

/** A column found in the uploaded file. */
export interface SourceColumn {
  /** The header as it appears in the file. */
  header: string
  /** Values from the first rows, shown as evidence under the mapping. */
  samples: string[]
}

/** A field in the destination schema. */
export interface TargetField {
  key: string
  label: string
  required?: boolean
  /** Shown when the field is selected — the format the importer expects. */
  hint?: string
}

export interface CsvImportMapperProps {
  fileName?: string
  rowCount?: number
  columns?: SourceColumn[]
  fields?: TargetField[]
  /** Pre-filled mapping, source header → target key. */
  initialMapping?: Record<string, string>
  onImport?: (mapping: Record<string, string>) => void
  className?: string
}

/** The destination that means "do not import this column". */
const SKIP = '__skip__'

const DEFAULT_COLUMNS: SourceColumn[] = [
  { header: 'Full Name', samples: ['Ada Lovelace', 'Grace Hopper'] },
  { header: 'Work Email', samples: ['ada@analytical.co', 'grace@navy.mil'] },
  { header: 'Company', samples: ['Analytical Engines', 'US Navy'] },
  { header: 'Phone', samples: ['+44 20 7946 0958', '+1 202 555 0114'] },
  { header: 'Signed Up', samples: ['2026-03-14', '2026-04-02'] },
  { header: 'Internal Notes', samples: ['do not contact', ''] },
]

const DEFAULT_FIELDS: TargetField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true, hint: 'One address per row' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone', hint: 'E.164 preferred; other formats are parsed' },
  { key: 'created_at', label: 'Created at', hint: 'ISO 8601 or YYYY-MM-DD' },
]

const DEFAULT_MAPPING: Record<string, string> = {
  'Full Name': 'name',
  'Work Email': 'email',
  Company: 'company',
  'Internal Notes': SKIP,
}

export function CsvImportMapper({
  fileName = 'customers-export.csv',
  rowCount = 1284,
  columns = DEFAULT_COLUMNS,
  fields = DEFAULT_FIELDS,
  initialMapping = DEFAULT_MAPPING,
  onImport,
  className = '',
}: CsvImportMapperProps) {
  const [mapping, setMapping] = React.useState<Record<string, string>>(initialMapping)

  /*
    Assigning a destination releases it from whichever column held it.

    The alternative — refusing the selection — is technically clearer and
    much worse to use: it makes the person remember which of twelve rows
    already claimed `email`, scroll to it, clear it, and come back. Moving
    it is what they meant.
  */
  function assign(header: string, target: string) {
    setMapping((current) => {
      const next: Record<string, string> = {}
      for (const [key, value] of Object.entries(current)) {
        if (value === target && target !== SKIP && key !== header) continue
        next[key] = value
      }
      next[header] = target
      return next
    })
  }

  const missingRequired = fields.filter(
    (field) => field.required && !Object.values(mapping).includes(field.key),
  )
  const mappedCount = Object.values(mapping).filter((v) => v && v !== SKIP).length
  const ready = missingRequired.length === 0

  return (
    <section
      aria-labelledby="csv-mapper-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <FileSpreadsheet aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <h2 id="csv-mapper-heading" className="truncate text-sm font-semibold text-foreground">
              {fileName}
            </h2>
            <p className="text-xs text-muted-foreground">
              {rowCount.toLocaleString('en-US')} rows · {columns.length} columns found
            </p>
          </div>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
            Step 2 of 3
          </span>
        </header>

        <div className="divide-y divide-border/60">
          {columns.map((column) => {
            const value = mapping[column.header] ?? ''
            const skipped = value === SKIP
            const field = fields.find((f) => f.key === value)
            const selectId = `csv-map-${column.header.replace(/\W+/g, '-').toLowerCase()}`

            return (
              <div
                key={column.header}
                className="grid grid-cols-1 items-start gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-5"
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-medium ${
                      skipped ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {column.header}
                  </p>
                  {/* Evidence, not decoration — see the note at the top. An
                      empty first cell is shown as "empty" rather than as
                      nothing, because a blank sample and a missing sample
                      mean very different things about the file. */}
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {column.samples[0]?.trim()
                      ? column.samples[0]
                      : <span className="italic">empty</span>}
                    {column.samples[1]?.trim() ? ` · ${column.samples[1]}` : ''}
                  </p>
                </div>

                <ArrowRight
                  aria-hidden
                  className="hidden h-4 w-4 shrink-0 self-center text-muted-foreground sm:block"
                />

                <div className="min-w-0">
                  <label htmlFor={selectId} className="sr-only">
                    Destination field for {column.header}
                  </label>
                  <select
                    id={selectId}
                    value={value}
                    onChange={(event) => assign(column.header, event.target.value)}
                    className="h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <option value="">Choose a field…</option>
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                        {f.required ? ' (required)' : ''}
                      </option>
                    ))}
                    <option value={SKIP}>Do not import</option>
                  </select>
                  {field?.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-4">
          {/* Live, because the count changes as they work and a blocked
              button with no audible reason is the classic dead end. */}
          <p role="status" className="flex items-center gap-2 text-sm">
            {ready ? (
              <>
                <Check aria-hidden className="h-4 w-4 text-foreground" />
                <span className="text-muted-foreground">
                  {mappedCount} column{mappedCount === 1 ? '' : 's'} mapped, everything
                  required is covered
                </span>
              </>
            ) : (
              <>
                <AlertTriangle aria-hidden className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">
                  Still needed:{' '}
                  <span className="font-medium text-foreground">
                    {missingRequired.map((f) => f.label).join(', ')}
                  </span>
                </span>
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X aria-hidden className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => onImport?.(mapping)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
            >
              Import {rowCount.toLocaleString('en-US')} rows
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}
