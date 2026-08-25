'use client'

/**
 * <TeamInviteStep> — the onboarding step where a product becomes multiplayer.
 *
 * <OnboardingChecklist> tracks what is left and <SetupWizard> walks a single
 * person through configuration. Neither covers the step with the highest
 * retention value in most B2B products: getting a second person into the
 * workspace. A tool one person uses is a trial; a tool three people use is
 * a purchase decision.
 *
 * WHY CHIPS AND NOT A LIST OF FIELDS
 *
 * The realistic input is a paste — three addresses out of a Slack message,
 * comma-separated, or a column out of a spreadsheet separated by newlines.
 * A form with three `<input type="email">` rows makes that person edit their
 * own clipboard. Splitting on commas, semicolons, spaces and newlines takes
 * one line and turns the paste into the whole task.
 *
 * Enter, comma and blur all commit, because people expect different ones
 * and none of them is wrong.
 *
 * INVALID ADDRESSES ARE KEPT, NOT REJECTED
 *
 * A typo'd address becomes a chip marked invalid rather than being dropped
 * or blocking the paste. Dropping it silently loses somebody who was meant
 * to be invited; blocking the whole paste for one typo makes the user redo
 * the good ones. Marked, editable by removal, and excluded from the count —
 * the invite button says how many will actually be sent.
 *
 * THE ROLE SELECT IS PER-INVITE-BATCH, NOT PER-PERSON
 *
 * Per-person roles are a settings-screen problem. At this moment everyone
 * being pasted in is usually the same kind of colleague, and a role column
 * on every chip triples the width for a distinction most teams make later.
 *
 * SKIPPING IS A REAL OPTION AND LOOKS LIKE ONE
 *
 * A greyed-out "skip" that a user has to hunt for produces invites to
 * abandoned addresses and a worse activation number than an honest skip.
 * People working alone are a legitimate case rather than a funnel leak.
 */

import * as React from 'react'
import { AlertCircle, Link2, Mail, UserPlus, X } from 'lucide-react'

export interface TeamInviteStepProps {
  heading?: string
  description?: string
  workspaceName?: string
  roles?: { value: string; label: string; hint?: string }[]
  /** Prefilled addresses, e.g. from a detected email domain. */
  initialEmails?: string[]
  inviteLink?: string
  onInvite?: (invites: { emails: string[]; role: string }) => void
  onSkip?: () => void
  className?: string
}

const DEFAULT_ROLES = [
  { value: 'member', label: 'Member', hint: 'Can build and ship. The right default.' },
  { value: 'admin', label: 'Admin', hint: 'Also manages billing and people.' },
  { value: 'viewer', label: 'Viewer', hint: 'Read-only. For stakeholders.' },
]

/*
  Deliberately loose, and the same rule the newsletter endpoint uses. A
  regex strict enough to reject every invalid address rejects valid ones
  too — plus-addressing, new TLDs, unicode domains — and the only real
  validation of an address is sending to it. This catches what is
  obviously not an address so a typo becomes visible before send.
*/
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function TeamInviteStep({
  heading = 'Bring your team in',
  description = 'Paste as many addresses as you like — commas, spaces or one per line all work.',
  workspaceName = 'Northwind',
  roles = DEFAULT_ROLES,
  initialEmails = ['priya@northwind.com'],
  inviteLink = 'https://app.example.com/join/northwind-8f31c2',
  onInvite,
  onSkip,
  className = '',
}: TeamInviteStepProps) {
  const [emails, setEmails] = React.useState<string[]>(initialEmails)
  const [draft, setDraft] = React.useState('')
  const [role, setRole] = React.useState(roles[0]?.value ?? 'member')
  const [copied, setCopied] = React.useState(false)

  /** Split a paste on every separator people actually use, and keep order. */
  function commit(raw: string) {
    const parts = raw
      .split(/[\s,;]+/)
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    setEmails((current) => [...current, ...parts.filter((p) => !current.includes(p))])
    setDraft('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
      return
    }
    /* Backspace on an empty field removes the last chip — the behaviour
       every chip input has, and its absence is felt immediately. */
    if (event.key === 'Backspace' && draft === '') {
      setEmails((current) => current.slice(0, -1))
    }
  }

  const valid = emails.filter(looksLikeEmail)
  const invalid = emails.filter((email) => !looksLikeEmail(email))
  const activeRole = roles.find((r) => r.value === role)

  return (
    <section
      aria-labelledby="team-invite-heading"
      className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step 3 of 4
        </p>
        <h2 id="team-invite-heading" className="mt-2 text-xl font-bold tracking-tight text-foreground">
          {heading}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6">
          <label htmlFor="invite-emails" className="text-sm font-medium text-foreground">
            Email addresses
          </label>

          {/* The chips and the input share one bordered box so it reads as a
              single field, and clicking anywhere in it focuses the input. */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-field bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            {emails.map((email) => {
              const ok = looksLikeEmail(email)
              return (
                <span
                  key={email}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm ${
                    ok
                      ? 'bg-muted text-foreground'
                      : 'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30'
                  }`}
                >
                  {!ok ? <AlertCircle aria-hidden className="h-3.5 w-3.5" /> : null}
                  {email}
                  <button
                    type="button"
                    onClick={() => setEmails((c) => c.filter((e) => e !== email))}
                    className="-mr-0.5 rounded p-0.5 opacity-60 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X aria-hidden className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove {email}</span>
                  </button>
                </span>
              )
            })}

            <input
              id="invite-emails"
              type="text"
              inputMode="email"
              value={draft}
              onChange={(event) => {
                /* A paste containing a separator commits immediately rather
                   than waiting for Enter, which is what people expect when
                   they drop in a whole column. */
                if (/[\s,;]/.test(event.target.value)) commit(event.target.value)
                else setDraft(event.target.value)
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => commit(draft)}
              placeholder={emails.length ? 'Add another…' : 'name@company.com'}
              className="h-8 min-w-[12rem] flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <p role="status" className="mt-2 text-xs text-muted-foreground">
            {invalid.length > 0
              ? `${invalid.length} of these ${invalid.length === 1 ? 'does not look like an address' : 'do not look like addresses'} — remove or fix ${invalid.length === 1 ? 'it' : 'them'} and the rest still send.`
              : valid.length > 0
                ? `${valid.length} ${valid.length === 1 ? 'person' : 'people'} will be invited to ${workspaceName}.`
                : 'Nobody added yet.'}
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="invite-role" className="text-sm font-medium text-foreground">
            Invite everyone as
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-2 h-9 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-64"
          >
            {roles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {activeRole?.hint ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{activeRole.hint}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={valid.length === 0}
            onClick={() => onInvite?.({ emails: valid, role })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            <UserPlus aria-hidden className="h-4 w-4" />
            {valid.length > 0
              ? `Send ${valid.length} invite${valid.length === 1 ? '' : 's'}`
              : 'Send invites'}
          </button>

          {/* An honest skip. See the note at the top. */}
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            I work alone for now
          </button>
        </div>

        {/* The other way in, for anyone whose colleagues' addresses they do
            not actually know — which is most people in a large company. */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
          <Link2 aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {inviteLink}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(inviteLink)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            }}
            className="shrink-0 text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail aria-hidden className="h-3.5 w-3.5" />
          Invites expire after 14 days and can be revoked from Settings.
        </p>
      </div>
    </section>
  )
}
