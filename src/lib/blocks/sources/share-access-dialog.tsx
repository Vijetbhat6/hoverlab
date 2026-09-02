'use client'

/**
 * <ShareAccessDialog> — who can see this, and what the link does.
 *
 * Modals & Drawers had a destructive confirm, a cookie banner, an edit
 * panel and a filter drawer. Sharing is the modal every collaborative
 * product has and the one where a design mistake becomes a data leak
 * rather than an annoyance.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The general-access control states the consequence, not the setting.
 * "Anyone with the link" is a configuration value; "Anyone with the link
 * can view — it will not require signing in" is what is actually true, and
 * it is the sentence that stops somebody picking it for a document they
 * thought was internal. The current consequence is restated in plain words
 * under the control, always, not only when it changes.
 *
 * COPY LINK DOES NOT SILENTLY GRANT ACCESS
 *
 * The trap in this pattern: user clicks "Copy link" on a restricted
 * document, pastes it to a colleague, and the colleague hits a permission
 * wall. Some products "helpfully" widen access on copy, which is worse —
 * it silently publishes a document because somebody used the clipboard. So
 * the button copies, and when the link would not work for the recipient it
 * says so next to itself and offers the change as an explicit action.
 *
 * ROLE CHANGES ARE PER-PERSON AND IMMEDIATE
 *
 * No save button. A share dialog with unsaved state is how people close it
 * believing they revoked someone. Each select applies on change, which is
 * also why removing is a separate destructive-styled item in the same menu
 * rather than a stray X that can be mis-clicked.
 *
 * THE OWNER CANNOT BE DEMOTED HERE
 *
 * Rendered as text rather than a disabled select. A greyed control invites
 * people to try, and then to look for the workaround; a plain "Owner"
 * says the transfer lives somewhere else.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal`, labelled by its own
 * heading. Every per-person select is labelled with the person's name, so
 * a screen reader hears "Tom Okafor, permission, Editor" rather than five
 * identical "permission" comboboxes.
 */

import * as React from 'react'
import { Check, Copy, Globe, Link2, Lock, Users } from 'lucide-react'

export type GeneralAccess = 'restricted' | 'organisation' | 'public'

export interface SharePerson {
  name: string
  email: string
  initials: string
  role: 'owner' | 'editor' | 'commenter' | 'viewer'
}

export interface ShareAccessDialogProps {
  documentName?: string
  organisationName?: string
  people?: SharePerson[]
  link?: string
  access?: GeneralAccess
  className?: string
}

const DEFAULT_PEOPLE: SharePerson[] = [
  { name: 'Priya Raman', email: 'priya@northwind.com', initials: 'PR', role: 'owner' },
  { name: 'Tom Okafor', email: 'tom@northwind.com', initials: 'TO', role: 'editor' },
  { name: 'Ines Duarte', email: 'ines@contractor.io', initials: 'ID', role: 'commenter' },
]

const ROLE_LABELS: Record<SharePerson['role'], string> = {
  owner: 'Owner',
  editor: 'Editor',
  commenter: 'Commenter',
  viewer: 'Viewer',
}

/*
  Consequences, not settings. Each option says what will actually be true
  of the document if it is chosen.
*/
const ACCESS_COPY: Record<
  GeneralAccess,
  { label: string; consequence: string; icon: React.ComponentType<{ className?: string }> }
> = {
  restricted: {
    label: 'Restricted',
    consequence:
      'Only the people listed below can open it. Anyone else following the link is asked to request access.',
    icon: Lock,
  },
  organisation: {
    label: 'Anyone at Northwind',
    consequence:
      'Anyone signed in with a Northwind account can open it, including people who join later.',
    icon: Users,
  },
  public: {
    label: 'Anyone with the link',
    consequence:
      'Anyone who has the link can open it without signing in, and can pass it on. It may be indexed by search engines.',
    icon: Globe,
  },
}

export function ShareAccessDialog({
  documentName = 'Q4 pricing model',
  organisationName = 'Northwind',
  people = DEFAULT_PEOPLE,
  link = 'https://app.example.com/d/q4-pricing-model',
  access = 'restricted',
  className = '',
}: ShareAccessDialogProps) {
  const [general, setGeneral] = React.useState<GeneralAccess>(access)
  const [roles, setRoles] = React.useState(() =>
    Object.fromEntries(people.map((p) => [p.email, p.role])),
  )
  const [copied, setCopied] = React.useState(false)
  // The refusal path needs its own state: a button that silently does
  // nothing is the failure mode this replaced.
  const [failed, setFailed] = React.useState(false)

  const copy = ACCESS_COPY[general]
  const Icon = copy.icon
  /* The honest warning that replaces silently widening access on copy. */
  const linkIsPrivate = general === 'restricted'

  return (
    <section className={`mx-auto w-full max-w-lg px-4 py-16 sm:px-6 ${className}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-heading"
        className="rounded-2xl border border-border bg-card shadow-lg"
      >
        <header className="border-b border-border px-5 py-4">
          <h2 id="share-heading" className="truncate text-base font-semibold text-foreground">
            Share &ldquo;{documentName}&rdquo;
          </h2>
        </header>

        <div className="px-5 py-4">
          <label className="block">
            <span className="sr-only">Invite by email</span>
            <input
              type="email"
              placeholder="Add people by email"
              className="h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </label>

          <ul className="mt-4 space-y-3">
            {people.map((person) => {
              const role = roles[person.email] ?? person.role
              const selectId = `share-role-${person.email.replace(/\W+/g, '-')}`
              return (
                <li key={person.email} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                  >
                    {person.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {person.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.email}
                    </span>
                  </span>

                  {person.role === 'owner' ? (
                    /* Text, not a disabled control — see the note above. */
                    <span className="shrink-0 pe-3 text-sm text-muted-foreground">
                      Owner
                    </span>
                  ) : (
                    <>
                      <label htmlFor={selectId} className="sr-only">
                        Permission for {person.name}
                      </label>
                      <select
                        id={selectId}
                        value={role}
                        onChange={(event) =>
                          setRoles((current) => ({
                            ...current,
                            [person.email]: event.target.value as SharePerson['role'],
                          }))
                        }
                        className="h-8 shrink-0 rounded-lg border border-field bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <option value="editor">{ROLE_LABELS.editor}</option>
                        <option value="commenter">{ROLE_LABELS.commenter}</option>
                        <option value="viewer">{ROLE_LABELS.viewer}</option>
                        <option value="remove">Remove access</option>
                      </select>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="border-t border-border px-5 py-4">
          <h3 className="text-sm font-medium text-foreground">General access</h3>

          <div className="mt-2 flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Icon className="h-4 w-4" />
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Who can open this document</span>
              <select
                value={general}
                onChange={(event) => setGeneral(event.target.value as GeneralAccess)}
                className="h-8 w-full rounded-lg border border-field bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="restricted">{ACCESS_COPY.restricted.label}</option>
                <option value="organisation">Anyone at {organisationName}</option>
                <option value="public">{ACCESS_COPY.public.label}</option>
              </select>
            </label>
          </div>

          {/* Always shown, not only on change. */}
          <p role="status" className="mt-2 text-sm text-muted-foreground">
            {copy.consequence}
          </p>
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => {
              /*
               * Confirm on success, not on click.
               *
               * The clipboard API rejects for reasons a component cannot
               * predict — permission denied, an insecure origin, a
               * document that is not focused. The previous version fired
               * the write and set "Link copied" unconditionally, so a
               * refused write showed a tick and an unhandled rejection in
               * the console while the clipboard still held whatever was
               * there before.
               */
              navigator.clipboard
                ?.writeText(link)
                .then(() => {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => {
                  setFailed(true)
                  window.setTimeout(() => setFailed(false), 3000)
                })
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copied ? (
              <Check aria-hidden className="h-4 w-4" />
            ) : (
              <Link2 aria-hidden className="h-4 w-4" />
            )}
            {copied ? 'Link copied' : failed ? 'Copy blocked' : 'Copy link'}
          </button>

          <button
            type="button"
            className="ms-auto inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Done
          </button>

          {/*
            Said, never done silently. Copying must not widen access — that
            would publish a document because somebody used the clipboard.
          */}
          {linkIsPrivate ? (
            <p className="w-full text-xs text-muted-foreground">
              <Copy aria-hidden className="me-1 inline h-3 w-3" />
              This link only works for the people listed above. Anyone else will
              have to request access — change General access if you meant to
              share it more widely.
            </p>
          ) : null}
        </footer>
      </div>
    </section>
  )
}
