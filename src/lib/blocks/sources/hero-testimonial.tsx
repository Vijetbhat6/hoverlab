/**
 * <HeroTestimonial> — a hero that leads with the pitch and closes with proof.
 *
 * For products sold on trust rather than novelty — agencies, consultancies,
 * anything with a long sales cycle. The quote is not a testimonial section
 * bolted underneath; it shares the fold, so the claim and the evidence for
 * it are read in one pass.
 *
 * Marked up as a real `<figure>` / `<blockquote>` / `<figcaption>`. A quote
 * built from a styled div says nothing about what it is, and this is the
 * one element on the page whose meaning *is* its attribution — an unsourced
 * quote is decoration.
 *
 * The avatar is initials in a themed circle rather than a photo: no asset
 * to host, no layout shift, and no broken-image icon when the CDN path
 * rots six months from now. Swap in an <img> where you have one.
 */

import * as React from 'react'
import { ArrowRight, Quote } from 'lucide-react'

export interface HeroTestimonialProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  quote?: string
  authorName?: string
  authorTitle?: string
  className?: string
}

export function HeroTestimonial({
  eyebrow = 'Trusted by 4,000 teams',
  heading = 'Stop rebuilding the same eight screens.',
  subheading =
    'Every section your product needs, written the way a senior engineer would write it — accessible, themed and yours to edit.',
  primaryLabel = 'Start free',
  primaryHref = '#',
  secondaryLabel = 'Talk to sales',
  secondaryHref = '#',
  quote = 'We shipped our entire onboarding flow in a weekend. The parts we would have argued about for a week were already decided, and decided well.',
  authorName = 'Priya Raman',
  authorTitle = 'Head of Engineering, Northwind',
  className = '',
}: HeroTestimonialProps) {
  const initials = authorName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ------------------------------------------------------ */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/20"
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
        </div>

        {/* -- Proof ----------------------------------------------------- */}
        <figure className="relative rounded-2xl border border-border/60 bg-card/70 p-7 shadow-xl shadow-black/10 backdrop-blur sm:p-9">
          <Quote
            aria-hidden
            className="absolute -top-4 left-7 h-9 w-9 rounded-lg bg-primary p-2 text-primary-foreground shadow-lg shadow-primary/25"
          />

          <blockquote className="mt-3 text-pretty text-lg font-medium leading-relaxed sm:text-xl">
            {quote}
          </blockquote>

          <figcaption className="mt-7 flex items-center gap-3 border-t border-border/60 pt-6">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
            >
              {initials}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{authorName}</span>
              <span className="block text-xs text-muted-foreground">{authorTitle}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
