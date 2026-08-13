/**
 * <CtaSplitPanel> — the closing call-to-action band.
 *
 * By the bottom of the page the reader has scrolled past the pitch, the
 * proof and the pricing — and possibly read none of it. The closing CTA
 * restates the offer in one line for exactly that reader, so it has to
 * carry the ask on its own: what it is, what it costs to try, where to
 * click. Burying only a button here assumes a memory the scroll destroyed.
 *
 * The reassurance row answers the three objections that stop the click —
 * card, commitment, migration — at the moment of the click, not two
 * screens earlier where they were read as marketing.
 */

import * as React from 'react'
import { ArrowRight, Check } from 'lucide-react'

export interface ReassurancePoint {
  text: string
}

export interface CtaSplitPanelProps {
  heading?: string
  supporting?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  reassurance?: ReassurancePoint[]
  className?: string
}

const DEFAULT_REASSURANCE: ReassurancePoint[] = [
  { text: 'No credit card required' },
  { text: 'Free for teams up to 5' },
  { text: 'Import from Linear in one click' },
]

export function CtaSplitPanel({
  heading = 'Ship the roadmap, not the tooling',
  supporting = 'Start a workspace now and have your first sprint planned before standup tomorrow.',
  primaryLabel = 'Start for free',
  primaryHref = '#',
  secondaryLabel = 'Book a demo',
  secondaryHref = '#',
  reassurance = DEFAULT_REASSURANCE,
  className = '',
}: CtaSplitPanelProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      {/* `dark` re-scopes the theme tokens, so this panel is a committed dark
          surface in both themes — the glow is still token-driven via primary. */}
      <div className="dark relative overflow-hidden rounded-3xl bg-background px-6 py-12 text-foreground sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/5 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {heading}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">{supporting}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background/50 px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {secondaryLabel}
            </a>
          </div>
        </div>

        <ul className="relative mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-8">
          {reassurance.map((point) => (
            <li
              key={point.text}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
              {point.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
