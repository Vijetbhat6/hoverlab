/**
 * <HeroSplit> — copy on the left, a product panel on the right.
 *
 * The default hero for anything with a UI to show. The asymmetry is the
 * point: a centered hero makes the reader choose between reading and
 * looking, where a split one lets the sentence and the screenshot land
 * together.
 *
 * Two details worth keeping if you rewrite the markup:
 *
 *  - The `<h1>` is the only h1 on the page. Heroes are the most-copied
 *    section in any catalog and the most common place a second one gets
 *    introduced, which is the single easiest way to flatten a page's
 *    outline for a screen reader.
 *  - The panel is `aria-hidden`. It is a drawing of an interface, not an
 *    interface — announcing "Revenue, 48,120, Today" to someone who cannot
 *    see it reads as real data from a real account.
 *
 * The panel is deliberately plain divs rather than an <img>: no asset to
 * host, no layout shift while it loads, and it inherits the theme, so it is
 * still legible the moment someone flips to light mode.
 */

import * as React from 'react'
import { ArrowRight, Check } from 'lucide-react'

export interface HeroSplitProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Short reassurances under the buttons — pricing, commitment, setup. */
  bullets?: string[]
  className?: string
}

const DEFAULT_BULLETS = ['No credit card required', 'Free for 14 days', 'Cancel anytime']

export function HeroSplit({
  eyebrow = 'Now in public beta',
  heading = 'Ship your next idea before the weekend.',
  subheading =
    'Everything you need to launch — auth, billing, analytics and a dashboard your customers will actually understand.',
  primaryLabel = 'Start building',
  primaryHref = '#',
  secondaryLabel = 'Book a demo',
  secondaryHref = '#',
  bullets = DEFAULT_BULLETS,
  className = '',
}: HeroSplitProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Ambient wash. Sits behind everything and eats no pointer events. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/5 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ---------------------------------------------------- */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px] shadow-primary/20"
              />
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border/60 bg-card/60 px-6 text-sm font-semibold backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {secondaryLabel}
            </a>
          </div>

          {bullets.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check aria-hidden className="h-3.5 w-3.5 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* -- Product panel ------------------------------------------- */}
        <div aria-hidden className="relative">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-2xl shadow-black/20 backdrop-blur">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>

            <div className="space-y-3 rounded-xl bg-background/80 p-4">
              {/* Metric row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Revenue', value: '$48,120', delta: '+12.4%' },
                  { label: 'Active', value: '2,847', delta: '+3.1%' },
                  { label: 'Churn', value: '0.8%', delta: '-0.3%' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border/60 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="mt-1 text-lg font-bold tracking-tight">{m.value}</div>
                    <div className="text-[10px] font-medium text-emerald-500">{m.delta}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart, heights as inline styles because the values are
                  data — a Tailwind class per possible height is a class list
                  that grows with the dataset. */}
              <div className="flex h-32 items-end gap-1.5 rounded-lg border border-border/60 p-3">
                {[38, 52, 44, 67, 58, 81, 72, 94, 86, 100, 91, 78].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 rounded-sm bg-gradient-to-t from-primary/30 to-primary"
                  />
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {['Acme Corp', 'Globex', 'Initech'].map((name, i) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex-1 text-xs font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      ${(4200 - i * 900).toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
