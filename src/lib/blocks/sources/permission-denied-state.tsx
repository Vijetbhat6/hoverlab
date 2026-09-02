/**
 * <PermissionDeniedState> — 403, and a way out of it.
 *
 * The catalog had 404 and a generic error retry. Neither fits this: a 404
 * says the thing is not there, and a retry button on a permissions failure
 * is actively misleading, because pressing it a second time will fail in
 * exactly the same way. This is the state where the page exists, the user
 * is signed in, and they are simply not allowed — which is a different
 * problem with a different exit.
 *
 * THE EXIT IS THE POINT
 *
 * Most 403 screens are a locked padlock and an apology, which leaves the
 * person to work out who to ask and how to ask them. The useful version
 * names the resource, names the people who can grant access, and sends the
 * request for them. "Ask an admin" is not an exit; a button that messages
 * a named admin is.
 *
 * WHY THE OWNERS ARE NAMED AND SHOWN
 *
 * Two reasons. It turns an abstract permission wall into a person, which
 * is how the request actually gets granted. And it prevents the second
 * most common outcome, where someone emails the wrong colleague and waits
 * two days.
 *
 * WHAT IT DELIBERATELY DOES NOT SAY
 *
 * It does not describe what is inside. A 403 that leaks the document title,
 * the row count or the project's description has disclosed the thing it was
 * protecting — the classic information-leak in an access-control screen.
 * The identifier is shown because the user typed or followed it and
 * already has it; nothing else is.
 *
 * It also does not offer a retry, and does not pretend a refresh might
 * work. Access granted elsewhere needs a reload, which is what the small
 * note at the bottom says once, plainly.
 *
 * Server component — nothing here has state.
 */

import type * as React from 'react'
import { Lock, Mail, ArrowLeft } from 'lucide-react'

export interface AccessOwner {
  name: string
  role: string
  /** Initials for the avatar. No images: this renders with no network. */
  initials: string
}

export interface PermissionDeniedStateProps {
  /** What they tried to open, as they would recognise it. Never its contents. */
  resourceLabel?: string
  signedInAs?: string
  owners?: AccessOwner[]
  requestHref?: string
  backHref?: string
  className?: string
}

const DEFAULT_OWNERS: AccessOwner[] = [
  { name: 'Priya Raman', role: 'Workspace admin', initials: 'PR' },
  { name: 'Tom Okafor', role: 'Project owner', initials: 'TO' },
]

export function PermissionDeniedState({
  resourceLabel = 'northwind / billing-service',
  signedInAs = 'you@company.com',
  owners = DEFAULT_OWNERS,
  requestHref = '#',
  backHref = '#',
  className = '',
}: PermissionDeniedStateProps) {
  return (
    <section
      aria-labelledby="denied-heading"
      className={`mx-auto flex w-full max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6 ${className}`}
    >
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Lock className="h-5 w-5" />
      </span>

      <h1 id="denied-heading" className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        You do not have access to this
      </h1>

      <p className="mt-3 text-balance text-sm text-muted-foreground">
        The page exists and you are signed in — your account just is not on the
        list for it. Nothing has gone wrong, and nothing you do here will
        change that except asking.
      </p>

      {/* The identifier only. See the note above: a 403 that describes what
          it is protecting has already leaked it. */}
      <dl className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-3 text-start text-sm">
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="text-muted-foreground">Resource</dt>
          <dd className="truncate font-mono text-xs text-foreground">{resourceLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1">
          <dt className="text-muted-foreground">Signed in as</dt>
          <dd className="truncate text-foreground">{signedInAs}</dd>
        </div>
      </dl>

      <div className="mt-6 w-full rounded-xl border border-border bg-card p-4 text-start">
        <h2 className="text-sm font-semibold text-foreground">Who can let you in</h2>
        <ul className="mt-3 space-y-3">
          {owners.map((owner) => (
            <li key={owner.name} className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
              >
                {owner.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">{owner.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {owner.role}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <a
          href={requestHref}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Mail aria-hidden className="h-4 w-4" />
          Request access
        </a>
      </div>

      <a
        href={backHref}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to where you were
      </a>

      {/* Said once, because the alternative is someone pressing a retry
          button that cannot possibly work. */}
      <p className="mt-6 text-xs text-muted-foreground">
        If access was granted while this page was open, reload to pick it up.
      </p>
    </section>
  )
}
