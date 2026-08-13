/**
 * <HeroEditorial> — a masthead, not a landing page.
 *
 * For publications, essays, launch announcements and anything where the
 * writing *is* the product. It borrows the things print does well: a rule
 * above the headline, a serif display face, a measure that stops around 60
 * characters, and no buttons competing with the first sentence.
 *
 * The only interactive element is a single text link. A hero with two
 * gradient CTAs is telling the reader they are a lead; this one is telling
 * them they are a reader, and the restraint is the design.
 *
 * `font-serif` resolves to whatever the project's serif stack is, so this
 * inherits a real typeface where one is configured and Georgia where one
 * is not — either way it reads as editorial rather than as a UI.
 *
 * `<time>` carries a machine-readable `dateTime`. It is the one piece of
 * metadata here that something other than a human will want to parse.
 */

import * as React from 'react'
import { ArrowRight } from 'lucide-react'

export interface HeroEditorialProps {
  kicker?: string
  heading?: string
  standfirst?: string
  authorName?: string
  /** ISO date for `<time dateTime>`. */
  publishedAt?: string
  /** Human-facing date. Defaults to a formatting of `publishedAt`. */
  publishedLabel?: string
  readingTime?: string
  linkLabel?: string
  linkHref?: string
  className?: string
}

export function HeroEditorial({
  kicker = 'Field notes',
  heading = 'The interface is the argument.',
  standfirst =
    'Every product makes a claim about how its user should think. Most make it by accident. A short case for treating layout as a position rather than a container.',
  authorName = 'Ada Whitfield',
  publishedAt = '2026-03-14',
  publishedLabel = '14 March 2026',
  readingTime = '9 min read',
  linkLabel = 'Read the essay',
  linkHref = '#',
  className = '',
}: HeroEditorialProps) {
  return (
    <section className={`relative ${className}`}>
      <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {kicker ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {kicker}
            </span>
            <hr aria-hidden className="mt-4 border-t border-border/60" />
          </>
        ) : null}

        <h1 className="mt-8 text-balance font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="mt-6 max-w-[60ch] text-pretty font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {standfirst}
        </p>

        {/* -- Byline ---------------------------------------------------- */}
        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{authorName}</span>
          <span aria-hidden>·</span>
          <time dateTime={publishedAt}>{publishedLabel}</time>
          {readingTime ? (
            <>
              <span aria-hidden>·</span>
              <span>{readingTime}</span>
            </>
          ) : null}
        </div>

        <a
          href={linkHref}
          className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-primary/40 decoration-2 underline-offset-[6px] transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {linkLabel}
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </section>
  )
}
