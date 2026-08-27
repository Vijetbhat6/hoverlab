'use client'

/**
 * The consent banner, mounted for real.
 *
 * This is `src/lib/blocks/sources/cookie-consent.tsx` — the block we sell —
 * with the two changes that block's own comment says a real mount needs:
 * the preview frame is gone, and `absolute` became `fixed`. Everything the
 * block is careful about is carried over unchanged and should stay that
 * way:
 *
 *   Reject is exactly as easy as accept. Both are buttons, both one click,
 *   side by side, sharing `DECISION_BUTTON` so they cannot drift apart.
 *   Unequal prominence here is the pattern regulators have repeatedly found
 *   invalidates consent.
 *
 *   Nothing non-essential is on until it is turned on, and a way out
 *   without deciding is not offered while there is no decision to keep.
 *
 *   It does not trap. No overlay, no scroll lock, no focus trap — the page
 *   behind it stays readable, because making consent a condition of access
 *   is the thing "freely given" rules out.
 *
 *   `role="dialog"` with `aria-modal={false}`, so it is announced as a
 *   region asking for a decision rather than stray buttons at the end of
 *   the document.
 *
 * WHAT THIS ADDS, which the block deliberately leaves to its owner: the
 * decision is persisted (src/lib/consent.ts) and wired to the thing that
 * actually gates loading (src/lib/analytics.ts). Without that second half a
 * banner is decoration, and worse than none — it tells a visitor their
 * choice was honoured when it was not.
 *
 * WHAT THIS DROPS, on purpose: the block's per-category checkboxes. It
 * ships three categories because most sites have at least that many; this
 * site has exactly one that can be refused. A single checkbox beside two
 * buttons that already express the same choice is not more granular
 * control, it is the same decision asked twice. The disclosure below names
 * both categories in plain words instead — which is the transparency the
 * checkboxes were there to provide.
 */

import * as React from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

import {
  type ConsentCategoryId,
  CONSENT_CATEGORIES,
  CONSENT_REQUIRED,
  ESSENTIAL_CATEGORIES,
  allowsAnalytics,
  recordConsent,
} from '@/lib/consent'
import { useConsent } from '@/components/use-consent'

const OPEN_EVENT = 'hoverlab:open-cookie-choices'

/** Reopen the banner from anywhere — Preferences, /privacy. No-op during SSR. */
export function openCookieChoices(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

interface Category {
  id: ConsentCategoryId
  name: string
  description: string
}

/**
 * Written from what the code actually stores, not from a template. If a
 * processor is added it belongs here and in /privacy §4 in the same commit.
 */
const CATEGORIES: Category[] = [
  {
    id: 'essential',
    name: 'Essential',
    description:
      'A session cookie if you sign in, and one entry remembering this answer so you are not asked again. Always on.',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description:
      'PostHog — which effects get copied and where people give up, so we know what to build next. Off until you turn it on.',
  },
]

/**
 * One class string for both decisions, referenced twice rather than written
 * twice, so the two cannot drift apart in a later edit — which is exactly
 * how a compliant banner quietly becomes a non-compliant one.
 */
const DECISION_BUTTON =
  'rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const QUIET_BUTTON =
  'rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function CookieConsentBanner() {
  const { record, decided, pending } = useConsent()
  const [reopened, setReopened] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onOpen = () => setReopened(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  // Asked for from a menu, so move focus in — the menu that opened this has
  // just closed, and focus would otherwise be left on nothing. Not done when
  // the banner appears by itself: taking focus from someone who is reading is
  // the trap this component is written to avoid.
  React.useEffect(() => {
    if (reopened) panelRef.current?.focus()
  }, [reopened])

  // `pending` already carries the hydration guard and the no-key case.
  const open = pending || (reopened && CONSENT_REQUIRED)
  if (!open) return null

  const decide = (allowed: readonly ConsentCategoryId[]) => {
    recordConsent(allowed)
    setReopened(false)
    setShowDetail(false)
  }

  const currently = decided
    ? allowsAnalytics(record)
      ? ' Analytics are currently on.'
      : ' Analytics are currently off.'
    : ''

  return (
    <div
      role="dialog"
      // Not modal on purpose: see the note on cookie walls above.
      aria-modal={false}
      aria-labelledby="cookie-consent-heading"
      ref={panelRef}
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-50 p-4 outline-none sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-5 shadow-lg sm:p-6">
        <div className="flex gap-4">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background sm:flex">
            <Cookie aria-hidden className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h2 id="cookie-consent-heading" className="font-semibold">
              Cookies, and what they are for
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Browsing and copying need no account and no analytics. Those stay
              off until you turn them on, and you can change your mind at any
              time under Preferences.{currently}{' '}
              <Link
                href="/privacy#cookies"
                className="text-primary underline-offset-4 hover:underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>

        {showDetail ? (
          <dl
            id="cookie-consent-categories"
            className="mt-5 space-y-3 border-t border-border/60 pt-5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <div key={c.id}>
                <dt className="font-medium">{c.name}</dt>
                <dd className="text-muted-foreground">{c.description}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* Both decision buttons carry the SAME classes — same border, same
            background, same size, adjacent. Not an oversight and not a style
            to tidy up later: giving accept a filled primary treatment against
            an outlined reject is the visual version of burying reject in a
            settings page. If the design system insists the primary action be
            loud here, the honest fix is to make both loud, never just one. */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
            aria-controls="cookie-consent-categories"
            className={`${QUIET_BUTTON} sm:mr-auto`}
          >
            {showDetail ? 'Hide detail' : 'What these are'}
          </button>
          {/* Only once there is a decision to keep. Offering it before then
              would be a third way to leave without answering, and silence is
              not consent. */}
          {decided ? (
            <button
              type="button"
              onClick={() => {
                setReopened(false)
                setShowDetail(false)
              }}
              className={QUIET_BUTTON}
            >
              Keep as is
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => decide(ESSENTIAL_CATEGORIES)}
            className={DECISION_BUTTON}
          >
            Reject analytics
          </button>
          <button
            type="button"
            onClick={() => decide(CONSENT_CATEGORIES)}
            className={DECISION_BUTTON}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The same reopen, as something a page can render.
 *
 * /privacy is a server component and says the choice can be changed at any
 * time; a policy that says so and then offers no control is the kind of
 * claim this codebase keeps having to go back and make true. Rendered as a
 * button rather than a link because it changes state on this page rather
 * than navigating anywhere.
 */
export function CookieChoicesButton({ className = '' }: { className?: string }) {
  // Nothing to reopen where no consent is asked for. Reads as plain prose
  // in the sentence around it rather than as a control that does nothing.
  if (!CONSENT_REQUIRED) return <>change your cookie choice</>

  return (
    <button
      type="button"
      onClick={openCookieChoices}
      className={`text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      change your cookie choice
    </button>
  )
}
