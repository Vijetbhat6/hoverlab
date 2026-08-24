/**
 * <LogoGrid> — customer logos in bordered cells, holding still.
 *
 * <LogoCloud> is a marquee, and a marquee is a trade: it fits an unbounded
 * list into a fixed strip, and in exchange it never shows you all of it at
 * once and it moves. That trade is wrong in three places this block is for
 * — a footer, where perpetual motion at the bottom of every page is a
 * distraction the reader cannot dismiss; an about or customers page, where
 * the count *is* the claim and a crawl actively hides it; and anywhere the
 * section has to be legible in a screenshot or in print.
 *
 * The grid is `gap-px` over a bordered container, so every divider is one
 * physical pixel and neighbours share it rather than doubling. Cells are
 * uniform and the names are centred in them, which is what keeps a set of
 * wordmarks of wildly different lengths reading as a set.
 *
 * No animation at all, which is the point — there is nothing here for
 * `prefers-reduced-motion` to have an opinion about.
 *
 * Text wordmarks rather than images by default: a logo wall of remote SVGs
 * is a layout shift, a set of licences and a handful of requests, and the
 * shape reads identically without them. Pass `logos` as nodes when the real
 * marks are needed.
 */

import * as React from 'react'

export interface LogoGridProps {
  /** Wordmarks, or any node — an <img>, an inline <svg>. */
  logos?: React.ReactNode[]
  caption?: string
  /** Sits under the grid, e.g. a link to the customers page. */
  footnote?: React.ReactNode
  className?: string
}

const DEFAULT_LOGOS = [
  'Northwind',
  'Contoso',
  'Initech',
  'Umbra',
  'Lumon',
  'Vandelay',
  'Soylent',
  'Aperture',
  'Tyrell',
  'Wayne',
  'Cyberdyne',
  'Stark',
]

export function LogoGrid({
  logos = DEFAULT_LOGOS,
  caption = 'Trusted by teams shipping every day',
  footnote,
  className = '',
}: LogoGridProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 ${className}`}
    >
      {caption ? (
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          {caption}
        </p>
      ) : null}

      {/* The container supplies the outer border and the ground the 1px
          gaps expose; each cell paints its own background over it. */}
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-3 lg:grid-cols-4">
        {logos.map((logo, i) => (
          <li
            key={i}
            className="flex min-h-24 items-center justify-center bg-card px-6 py-8"
          >
            <span className="text-center text-lg font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground">
              {logo}
            </span>
          </li>
        ))}
      </ul>

      {footnote ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">{footnote}</p>
      ) : null}
    </section>
  )
}
