/**
 * <PricingSingle> — one price, one card, nothing to compare it to.
 *
 * <PricingTiers> and <ComparisonTable> both assume a ladder, and a ladder
 * is a choice architecture: three columns exist to make the middle one look
 * reasonable. A product with one price has no middle, and forcing it into a
 * three-column table means inventing two plans nobody wants in order to
 * sell the one that exists.
 *
 * Which changes what the block has to do. With no columns to compare, every
 * doubt has to be answered inside the one card — so the layout gives the
 * price a whole side and the inclusions the other, and the objection
 * handling ("what happens when it expires", "is it per project") sits
 * directly under the button rather than in a FAQ further down the page.
 *
 * The strikethrough is `<s>` around a real former price with the saving
 * spelled out. A crossed-out number with no basis is the oldest dishonest
 * pattern in pricing, so `compareAtPrice` is optional and the block says
 * what the difference is when it is set.
 *
 * `note` under the CTA is not decoration either. A one-time price raises
 * exactly one question — what does this stop giving me later — and a buyer
 * who cannot find the answer assumes the worst one.
 */

import * as React from 'react'
import { Check, Info } from 'lucide-react'

export interface PricingSingleProps {
  planName?: string
  price?: string
  /** Former price. Rendered struck through, with `savingLabel` beside it. */
  compareAtPrice?: string
  savingLabel?: string
  /** e.g. 'one-time' or '/ year'. Sits next to the price. */
  cadence?: string
  heading?: string
  subheading?: string
  features?: string[]
  ctaLabel?: string
  ctaHref?: string
  /** The objection the price itself raises, answered under the button. */
  note?: string
  className?: string
}

const DEFAULT_FEATURES = [
  'Every effect, block, page and template',
  'Unlimited projects, including client work',
  'Twelve months of catalog updates',
  'CLI, MCP server and public API',
  'No seat fee on people who see what you ship',
  'No attribution required, ever',
]

export function PricingSingle({
  planName = 'Pro',
  price = '$79',
  compareAtPrice,
  savingLabel,
  cadence = 'one-time',
  heading = 'One price, paid once',
  subheading = 'No subscription, no seat count, no tier above this one to discover later.',
  features = DEFAULT_FEATURES,
  ctaLabel = 'Get Pro',
  ctaHref = '/pricing',
  note = 'The licence to ship what you have is permanent. What runs for twelve months is access to components published after you buy — nothing you already copied stops working, and nothing checks at runtime.',
  className = '',
}: PricingSingleProps) {
  return (
    <section
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? (
          <p className="mt-3 text-pretty text-muted-foreground">{subheading}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/60">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Price side. */}
          <div className="border-b border-border/60 p-8 sm:border-b-0 sm:border-e">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {planName}
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">{price}</span>
              {cadence ? (
                <span className="text-sm text-muted-foreground">{cadence}</span>
              ) : null}
            </div>
            {compareAtPrice ? (
              <p className="mt-2 text-sm text-muted-foreground">
                <s>{compareAtPrice}</s>
                {savingLabel ? (
                  <span className="ms-2 font-medium text-emerald-600 dark:text-emerald-400">
                    {savingLabel}
                  </span>
                ) : null}
              </p>
            ) : null}

            <a
              href={ctaHref}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {ctaLabel}
            </a>

            {note ? (
              <div className="mt-5 flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{note}</p>
              </div>
            ) : null}
          </div>

          {/* Inclusions side. */}
          <div className="p-8">
            <p className="text-sm font-semibold">What is included</p>
            <ul className="mt-4 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                  />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
