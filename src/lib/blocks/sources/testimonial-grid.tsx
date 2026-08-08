/**
 * <TestimonialGrid> — a masonry-ish wall of customer quotes.
 *
 * Uses CSS multi-column rather than a grid: quotes vary in length, and
 * columns pack them by height instead of leaving the ragged bottom edge a
 * row-based grid produces. `break-inside: avoid` keeps a card from being
 * split across a column boundary.
 */

import * as React from 'react'
import { Star } from 'lucide-react'

export interface Testimonial {
  quote: string
  name: string
  role: string
  /** 1–5. Omit to hide the row of stars. */
  rating?: number
}

export interface TestimonialGridProps {
  testimonials?: Testimonial[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'We replaced a week of design polish with an afternoon. The parts that used to get cut for time are just there now.',
    name: 'Priya Raman',
    role: 'Staff Engineer, Northwind',
    rating: 5,
  },
  {
    quote: 'Dropped it in on a Friday and shipped Monday. No dependency argument with my team for once.',
    name: 'Marco Silva',
    role: 'Founder, Ferrytale',
    rating: 5,
  },
  {
    quote:
      'The thing I did not expect: it made our junior engineers faster, because the patterns are readable. They learn from what they paste.',
    name: 'Alex Chen',
    role: 'Engineering Manager, Contoso',
    rating: 5,
  },
  {
    quote: 'Our marketing site went from three weeks to four days. Same designer, same headcount.',
    name: 'Dana Whitfield',
    role: 'Head of Design, Globex',
    rating: 4,
  },
  {
    quote:
      'I stopped keeping a personal snippets file. That file had been following me between jobs for six years.',
    name: 'Samir Haddad',
    role: 'Frontend Lead, Initech',
    rating: 5,
  },
]

export function TestimonialGrid({
  testimonials = DEFAULT_TESTIMONIALS,
  heading = 'What people say',
  subheading = 'From teams that ship on a deadline.',
  className = '',
}: TestimonialGridProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="break-inside-avoid rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-shadow hover:shadow-lg"
          >
            {t.rating ? (
              <div className="mb-3 flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={
                      i < t.rating!
                        ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
                        : 'h-3.5 w-3.5 text-muted-foreground/30'
                    }
                  />
                ))}
              </div>
            ) : null}

            <blockquote className="text-sm leading-relaxed text-foreground/90">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <figcaption className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground/70"
              >
                {initials(t.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}
