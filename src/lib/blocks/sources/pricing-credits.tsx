/**
 * <PricingCredits> — packs you buy once, not a plan you join.
 *
 * Every other pricing block in this catalog assumes a subscription.
 * <PricingTiers> toggles monthly against yearly, <PricingSingle> sells one
 * recurring plan, <PricingUsageCalculator> projects a monthly bill and
 * <ComparisonTable> compares plans. None of them can express the thing an
 * AI product, a rendering service or an API most often sells: a quantity,
 * bought once, spent whenever.
 *
 * The shape matters commercially, not just visually. Prepaid packs are how
 * you sell to someone who cannot get a recurring charge approved — a
 * contractor, a student, a team in a market where cross-border subscriptions
 * decline at the bank — and to the much larger group who simply will not
 * start a subscription to try something.
 *
 * The unit price is the part people leave off, and leaving it off is what
 * makes a pack grid feel like a trick. Four prices with four credit counts
 * is arithmetic the reader has to do to find the discount you are offering
 * them, and most will not; they will assume the largest pack is the rip-off,
 * because on most sites it is. `unit` is a required field here for that
 * reason, and the saving against the smallest pack is stated rather than
 * implied by a badge.
 *
 * Expiry is stated at the top rather than in a footnote. It is the first
 * question anyone asks about prepaid anything, and burying it is how a page
 * that is telling the truth ends up looking like one that is not.
 *
 * A <ul> of cards rather than a table: packs are alternatives, not rows of
 * one comparison, and each is independently purchasable.
 */

import * as React from 'react'
import { Check, Sparkles } from 'lucide-react'

export interface CreditPack {
  credits: string
  price: string
  /** Price per credit, worked out for the reader. Required on purpose. */
  unit: string
  /** e.g. "Save 25%" — against the smallest pack, stated not implied. */
  saving?: string
  note?: string
  featured?: boolean
  ctaLabel?: string
  ctaHref?: string
}

export interface PricingCreditsProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  packs?: CreditPack[]
  /** What a credit buys. Without this the prices mean nothing. */
  unitExplainer?: string
  assurances?: string[]
  className?: string
}

const DEFAULT_PACKS: CreditPack[] = [
  {
    credits: '500 credits',
    price: '$5',
    unit: '$0.010 per credit',
    note: 'Enough to finish an evaluation.',
    ctaLabel: 'Buy 500',
  },
  {
    credits: '2,000 credits',
    price: '$15',
    unit: '$0.0075 per credit',
    saving: 'Save 25%',
    note: 'What a working month looks like for one person.',
    featured: true,
    ctaLabel: 'Buy 2,000',
  },
  {
    credits: '10,000 credits',
    price: '$60',
    unit: '$0.006 per credit',
    saving: 'Save 40%',
    note: 'For a small team, or a batch job with a deadline.',
    ctaLabel: 'Buy 10,000',
  },
]

const DEFAULT_ASSURANCES = [
  'Credits never expire',
  'No subscription, no card kept on file',
  'Unused credits are refundable for 30 days',
]

/*
  Per-instance id, hashed from props that differ between instances.

  A literal id is a latent duplicate the moment this block is rendered
  twice on one document -- two pages on a catalog hub, or one page using
  the section twice. `aria-labelledby` pointing at a duplicated id resolves
  to whichever element comes first, so the second copy is announced with
  the first copy's label. Server component, so no `useId`: hashing props
  gives each instance its own target and stays stable across server and
  client renders in a way a counter would not.
*/
function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export function PricingCredits({
  eyebrow = 'Credits',
  heading = 'Buy what you need, once',
  subheading = 'No plan to join and nothing that renews. Top up whenever the balance runs low, or never again.',
  packs = DEFAULT_PACKS,
  unitExplainer = 'One credit is one generation at standard quality. High quality costs four.',
  assurances = DEFAULT_ASSURANCES,
  className = '',
}: PricingCreditsProps) {
  const uid = instanceId(heading)

  return (
    <section
      aria-labelledby={`pricing-credits-heading-${uid}`}
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id={`pricing-credits-heading-${uid}`}
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{subheading}</p>

        {unitExplainer ? (
          <p className="mt-6 inline-block rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
            {unitExplainer}
          </p>
        ) : null}
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <li
            key={pack.credits}
            className={`relative flex flex-col rounded-2xl border bg-card p-8 ${
              pack.featured ? 'border-primary ring-1 ring-primary' : 'border-border/60'
            }`}
          >
            {pack.featured ? (
              <span className="absolute -top-3 start-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                Most bought
              </span>
            ) : null}

            {pack.credits ? (
              <h3
                data-stress-ignore
                className="break-words text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {pack.credits}
              </h3>
            ) : null}

            {/* Wraps: a long price and a saving pill together are wider than
                the card once the grid is three across. */}
            <p className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {pack.price}
              </span>
              {pack.saving ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {pack.saving}
                </span>
              ) : null}
            </p>

            <p className="mt-2 break-words text-sm tabular-nums text-muted-foreground">{pack.unit}</p>

            {pack.note ? (
              <p className="mt-4 flex-1 break-words text-pretty text-sm leading-relaxed text-muted-foreground">
                {pack.note}
              </p>
            ) : (
              <span className="flex-1" />
            )}

            <a
              href={pack.ctaHref ?? '#'}
              className={`mt-8 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                pack.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}
            >
              {pack.ctaLabel ?? `Buy ${pack.credits}`}
            </a>
          </li>
        ))}
      </ul>

      {assurances.length > 0 ? (
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {assurances.map((assurance) => (
            <li key={assurance} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
              {assurance}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
