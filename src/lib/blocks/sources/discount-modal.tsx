'use client'

/**
 * <DiscountModal> — the offer popup, built so it is not a dark pattern.
 *
 * Every retailer ships one and almost every one of them is hostile: it appears
 * two seconds after landing, over content nobody has read, with a decline
 * button that says "No thanks, I hate saving money" in 10px grey. That version
 * converts a little and costs a lot, and since 2023 the confirmshaming half of
 * it is explicitly illegal in several jurisdictions.
 *
 * So this is the same component with four rules applied, and each rule is a
 * line of code rather than a policy document.
 *
 *   1. **It waits for intent.** Triggered by exit intent or by depth, never by
 *      a timer on arrival. A visitor who has scrolled 60% has shown interest;
 *      one who has been on the page four seconds has shown nothing.
 *   2. **Decline is a real button.** Same size, same contrast, neutral words.
 *      "No thanks" is a sentence. "I don't want to save 10%" is a manipulation.
 *   3. **Dismissal is remembered.** Once declined it does not come back this
 *      session. A popup that reappears on the next page view is the single
 *      most common reason people leave a site.
 *   4. **The terms are on the face of it.** Minimum spend, exclusions and
 *      expiry beside the code, not behind an asterisk. A code that fails at
 *      checkout costs the sale it was meant to save.
 *
 * THE PREVIEW STARTS OPEN. This block's whole subject is the panel, and the
 * demo shows it rather than a page with an invisible trigger on it. In a real
 * page, mount it with `open={false}` and drive it from your intent hook.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal`, labelled by its heading
 * and described by its terms; the page behind is `aria-hidden` and pointer
 * inert; Escape closes and counts as a decline, because a dismissal that is
 * not recorded is a popup that returns.
 */

import * as React from 'react'
import { Check, Copy, Tag, X } from 'lucide-react'

export interface DiscountModalProps {
  code?: string
  headline?: string
  detail?: string
  terms?: string[]
  /** Starts open so the preview shows the panel. Drive it from intent. */
  open?: boolean
  className?: string
}

const DEFAULT_TERMS = [
  'Minimum spend £60 before delivery.',
  'Not valid on clearance, gift cards or service plans.',
  'One use per customer. Expires 30 September 2026.',
]

export function DiscountModal({
  code = 'DESK10',
  headline = '10% off your first order',
  detail =
    'Because you were about to leave, and because a code is cheaper for us than a retargeting ad.',
  terms = DEFAULT_TERMS,
  open: initiallyOpen = true,
  className = '',
}: DiscountModalProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(initiallyOpen)
  const [declined, setDeclined] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Dismissal is remembered — see rule 3. In a real page this is where a
  // sessionStorage write goes; the state here keeps the block self-contained.
  function decline() {
    setOpen(false)
    setDeclined(true)
  }

  async function copyCode() {
    try {
      await navigator.clipboard?.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard is absent over plain http and in some webviews. */
    }
  }

  return (
    <section
      className={`relative min-h-[28rem] overflow-hidden bg-muted/30 p-4 sm:p-6 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) decline()
      }}
    >
      {/* Stand-in for the page the popup covers. */}
      <div
        aria-hidden={open || undefined}
        className={`mx-auto max-w-3xl space-y-3 transition-opacity ${
          open ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <div className="h-8 w-52 rounded bg-muted border border-transparent" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="h-20 rounded-lg bg-muted border border-transparent" />
              <div className="mt-3 h-3 w-3/4 rounded bg-muted border border-transparent" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted border border-transparent" />
            </div>
          ))}
        </div>
        {declined ? (
          <p role="status" className="pt-2 text-sm text-muted-foreground">
            Declined. It will not appear again this session — that is the whole
            of rule three.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Simulate exit intent
          </button>
        )}
      </div>

      {open ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            aria-describedby={`${uid}-terms`}
            className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-0">
              <span
                aria-hidden
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
              >
                <Tag className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={decline}
                aria-label="Close and do not show again"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 pt-3">
              <h2 id={`${uid}-title`} className="text-lg font-bold tracking-tight">
                {headline}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3">
                <code className="flex-1 font-mono text-lg font-bold tracking-widest text-primary">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {copied ? (
                    <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              </div>
              <p aria-live="polite" className="sr-only">
                {copied ? `Discount code ${code} copied to the clipboard` : ''}
              </p>

              {/* On the face of it, not behind an asterisk. */}
              <ul id={`${uid}-terms`} className="mt-3 space-y-1 text-xs text-muted-foreground">
                {terms.map((term) => (
                  <li key={term} className="flex gap-1.5">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground border border-transparent" />
                    {term}
                  </li>
                ))}
              </ul>

              {/* Equal weight, neutral words. No confirmshaming. */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={decline}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  No thanks
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Use the code
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
