'use client'

/**
 * <CrudUpdateDrawer> — Update, in a drawer, one field at a time.
 *
 * The third edit surface, and the only one of the three with a different
 * *save model* rather than a different width. The page form and the modal
 * both collect changes and write them together. This writes each field on
 * blur, the way Linear, Notion and every modern issue tracker does.
 *
 * WHY PER-FIELD SAVING IS RIGHT HERE AND WRONG ELSEWHERE
 *
 * It is right when the record is a bag of independent attributes — a status,
 * an assignee, a due date — where no two fields have to change together and
 * a half-applied edit is a perfectly valid state. It is wrong when they do:
 * an address whose street saves and whose postcode does not is a broken
 * address, and that record wants `crud-update-form` and one transaction.
 *
 * So the model is a decision about the data, not a fashion. This block picks
 * the first case and says so on the panel, because a drawer with no Save
 * button is otherwise a drawer that looks unfinished.
 *
 * WHAT PER-FIELD SAVING OWES THE USER
 *
 *  - **Per-field feedback.** A tick beside the field that just wrote, for a
 *    couple of seconds. Without it there is no moment at which the user knows
 *    the change persisted.
 *  - **Per-field failure.** One field can fail while the others succeed, so
 *    the error lives on the field and offers a retry there — a global banner
 *    cannot say which value did not land.
 *  - **An undo that is not Ctrl-Z.** Every write is listed in the panel's
 *    footer with the previous value, newest first, because "what did I just
 *    change" has no other answer when there was never a Save.
 *
 * ACCESSIBILITY: each field's state is announced through a polite live region
 * scoped to that field, not one shared region that would read the last write
 * over the top of the current one. Escape closes; the list behind stays
 * usable, so `aria-modal` is honestly `false`.
 */

import * as React from 'react'
import { Check, Loader2, RotateCcw, TriangleAlert, X } from 'lucide-react'

export type FieldState = 'rest' | 'saving' | 'saved' | 'failed'

export interface LiveField {
  id: string
  label: string
  type?: 'text' | 'select' | 'date'
  options?: string[]
  value: string
  /** Set on one field to demonstrate a per-field failure. */
  failsOnce?: boolean
}

export interface CrudUpdateDrawerProps {
  title?: string
  subtitle?: string
  fields?: LiveField[]
  className?: string
}

const DEFAULT_FIELDS: LiveField[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: ['Triage', 'In progress', 'Blocked', 'Done'],
    value: 'In progress',
  },
  {
    id: 'assignee',
    label: 'Assignee',
    type: 'select',
    options: ['Rhea Patel', 'Sam Okafor', 'Jordan Lee', 'Unassigned'],
    value: 'Sam Okafor',
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'select',
    options: ['Urgent', 'High', 'Medium', 'Low'],
    value: 'High',
  },
  { id: 'due', label: 'Due', type: 'date', value: '2026-09-30' },
  { id: 'estimate', label: 'Estimate', value: '3 days', failsOnce: true },
  { id: 'labels', label: 'Labels', value: 'returns, warehouse' },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

interface WriteLog {
  key: number
  label: string
  from: string
  to: string
}

export function CrudUpdateDrawer({
  title = 'RET-118 · Exchange arrives damaged',
  subtitle = 'Returns · Rotterdam DC',
  fields = DEFAULT_FIELDS,
  className = '',
}: CrudUpdateDrawerProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(true)
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.value])),
  )
  const [states, setStates] = React.useState<Record<string, FieldState>>({})
  const [failedOnce, setFailedOnce] = React.useState<Record<string, boolean>>({})
  const [log, setLog] = React.useState<WriteLog[]>([])
  const counter = React.useRef(0)

  function write(field: LiveField, next: string) {
    const from = values[field.id] ?? ''
    if (from === next) return
    setValues((v) => ({ ...v, [field.id]: next }))
    setStates((s) => ({ ...s, [field.id]: 'saving' }))

    window.setTimeout(() => {
      const shouldFail = field.failsOnce && !failedOnce[field.id]
      if (shouldFail) {
        setFailedOnce((f) => ({ ...f, [field.id]: true }))
        setStates((s) => ({ ...s, [field.id]: 'failed' }))
        return
      }
      setStates((s) => ({ ...s, [field.id]: 'saved' }))
      counter.current += 1
      setLog((l) => [{ key: counter.current, label: field.label, from, to: next }, ...l].slice(0, 5))
      window.setTimeout(
        () => setStates((s) => ({ ...s, [field.id]: 'rest' })),
        1800,
      )
    }, 600)
  }

  function undo(entry: WriteLog) {
    const field = fields.find((f) => f.label === entry.label)
    if (!field) return
    setValues((v) => ({ ...v, [field.id]: entry.from }))
    setLog((l) => l.filter((e) => e.key !== entry.key))
  }

  return (
    <section
      className={`flex min-h-[32rem] gap-4 overflow-hidden bg-muted/30 p-4 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <div className="hidden min-w-0 flex-1 sm:block">
        <h2 className="text-sm font-semibold">Returns queue</h2>
        <ul className="mt-3 space-y-1.5">
          {['RET-118 · Exchange arrives damaged', 'RET-117 · Wrong size sent', 'RET-115 · Refund not received', 'RET-112 · Missing accessory'].map(
            (row, i) => (
              <li
                key={row}
                className={`truncate rounded-lg border px-3 py-2.5 text-sm ${
                  i === 0 ? 'border-primary bg-card' : 'border-border bg-card/60'
                }`}
              >
                {row}
              </li>
            ),
          )}
        </ul>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${uid}-title`}
          className="flex w-full flex-col rounded-xl border border-border bg-card text-card-foreground sm:w-[28rem] sm:shrink-0"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div className="min-w-0">
              <h2 id={`${uid}-title`} className="truncate text-base font-semibold">
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </header>

          <p className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            Each field saves on its own. There is no Save button because these
            attributes do not depend on each other.
          </p>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {fields.map((field) => {
              const id = `${uid}-${field.id}`
              const state = states[field.id] ?? 'rest'
              return (
                <div key={field.id}>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={id} className="text-sm font-medium">
                      {field.label}
                    </label>
                    {/* Scoped to the field, so a later write does not read
                        over the top of this one. */}
                    <span
                      aria-live="polite"
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      {state === 'saving' ? (
                        <>
                          <Loader2 aria-hidden className="h-3 w-3 motion-safe:animate-spin" />
                          Saving
                        </>
                      ) : null}
                      {state === 'saved' ? (
                        <>
                          <Check aria-hidden className="h-3 w-3 text-emerald-600" />
                          Saved
                        </>
                      ) : null}
                      {state === 'failed' ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <TriangleAlert aria-hidden className="h-3 w-3" />
                          Not saved
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {field.type === 'select' ? (
                    <select
                      id={id}
                      value={values[field.id] ?? ''}
                      onChange={(e) => write(field, e.target.value)}
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type={field.type === 'date' ? 'date' : 'text'}
                      defaultValue={values[field.id] ?? ''}
                      onBlur={(e) => write(field, e.target.value)}
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    />
                  )}

                  {state === 'failed' ? (
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-destructive">
                      The write timed out.
                      <button
                        type="button"
                        onClick={() => write(field, values[field.id] ?? '')}
                        className="rounded font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Retry {field.label}
                      </button>
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* The only answer to "what did I just change" when there was no Save. */}
          <footer className="border-t border-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Written in this session
            </h3>
            {log.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Nothing yet. Change a field and it writes on blur.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {log.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-muted-foreground">{entry.label}:</span>{' '}
                      <span className="line-through">{entry.from || '—'}</span> →{' '}
                      <span className="font-medium">{entry.to || '—'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => undo(entry)}
                      className="inline-flex shrink-0 items-center gap-1 rounded px-1 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw aria-hidden className="h-3 w-3" />
                      Undo
                      <span className="sr-only"> {entry.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </footer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reopen the drawer
          </button>
        </div>
      )}
    </section>
  )
}
