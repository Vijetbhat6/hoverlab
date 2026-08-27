'use client'

/**
 * <SettingsSessions> — where you are signed in, and what ending it does.
 *
 * Settings had the layout, the profile form, team members, API keys and
 * the danger zone. The one screen a person actually goes looking for —
 * after losing a laptop, after a shared login, after an email saying
 * "new sign-in" — was missing.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * "Sign out everywhere" is the button people press in a panic, and almost
 * nowhere says what it does not reach. API keys keep working. Personal
 * access tokens keep working. An attacker who exported data through the
 * API is entirely unaffected by every session on this list ending. So the
 * button carries that sentence, with a link to the place the tokens live,
 * because a security control that quietly under-delivers is worse than
 * none: it stops the search.
 *
 * LOCATION IS A GUESS, AND SAYS SO
 *
 * IP geolocation is city-accurate at best and routinely wrong on mobile
 * networks and VPNs. Printing "London, UK" as fact invites someone to
 * conclude they were not breached when they were, or the reverse. Every
 * location here is prefixed "near" and the panel says once where the
 * guess comes from.
 *
 * THIS DEVICE IS NOT REVOCABLE FROM HERE
 *
 * The current session has no "sign out" in the row — signing yourself out
 * from a list of other people's devices is a misclick with a real cost.
 * It is labelled, and the way to end it is the ordinary sign-out in the
 * menu, which is said rather than implied.
 *
 * ACCESSIBILITY: a real list with one heading per session; the revoke
 * buttons name the device they end, so a screen-reader run is "sign out
 * iPhone 15, near Lisbon" rather than six identical "sign out"; the
 * confirmation is `aria-live="polite"`.
 */

import * as React from 'react'
import {
  AlertTriangle,
  Check,
  Laptop,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'

export type SessionDevice = 'laptop' | 'phone' | 'tablet' | 'desktop'

export interface AppSession {
  id: string
  device: string
  deviceKind: SessionDevice
  browser: string
  /** Written as an approximation on purpose — see the note above. */
  location: string
  lastActive: string
  current?: boolean
  /** Set when something about this session is worth a second look. */
  flag?: string
}

export interface SettingsSessionsProps {
  sessions?: AppSession[]
  /** Where the tokens that survive "sign out everywhere" are managed. */
  tokensHref?: string
  className?: string
}

const ICONS: Record<SessionDevice, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
}

const DEFAULT_SESSIONS: AppSession[] = [
  {
    id: 's-1',
    device: 'MacBook Pro',
    deviceKind: 'laptop',
    browser: 'Chrome 141 · macOS 16',
    location: 'near Lisbon, Portugal',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 's-2',
    device: 'iPhone 15',
    deviceKind: 'phone',
    browser: 'Safari · iOS 19',
    location: 'near Lisbon, Portugal',
    lastActive: '20 minutes ago',
  },
  {
    id: 's-3',
    device: 'Windows PC',
    deviceKind: 'desktop',
    browser: 'Edge 140 · Windows 11',
    location: 'near Frankfurt, Germany',
    lastActive: '2 days ago',
    flag: 'First sign-in from this country',
  },
  {
    id: 's-4',
    device: 'iPad Air',
    deviceKind: 'tablet',
    browser: 'Safari · iPadOS 19',
    location: 'near Lisbon, Portugal',
    lastActive: '3 weeks ago',
  },
]

export function SettingsSessions({
  sessions = DEFAULT_SESSIONS,
  tokensHref = '#api-keys',
  className = '',
}: SettingsSessionsProps) {
  const [revoked, setRevoked] = React.useState<string[]>([])
  const [confirmingAll, setConfirmingAll] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState('')

  const others = sessions.filter((s) => !s.current)
  const liveOthers = others.filter((s) => !revoked.includes(s.id))

  function revoke(session: AppSession) {
    setRevoked((r) => [...r, session.id])
    setAnnouncement(`${session.device} signed out. It will need the password again.`)
  }

  function revokeAll() {
    setRevoked(others.map((s) => s.id))
    setConfirmingAll(false)
    setAnnouncement(
      `${others.length} sessions signed out. This device is still signed in, and API keys are unaffected.`,
    )
  }

  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Where you are signed in</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            One row per browser that holds a valid session. Locations are estimated
            from the IP address and are frequently wrong on mobile networks and
            VPNs — treat an unfamiliar city as worth checking, not as proof.
          </p>
        </header>

        <ul className="divide-y divide-border">
          {sessions.map((session) => {
            const Icon = ICONS[session.deviceKind]
            const isRevoked = revoked.includes(session.id)
            return (
              <li
                key={session.id}
                className={`flex flex-wrap items-start gap-3 px-5 py-4 ${
                  isRevoked ? 'opacity-60' : ''
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon aria-hidden className="h-4.5 w-4.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    {session.device}
                    {session.current ? (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        This device
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{session.browser}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden className="h-3 w-3" />
                      {session.location}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{isRevoked ? 'Signed out just now' : session.lastActive}</span>
                  </p>

                  {/* A flag is a prompt to look, not an accusation. */}
                  {session.flag && !isRevoked ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle aria-hidden className="h-3 w-3" />
                      {session.flag}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0">
                  {session.current ? (
                    /* Deliberately not revocable here — see the note above. */
                    <span className="text-xs text-muted-foreground">
                      Use Sign out in the menu
                    </span>
                  ) : isRevoked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Check aria-hidden className="h-3.5 w-3.5" />
                      Signed out
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revoke(session)}
                      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Sign out
                      <span className="sr-only">
                        {' '}
                        {session.device}, {session.location}
                      </span>
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <footer className="border-t border-border px-5 py-4">
          {confirmingAll ? (
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium text-foreground">
                Sign out {liveOthers.length}{' '}
                {liveOthers.length === 1 ? 'other session' : 'other sessions'}?
              </p>
              {/*
                The sentence this component exists for. Everything below is
                what the button does NOT reach.
              */}
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                This device stays signed in. It does <strong>not</strong> revoke API
                keys or personal access tokens — anything using one keeps working
                until you revoke it in{' '}
                <a
                  href={tokensHref}
                  className="rounded font-medium text-primary underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  API keys
                </a>
                .
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={revokeAll}
                  className="inline-flex h-8 items-center rounded-lg bg-destructive px-3 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign out {liveOthers.length}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingAll(false)}
                  className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                {liveOthers.length === 0
                  ? 'No other sessions are active.'
                  : `${liveOthers.length} other ${
                      liveOthers.length === 1 ? 'session is' : 'sessions are'
                    } active.`}
              </p>
              <button
                type="button"
                disabled={liveOthers.length === 0}
                onClick={() => setConfirmingAll(true)}
                className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Sign out everywhere else
              </button>
            </div>
          )}

          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {announcement}
          </p>
        </footer>
      </div>
    </section>
  )
}
