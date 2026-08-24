'use client'

/**
 * <TestimonialCarousel> — a scroll-snap rail for more quotes than a wall can hold.
 *
 * <TestimonialGrid> is the right shape for six quotes and the wrong one for
 * twenty: a wall that tall stops being social proof and becomes a section
 * the reader scrolls past to reach the pricing. This block fixes the height
 * and moves the overflow sideways.
 *
 * It is deliberately not the carousel that word usually implies. There is no
 * auto-advance — a section that moves on its own takes the reading pace away
 * from the reader, and it is the most complained-about pattern on marketing
 * pages. There is no slide-swapping either: every quote stays in the DOM,
 * which is what keeps the section findable with Cmd-F, quotable by a search
 * engine, and printable.
 *
 * The scrolling itself is CSS. `snap-x snap-mandatory` on the rail and
 * `snap-start` on the cards give trackpad, touch and shift-wheel the right
 * behaviour with no JavaScript at all, so the section still works if the
 * bundle never arrives. The arrows are the enhancement on top, and they are
 * the only reason this file needs a client boundary.
 *
 * Two details a rail like this usually gets wrong:
 *
 *   - The rail is `tabIndex={0}` with a role and a label. A scrollable
 *     region that cannot take focus is content a keyboard user cannot reach
 *     — WCAG 2.1.1 — because the arrow keys have to be sent somewhere.
 *   - The arrows disable at the ends rather than wrapping. A control that
 *     silently loops gives the reader no way to tell they have seen
 *     everything, which for a finite list of quotes is the one thing they
 *     want to know.
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

export interface CarouselTestimonial {
  quote: string
  name: string
  role: string
  company: string
  rating?: number
}

export interface TestimonialCarouselProps {
  eyebrow?: string
  heading?: string
  testimonials?: CarouselTestimonial[]
  className?: string
}

const DEFAULT_TESTIMONIALS: CarouselTestimonial[] = [
  {
    quote:
      'The migration took an afternoon, which I did not believe when sales said it. What actually saved us was that our old exports imported without a schema rewrite.',
    name: 'Dara Okonkwo',
    role: 'Staff Engineer',
    company: 'Northwind Freight',
    rating: 5,
  },
  {
    quote:
      'We bought it for one team and it spread to four without anyone asking me to approve a rollout. That has happened twice in nine years here.',
    name: 'Priya Ramachandran',
    role: 'Director of Platform',
    company: 'Alcove Health',
    rating: 5,
  },
  {
    quote:
      'Support answered a schema question at 2am our time with an actual query, not a docs link. I have kept the thread.',
    name: 'Tomas Lindqvist',
    role: 'Data Lead',
    company: 'Ravel Studio',
    rating: 5,
  },
  {
    quote:
      'It is not the cheapest thing we evaluated. It is the only one where the trial ended and nobody asked to go back.',
    name: 'Amara Belhadj',
    role: 'VP Engineering',
    company: 'Kestrel Systems',
    rating: 4,
  },
  {
    quote:
      'Our audit went from a three-week scramble to a report we generate. I know that sounds like copy off your own website. It is what happened.',
    name: 'Ruth Mbeki',
    role: 'Head of Compliance',
    company: 'Fieldstone Bank',
    rating: 5,
  },
  {
    quote:
      'The onboarding was rough and we nearly gave up in week one. Two releases later the thing we were stuck on is a checkbox.',
    name: 'Jonas Weber',
    role: 'Principal Architect',
    company: 'Meridian Logistics',
    rating: 4,
  },
]

export function TestimonialCarousel({
  eyebrow = 'Customers',
  heading = 'Twenty months of people telling us what they actually thought',
  testimonials = DEFAULT_TESTIMONIALS,
  className = '',
}: TestimonialCarouselProps) {
  const railRef = React.useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)

  /*
    One handler for both ends, run on scroll and once on mount. The 1px slack
    absorbs sub-pixel scroll positions, which otherwise leave the "next"
    arrow enabled at the very end on fractional-DPI displays.
  */
  const syncEnds = React.useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    setAtStart(rail.scrollLeft <= 1)
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    syncEnds()
    const rail = railRef.current
    if (!rail) return
    const observer = new ResizeObserver(syncEnds)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [syncEnds])

  /** Scroll by one card, measured off the rail rather than a magic number. */
  const nudge = (direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 24 : rail.clientWidth * 0.8
    rail.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  const arrowClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <section
      aria-labelledby="carousel-heading"
      className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          <h2
            id="carousel-heading"
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            className={arrowClass}
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
            <span className="sr-only">Previous quotes</span>
          </button>
          <button type="button" onClick={() => nudge(1)} disabled={atEnd} className={arrowClass}>
            <ChevronRight aria-hidden className="h-5 w-5" />
            <span className="sr-only">More quotes</span>
          </button>
        </div>
      </div>

      <ul
        ref={railRef}
        onScroll={syncEnds}
        tabIndex={0}
        role="group"
        aria-label="Customer quotes, scrollable"
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {testimonials.map((testimonial) => (
          <li
            key={testimonial.name}
            className="flex w-[19rem] shrink-0 snap-start flex-col rounded-2xl border border-border/60 bg-card/80 p-6 sm:w-[22rem]"
          >
            {testimonial.rating !== undefined && (
              <p className="flex items-center gap-0.5">
                <span className="sr-only">{testimonial.rating} out of 5</span>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={
                      i < (testimonial.rating ?? 0)
                        ? 'h-4 w-4 fill-primary text-primary'
                        : 'h-4 w-4 fill-muted text-muted'
                    }
                  />
                ))}
              </p>
            )}

            <figure className="mt-4 flex flex-1 flex-col">
              <blockquote className="flex-1">
                <p className="text-pretty leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                >
                  {testimonial.name
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0] ?? '')
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="text-sm leading-snug">
                  <span className="block font-semibold text-foreground">{testimonial.name}</span>
                  <span className="block text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
