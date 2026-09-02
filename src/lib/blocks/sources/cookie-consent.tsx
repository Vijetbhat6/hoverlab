'use client'

/**
 * <CookieConsent> — a consent banner with real per-category choices.
 *
 * READ THIS BEFORE SHIPPING IT. This is a UI component, not compliance.
 * It renders the choice and reports it through `onDecide`; it does not
 * block a single script on its own. If your analytics or ad tags load from
 * the document head regardless of what this returns, the banner is
 * decoration and arguably worse than nothing — it tells a visitor their
 * choice was honoured when it was not. Wiring `onDecide` to the thing that
 * actually gates loading is the work, and it is yours.
 *
 * With that said, the shape here is the one the law expects, and most
 * banners get it wrong in the same four ways:
 *
 *   Reject is as easy as accept. Both are buttons, both are one click,
 *   side by side. A banner where accepting is a button and refusing is a
 *   link into a settings page is the pattern regulators have repeatedly
 *   found invalid, and it is the most common mistake in the wild.
 *
 *   Non-essential categories default to OFF. Consent is opt-in, so a
 *   pre-ticked analytics box is not consent. Essential renders checked and
 *   disabled, because it is not a choice and should not pretend to be.
 *
 *   It does not trap. No overlay, no scroll lock, no focus trap — a cookie
 *   wall that blocks reading until you answer makes consent a condition of
 *   access, which is the thing "freely given" rules out. The page behind
 *   it stays usable.
 *
 *   It is announced, not sprung. `role="dialog"` with `aria-modal={false}`
 *   and a label, so a screen reader identifies it as a region asking for a
 *   decision rather than a stray group of buttons at the end of the page.
 *
 * Nothing is persisted here. Where the decision belongs — a cookie your
 * server reads, a consent-management platform, localStorage — depends on
 * where it has to be enforced, and guessing wrong writes a record in a
 * place that never gets read.
 *
 * POSITIONING. The banner is `absolute` inside a `relative` frame, so it
 * stays inside whatever renders it. Mounting it for real means one change:
 * drop the frame and swap `absolute` for `fixed`. It is written this way
 * round because a `fixed` element ignores every container it is in — in a
 * gallery of previews it escapes its own card and covers the page, and a
 * component that cannot be previewed beside its neighbours is one nobody
 * finds.
 */

import * as React from 'react'
import { Cookie } from 'lucide-react'

export interface ConsentCategory {
  id: string
  name: string
  description: string
  /** Cannot be refused, so it renders checked and disabled. */
  essential?: boolean
}

export interface CookieConsentProps {
  heading?: string
  body?: React.ReactNode
  categories?: ConsentCategory[]
  policyHref?: string
  policyLabel?: string
  /** Receives the ids the visitor allowed. Wire this to what loads scripts. */
  onDecide?: (allowed: string[]) => void
  className?: string
}

const DEFAULT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'essential',
    name: 'Essential',
    description:
      'Signing in, security, and remembering what is in your basket. Always on.',
    essential: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Which pages get used, so we know what to build next.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Measuring whether an ad you clicked led anywhere.',
  },
]

/**
 * One class string for both decisions, referenced twice rather than
 * written twice — so the two cannot drift apart in a later edit, which is
 * exactly how a compliant banner quietly becomes a non-compliant one.
 */
const DECISION_BUTTON =
  'rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function CookieConsent({
  heading = 'Cookies, and what they are for',
  body = 'Essential cookies keep you signed in. The rest stay off until you turn them on, and you can change your mind at any time.',
  categories = DEFAULT_CATEGORIES,
  policyHref = '/privacy',
  policyLabel = 'Privacy policy',
  onDecide,
  className = '',
}: CookieConsentProps) {
  const [open, setOpen] = React.useState(true)
  const [showDetail, setShowDetail] = React.useState(false)

  // Opt-in: only what cannot be refused starts enabled.
  const [allowed, setAllowed] = React.useState<string[]>(() =>
    categories.filter((c) => c.essential).map((c) => c.id),
  )

  const essentialIds = categories.filter((c) => c.essential).map((c) => c.id)
  const allIds = categories.map((c) => c.id)

  const decide = (ids: string[]) => {
    onDecide?.(ids)
    setOpen(false)
  }

  if (!open) return null

  return (
    // The containing frame. In a real mount this goes away and the banner
    // below becomes `fixed` — see POSITIONING above.
    <div className={`relative min-h-80 w-full ${className}`}>
      <div
        role="dialog"
        // Not modal on purpose: see the note above on cookie walls.
        aria-modal={false}
        aria-labelledby="cookie-consent-heading"
        className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-5 shadow-lg sm:p-6">
          <div className="flex gap-4">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background sm:flex">
              <Cookie aria-hidden className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h2 id="cookie-consent-heading" className="font-semibold">
                {heading}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}{' '}
                <a
                  href={policyHref}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {policyLabel}
                </a>
              </p>
            </div>
          </div>

          {showDetail ? (
            <fieldset
              id="cookie-consent-categories"
              className="mt-5 space-y-3 border-t border-border/60 pt-5"
            >
              <legend className="sr-only">Cookie categories</legend>
              {categories.map((c) => (
                <label key={c.id} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={allowed.includes(c.id)}
                    disabled={c.essential}
                    onChange={(e) =>
                      setAllowed((prev) =>
                        e.target.checked
                          ? [...prev, c.id]
                          : prev.filter((id) => id !== c.id),
                      )
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:opacity-60"
                  />
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-muted-foreground">
                      {c.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {/* Both decision buttons carry the SAME classes — same border,
              same background, same size, adjacent. Not an oversight and not
              a style to tidy up later: giving accept a filled primary
              treatment against an outlined reject is the visual version of
              burying reject in a settings page, and regulators have treated
              unequal prominence as invalidating consent. If a design system
              insists the primary action be loud here, the honest fix is to
              make both loud, never just this one. */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              aria-expanded={showDetail}
              aria-controls="cookie-consent-categories"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:me-auto"
            >
              {showDetail ? 'Hide options' : 'Choose what to allow'}
            </button>
            <button
              type="button"
              onClick={() => decide(essentialIds)}
              className={DECISION_BUTTON}
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => decide(showDetail ? allowed : allIds)}
              className={DECISION_BUTTON}
            >
              {showDetail ? 'Save choices' : 'Accept all'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
