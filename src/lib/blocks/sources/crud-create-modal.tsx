'use client'

/**
 * <CrudCreateModal> — Create, in a modal, over the list it adds to.
 *
 * The modal is the right surface for a create form only when the whole form
 * fits without scrolling. That is the test, and it is worth stating because
 * the failure mode is so common: a modal that scrolls has all the costs of a
 * page — lost context, a second scrollbar, a footer that drifts — and none of
 * the benefit, which is that you can see what you are adding to behind it.
 *
 * Three or four fields is about the ceiling on a laptop. Past that,
 * `crud-create-drawer` keeps the list visible while giving the form room, and
 * `crud-create-form` gives up on the list entirely and gains a guidance rail.
 *
 * THE ROW APPEARS BEHIND THE MODAL, NOT AFTER IT CLOSES
 *
 * Submit and the record is pushed into the list underneath, highlighted,
 * while the dialog is still open. That is the entire argument for creating in
 * a modal and a surprising number of implementations throw it away by closing
 * first — at which point the user is looking at a list and hoping.
 *
 * WHY THE SCRIM IS INSIDE THE BLOCK
 *
 * This renders as a positioned overlay within its own section rather than
 * through `showModal()` and the browser's top layer. A block is a section you
 * paste into a page, and a section that hoists itself above everything on the
 * page the moment it mounts is not one. Wire it to your dialog primitive — or
 * to a native `<dialog>`, which is what `confirm-dialog` in this catalog
 * demonstrates — and you inherit the focus trap and Escape for free. What is
 * here is the layout and the copy; the two are separable on purpose.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal`, named by its own heading,
 * and the list behind is `aria-hidden` and inert to pointer events while the
 * dialog is up — the two halves of "modal" that markup can honestly claim on
 * its own. The busy state disables both buttons rather than only the primary,
 * because a cancel mid-request leaves the user unsure whether the record
 * exists.
 */

import * as React from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'

export interface CreateModalRow {
  id: string
  name: string
  owner: string
  /** Rendered highlighted — the row this dialog just added. */
  fresh?: boolean
}

export interface CrudCreateModalProps {
  title?: string
  rows?: CreateModalRow[]
  /** Whether the dialog starts open. Defaults true so the preview shows it. */
  defaultOpen?: boolean
  className?: string
}

const DEFAULT_ROWS: CreateModalRow[] = [
  { id: 'PRJ-114', name: 'Warehouse relabelling', owner: 'Rhea Patel' },
  { id: 'PRJ-113', name: 'Q4 supplier audit', owner: 'Sam Okafor' },
  { id: 'PRJ-112', name: 'Returns triage rewrite', owner: 'Jordan Lee' },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudCreateModal({
  title = 'New project',
  rows = DEFAULT_ROWS,
  defaultOpen = true,
  className = '',
}: CrudCreateModalProps) {
  // Per-instance ids: a literal id in a reusable component collides with the
  // second copy on the page, and a <label> then resolves to whichever input
  // rendered first.
  const uid = React.useId()
  const [open, setOpen] = React.useState(defaultOpen)
  const [list, setList] = React.useState<CreateModalRow[]>(rows)
  const [name, setName] = React.useState('Supplier onboarding pack')
  const [owner, setOwner] = React.useState('Rhea Patel')
  const [busy, setBusy] = React.useState(false)
  const [added, setAdded] = React.useState(0)

  function create(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    window.setTimeout(() => {
      setList((prev) => [
        {
          id: `PRJ-${115 + added}`,
          name: name.trim(),
          owner,
          fresh: true,
        },
        ...prev.map((row) => ({ ...row, fresh: false })),
      ])
      setAdded((n) => n + 1)
      setBusy(false)
      setName('')
    }, 550)
  }

  return (
    <section
      className={`relative min-h-[26rem] overflow-hidden bg-muted/30 p-4 sm:p-6 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) setOpen(false)
      }}
    >
      {/* The list the dialog adds to. Kept on screen, dimmed, and taken out
          of the accessibility tree while the dialog is up. */}
      <div
        aria-hidden={open || undefined}
        className={`mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 transition-opacity ${
          open ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Projects</h2>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Plus aria-hidden className="h-4 w-4" />
            New project
          </button>
        </div>

        <ul className="mt-4 divide-y divide-border/70">
          {list.map((row) => (
            <li
              key={row.id}
              className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors ${
                row.fresh ? 'bg-primary/10' : ''
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{row.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.id} · {row.owner}
                </span>
              </span>
              {row.fresh ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Check aria-hidden className="h-3 w-3" />
                  Added
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {open ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            aria-describedby={`${uid}-note`}
            className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
          >
            <form onSubmit={create} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {title ? (
                    <h3 id={`${uid}-title`} data-stress-ignore className="text-base font-semibold">
                      {title}
                    </h3>
                  ) : null}
                  <p id={`${uid}-note`} className="mt-1 text-sm text-muted-foreground">
                    Three fields. A modal that scrolls should have been a drawer.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor={`${uid}-name`} className="block text-sm font-medium">
                    Project name
                  </label>
                  <input
                    id={`${uid}-name`}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Returns triage rewrite"
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>

                <div>
                  <label htmlFor={`${uid}-owner`} className="block text-sm font-medium">
                    Owner
                  </label>
                  <select
                    id={`${uid}-owner`}
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  >
                    <option>Rhea Patel</option>
                    <option>Sam Okafor</option>
                    <option>Jordan Lee</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${uid}-visibility`}
                    className="block text-sm font-medium"
                  >
                    Visibility
                  </label>
                  <select id={`${uid}-visibility`} className={`mt-1.5 ${INPUT_CLASS}`}>
                    <option>Everyone in the workspace</option>
                    <option>Invite only</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {busy ? (
                    <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
                  ) : null}
                  {busy ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
