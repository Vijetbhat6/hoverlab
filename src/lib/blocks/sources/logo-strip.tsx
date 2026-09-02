/**
 * <LogoStrip> — the one line of proof that sits directly under a hero.
 *
 * The catalog already has two logo sections and neither fits this slot.
 * <LogoCloud> moves, and motion immediately below the fold competes with
 * the headline it is supposed to support. <LogoGrid> is a bordered block
 * with real presence — correct on a customers page, far too heavy as the
 * second thing on a landing page, where it pushes the primary CTA down and
 * reads as a section rather than as a footnote to the hero.
 *
 * So this one is deliberately the smallest of the three: one row, no
 * border, no card, no motion, tight vertical padding. It is meant to be
 * skimmed in half a second and then scrolled past, which is exactly what
 * social proof under a hero is for.
 *
 * The count is the part people leave out. "Trusted by great teams" is
 * something any site can say; "Trusted by 4,000+ teams" is a number that can
 * be wrong, which is why it is worth reading. `claim` takes the whole
 * sentence rather than a number and a template, because the honest phrasing
 * differs — some products count teams, some count engineers, some can only
 * honestly name six companies and should say six names and no number.
 *
 * Logos wrap and centre rather than scrolling. A strip that overflows on a
 * phone has hidden its last two names from the readers most likely to be on
 * one, and there is no arrow to tell them so.
 *
 * Text wordmarks by default, matching <LogoGrid>: remote SVGs cost a layout
 * shift, a set of licences and a request each, and the shape reads the same
 * without them. Pass nodes when the real marks matter.
 */

import * as React from 'react'
import { ArrowRight } from 'lucide-react'

export interface LogoStripProps {
  /** The whole sentence, not a number and a template. See above. */
  claim?: string
  /** Wordmarks, or any node — an <img>, an inline <svg>. */
  logos?: React.ReactNode[]
  /** Optional route to the page that backs the claim up. */
  moreHref?: string
  moreLabel?: string
  /** Hairline above the strip, for separating it from the hero. */
  divided?: boolean
  className?: string
}

const DEFAULT_LOGOS = ['Northwind', 'Contoso', 'Umbra', 'Lumon', 'Vandelay', 'Aperture']

export function LogoStrip({
  claim = 'Trusted by 4,000+ engineering teams',
  logos = DEFAULT_LOGOS,
  moreHref,
  moreLabel = 'Read their stories',
  divided = true,
  className = '',
}: LogoStripProps) {
  return (
    <section
      aria-label="Customers"
      className={`w-full ${divided ? 'border-t border-border/60' : ''} ${className}`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:gap-12 lg:px-8">
        <p className="shrink-0 text-center text-sm font-medium text-muted-foreground lg:text-start">
          {claim}
        </p>

        <ul className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-4 lg:justify-start">
          {logos.map((logo, i) => (
            <li
              key={i}
              className="text-lg font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              {logo}
            </li>
          ))}
        </ul>

        {moreHref ? (
          <a
            href={moreHref}
            className="group flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {moreLabel}
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </a>
        ) : null}
      </div>
    </section>
  )
}
