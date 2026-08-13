/**
 * <HeroPriceAnchor> — a hero that names the price above the fold.
 *
 * For one-time purchases, indie tools and anything with a single plan:
 * products where hiding the price behind a "Pricing" nav item costs more
 * trust than the number ever costs conversions. If there is one plan, the
 * pricing page is a hero.
 *
 * Two typographic details that matter more than they look:
 *
 *  - The old price is `<s>`, not a `line-through` class. Struck-through
 *    text that is only struck visually is read aloud as a current price,
 *    which is the one place a decorative style becomes a false claim.
 *  - The currency symbol and the amount are one text node. Splitting them
 *    to style the symbol smaller puts a boundary mid-token and gets "$"
 *    and "49" announced separately.
 *
 * The included list is a `<ul>` with the check marks `aria-hidden` — the
 * list semantics already carry "these are the items", and six repetitions
 * of "check" ahead of each one is noise.
 */

import * as React from 'react'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

export interface HeroPriceAnchorProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  /** Current price, formatted for display — "$49". */
  price?: string
  /** Struck-through former price. Omit to hide it. */
  originalPrice?: string
  /** Billing note under the price, e.g. "one-time" or "per month". */
  priceNote?: string
  primaryLabel?: string
  primaryHref?: string
  includes?: string[]
  guarantee?: string
  className?: string
}

const DEFAULT_INCLUDES = [
  'Lifetime access, no subscription',
  'Every component and template',
  'Figma source files',
  'One year of updates',
  'Unlimited commercial projects',
]

export function HeroPriceAnchor({
  eyebrow = 'Launch week — 40% off',
  heading = 'Buy it once. Use it in everything.',
  subheading =
    'The whole library, source included, with a licence that does not care how many client projects you ship this year.',
  price = '$49',
  originalPrice = '$82',
  priceNote = 'one-time payment',
  primaryLabel = 'Get the library',
  primaryHref = '#',
  includes = DEFAULT_INCLUDES,
  guarantee = '30-day refund, no questions asked',
  className = '',
}: HeroPriceAnchorProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ------------------------------------------------------ */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          {includes.length > 0 ? (
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* -- Price card ------------------------------------------------ */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-7 text-center shadow-xl shadow-black/10 backdrop-blur sm:p-8">
          <div className="flex items-end justify-center gap-2">
            <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">{price}</span>
            {originalPrice ? (
              <s className="pb-2 text-lg font-medium text-muted-foreground">{originalPrice}</s>
            ) : null}
          </div>

          {priceNote ? (
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              {priceNote}
            </p>
          ) : null}

          <a
            href={primaryHref}
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {primaryLabel}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>

          {guarantee ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden className="h-4 w-4 text-emerald-500" />
              {guarantee}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
