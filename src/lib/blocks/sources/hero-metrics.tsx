/**
 * <HeroMetrics> — a centered hero that lands on a row of proof numbers.
 *
 * The hero for a product whose argument is scale: infrastructure, payments,
 * anything where "how many" is the question a buyer asks second. Folding
 * the metrics into the fold rather than putting a stats band below it means
 * the claim and its magnitude are read together instead of a scroll apart.
 *
 * The numbers are a `<dl>`, not a grid of divs. A definition list is
 * exactly what a metric row is — a term and its value — and it gives a
 * screen reader the pairing for free, where a div soup reads as six
 * unrelated fragments.
 *
 * Each value is one string, not a number plus a separately styled suffix.
 * Splitting "99.99%" into "99.99" and "%" so the unit can be dimmed puts a
 * text node boundary mid-token, which is where screen readers start
 * spelling things out.
 */

import * as React from 'react'
import { ArrowRight } from 'lucide-react'

export interface HeroMetric {
  /** The number, formatted for display — "99.99%", "2.4B", "180ms". */
  value: string
  label: string
}

export interface HeroMetricsProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  metrics?: HeroMetric[]
  className?: string
}

const DEFAULT_METRICS: HeroMetric[] = [
  { value: '99.99%', label: 'Uptime, rolling 90 days' },
  { value: '2.4B', label: 'Requests served monthly' },
  { value: '180ms', label: 'Median global latency' },
  { value: '38', label: 'Edge regions' },
]

export function HeroMetrics({
  eyebrow = 'Built for production traffic',
  heading = 'Infrastructure that stops being interesting.',
  subheading =
    'Deploy once and forget the pager. We handle the regions, the failover and the certificate you were about to let expire.',
  primaryLabel = 'Deploy your first app',
  primaryHref = '#',
  secondaryLabel = 'View the status page',
  secondaryHref = '#',
  metrics = DEFAULT_METRICS,
  className = '',
}: HeroMetricsProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        {/* Faint grid, masked so it fades out before the metric row. */}
        <div
          className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        {eyebrow ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px] shadow-primary/20"
            />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subheading}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

        {metrics.length > 0 ? (
          <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border/60 pt-10 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="block text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {m.value}
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block text-pretty text-xs leading-relaxed text-muted-foreground"
                  >
                    {m.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  )
}
