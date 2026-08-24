/**
 * <TestimonialVideo> — quotes with a face attached to them.
 *
 * Every other testimonial block in this catalog is text a stranger has to
 * take on faith, and the faith is doing a lot of work: a written quote from
 * "Ingrid, VP of Customer Experience" is indistinguishable from a written
 * quote a marketer invented on a Tuesday. A recording is not. That is the
 * whole argument for this shape, and it is why the poster tile carries a
 * name and a company rather than a play button alone.
 *
 * The card is a link, not a `<video>`. Autoplaying six clips would download
 * megabytes nobody asked for and start six audio tracks; a real player also
 * belongs to whichever host the customer already uses. So each card is an
 * anchor to `href` with a pull-quote underneath, and swapping in a lightbox
 * means changing one element. Point `posterSrc` at your own still and the
 * drawn placeholder gets out of the way — there is no image asset shipped
 * here, so the block costs nothing until you give it one.
 *
 * The pull-quote is not decoration. A visitor who will not spend ninety
 * seconds on a video — most of them — still reads the sentence under it, so
 * the section has to make its case without a single play. Video that only
 * works when watched is a section that mostly does not work.
 *
 * Duration is stated in the link text rather than shown as a badge alone.
 * "Watch Priya, 1:48" tells someone deciding whether to click what it will
 * cost them, and it gives the link an accessible name that distinguishes it
 * from the five other links that would otherwise all read "Watch".
 */

import * as React from 'react'
import { Play } from 'lucide-react'

export interface VideoTestimonial {
  name: string
  role: string
  company: string
  /** The sentence that has to land for someone who never presses play. */
  pullQuote: string
  duration: string
  href?: string
  /** Your own still. Without one the card draws a tinted placeholder. */
  posterSrc?: string
}

export interface TestimonialVideoProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  testimonials?: VideoTestimonial[]
  className?: string
}

const DEFAULT_TESTIMONIALS: VideoTestimonial[] = [
  {
    name: 'Priya Ramachandran',
    role: 'Director of Platform',
    company: 'Alcove Health',
    pullQuote:
      'We replaced three internal tools with this and cut the on-call rota from nine people to four.',
    duration: '1:48',
    href: '#',
  },
  {
    name: 'Dara Okonkwo',
    role: 'Staff Engineer',
    company: 'Northwind Freight',
    pullQuote:
      'The part I tell other engineers about is the migration. One afternoon, no schema rewrite.',
    duration: '2:12',
    href: '#',
  },
  {
    name: 'Ruth Mbeki',
    role: 'Head of Compliance',
    company: 'Fieldstone Bank',
    pullQuote:
      'Audit used to be a three-week scramble across four teams. It is a report we generate now.',
    duration: '3:05',
    href: '#',
  },
]

export function TestimonialVideo({
  eyebrow = 'In their words',
  heading = 'Three customers, unscripted',
  subheading = 'Recorded on their own time, edited only for length. Transcripts on each page.',
  testimonials = DEFAULT_TESTIMONIALS,
  className = '',
}: TestimonialVideoProps) {
  return (
    <section
      aria-labelledby="video-testimonials-heading"
      className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id="video-testimonials-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{subheading}</p>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <li key={testimonial.name}>
            <figure className="group flex h-full flex-col">
              <a
                href={testimonial.href ?? '#'}
                className="relative block aspect-video overflow-hidden rounded-2xl border border-border/60 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {testimonial.posterSrc ? (
                  <img
                    src={testimonial.posterSrc}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                ) : (
                  /*
                    The placeholder, for a catalog page and for the minute
                    before real stills exist. Initials rather than a grey
                    rectangle, so a card without a poster still reads as a
                    person and the layout does not change when one arrives.
                  */
                  <span
                    aria-hidden
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-muted text-4xl font-bold tracking-tight text-primary/40"
                  >
                    {testimonial.name
                      .split(' ')
                      .slice(0, 2)
                      .map((word) => word[0] ?? '')
                      .join('')
                      .toUpperCase()}
                  </span>
                )}

                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center bg-foreground/10 transition-colors group-hover:bg-foreground/20"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 shadow-sm ring-1 ring-border/60 transition-transform duration-300 motion-safe:group-hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 fill-primary text-primary" />
                  </span>
                </span>

                <span className="sr-only">
                  Watch {testimonial.name} of {testimonial.company}, {testimonial.duration}
                </span>

                <span
                  aria-hidden
                  className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium tabular-nums text-foreground ring-1 ring-border/60"
                >
                  {testimonial.duration}
                </span>
              </a>

              <blockquote className="mt-5 flex-1">
                <p className="text-pretty leading-relaxed text-foreground">
                  &ldquo;{testimonial.pullQuote}&rdquo;
                </p>
              </blockquote>

              <figcaption className="mt-4 text-sm leading-snug">
                <span className="block font-semibold text-foreground">{testimonial.name}</span>
                <span className="block text-muted-foreground">
                  {testimonial.role}, {testimonial.company}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
