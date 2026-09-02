/**
 * <HeroCentered> — announcement pill, large centered headline, two CTAs
 * and a logo strip.
 *
 * The hero for a product with nothing to screenshot yet: an API, a
 * developer tool, a launch page. When there is no interface to show, the
 * sentence has to carry the whole fold, so it gets the full column width
 * and everything else is deliberately quiet.
 *
 * The announcement pill is a link, not a decoration. It is the highest
 * position on the page and the cheapest way to give a shipped feature its
 * own front door — wasting it on a static "v2 is here" is the most common
 * miss in this pattern.
 *
 * `text-balance` on the heading is what stops a five-word line followed by
 * a one-word orphan at tablet widths, which is where centered headings
 * usually fall apart.
 */

import * as React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

export interface HeroCenteredProps {
  announcement?: string
  announcementHref?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Wordmarks under the fold. Text rather than images, so they theme. */
  logos?: string[]
  logosCaption?: string
  className?: string
}

const DEFAULT_LOGOS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Soylent']

export function HeroCentered({
  announcement = 'Introducing team workspaces',
  announcementHref = '#',
  heading = 'The fastest way to turn an idea into a product.',
  subheading =
    'One toolkit for the parts every project needs, so the only thing left to build is the part that makes yours different.',
  primaryLabel = 'Get started free',
  primaryHref = '#',
  secondaryLabel = 'Read the docs',
  secondaryHref = '#',
  logos = DEFAULT_LOGOS,
  logosCaption = 'Trusted by teams at',
  className = '',
}: HeroCenteredProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        {/* Grid wash, masked to fade out before it reaches the copy. */}
        <div className="absolute inset-x-0 top-0 h-96 bg-[linear-gradient(to_right,theme(colors.border/40)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/40)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        {announcement ? (
          <a
            href={announcementHref}
            className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 py-1 ps-1.5 pe-3 text-xs font-medium backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
              <Sparkles aria-hidden className="h-3 w-3" />
              New
            </span>
            <span className="text-muted-foreground">{announcement}</span>
            <ArrowRight
              aria-hidden
              className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </a>
        ) : null}

        <h1 className="mt-6 text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          {heading}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subheading}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={primaryHref}
            className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
          >
            {primaryLabel}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
          <a
            href={secondaryHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border/60 bg-card/60 px-7 text-sm font-semibold backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
          >
            {secondaryLabel}
          </a>
        </div>

        {logos.length > 0 ? (
          <div className="mt-16">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {logosCaption}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {logos.map((logo) => (
                <span
                  key={logo}
                  className="text-lg font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
