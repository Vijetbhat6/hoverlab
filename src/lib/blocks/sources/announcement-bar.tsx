'use client'

/**
 * <AnnouncementBar> — the dismissible strip above the navbar.
 *
 * Absent from the catalog until now, which is odd for the block most sites
 * ship first: a launch, a sale, a maintenance window, a conference. It is
 * small, and almost everyone gets the same three things wrong.
 *
 * It is a <section> with an accessible name, not a bare div. A visitor
 * using a screen reader lands on the page and hears the announcement before
 * the navigation, so it needs to identify itself as something other than
 * the start of the header.
 *
 * `role="status"` only when `live`, and never by default. A bar that is in
 * the markup at page load is not a status change — announcing it politely
 * on arrival is redundant with reading it in document order. `live` exists
 * for the case that actually warrants it: a bar mounted later, after an
 * incident starts, where the point is that a reader already on the page
 * finds out.
 *
 * Dismissal is not the end of it. A bar that reappears on every navigation
 * is the pattern that makes people install blockers, so `storageKey`
 * persists the dismissal — and because a promo that must not be permanently
 * dismissible exists too (a maintenance window), passing no key gives a
 * bar that dismisses for the session only.
 *
 * Reading localStorage during render would mismatch the server HTML, so the
 * dismissed state resolves in an effect and the bar renders on the server
 * as visible. The cost is a flash for a returning visitor; the alternative
 * is a hydration error on every page.
 */

import * as React from 'react'
import { ArrowRight, X } from 'lucide-react'

export interface AnnouncementBarProps {
  message?: React.ReactNode
  /** Short label, e.g. 'New'. Rendered as a pill before the message. */
  badge?: string
  ctaLabel?: string
  ctaHref?: string
  /** Persist the dismissal under this key. Omit for session-only. */
  storageKey?: string
  /** Announce to assistive tech. Only for a bar that appears after load. */
  live?: boolean
  dismissible?: boolean
  /** Names the region for screen readers and the dismiss button. */
  label?: string
  className?: string
}

export function AnnouncementBar({
  message = 'Blocks v2 is out — 134 sections, all free to browse and copy.',
  badge = 'New',
  ctaLabel = 'See what changed',
  ctaHref = '/changelog',
  storageKey,
  live = false,
  dismissible = true,
  label = 'Announcement',
  className = '',
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (!storageKey) return
    try {
      if (window.localStorage.getItem(storageKey) === 'dismissed') {
        setDismissed(true)
      }
    } catch {
      // Private mode, or storage disabled. A bar that shows is the safe
      // failure; a crash on read is not.
    }
  }, [storageKey])

  const dismiss = () => {
    setDismissed(true)
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, 'dismissed')
    } catch {
      // Dismissed for this session regardless.
    }
  }

  if (dismissed) return null

  return (
    <section
      aria-label={label}
      {...(live ? { role: 'status' } : {})}
      className={`relative border-b border-border/60 bg-primary/10 ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 pr-12 text-sm sm:px-6 sm:pr-14">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          {badge ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {badge}
            </span>
          ) : null}
          <span className="text-foreground/90">{message}</span>
          {ctaLabel ? (
            <a
              href={ctaHref}
              className="inline-flex items-center gap-0.5 font-medium text-primary underline-offset-4 hover:underline"
            >
              {ctaLabel}
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </p>
      </div>

      {dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          // Named for what it closes, not just "Close" — a page can hold
          // several dismissible things, and "Close" three times over tells
          // a screen-reader user nothing about which is which.
          aria-label={`Dismiss ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-4"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </section>
  )
}
