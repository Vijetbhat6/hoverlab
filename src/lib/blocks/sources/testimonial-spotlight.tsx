/**
 * <TestimonialSpotlight> — one quote, given the whole section.
 *
 * A wall of six testimonials averages out to noise; one customer telling a
 * specific story is what a prospect actually repeats to their boss. The
 * gamble of a single quote is that anecdotes are dismissible — so the stat
 * column sits beside it, converting "Meridian liked it" into "and here is
 * what changed", each number attributed to the same rollout as the quote.
 *
 * The quote is a real <figure>/<blockquote>/<figcaption>, so the
 * attribution is programmatically tied to the words it vouches for.
 */

import * as React from 'react'
import { Quote } from 'lucide-react'

export interface SpotlightStat {
  value: string
  label: string
}

export interface TestimonialSpotlightProps {
  quote?: string
  name?: string
  role?: string
  company?: string
  stats?: SpotlightStat[]
  logos?: string[]
  className?: string
}

const DEFAULT_STATS: SpotlightStat[] = [
  { value: '48%', label: 'fewer escalations to engineering' },
  { value: '11 min', label: 'median first-response time, down from 3.2 hrs' },
  { value: '4 weeks', label: 'from pilot to full support-team rollout' },
]

const DEFAULT_LOGOS = ['Meridian', 'Coastline Health', 'Fieldstone']

export function TestimonialSpotlight({
  quote = 'We had tried two other tools and rolled both back. This one stuck because the agents stopped asking us to change how they work — the queue finally matched how support actually thinks about a bad morning.',
  name = 'Ingrid Solheim',
  role = 'VP of Customer Experience',
  company = 'Meridian Logistics',
  stats = DEFAULT_STATS,
  logos = DEFAULT_LOGOS,
  className = '',
}: TestimonialSpotlightProps) {
  return (
    <section className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="grid gap-10 rounded-2xl border border-border/60 bg-card/80 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:gap-16">
        <figure className="max-w-2xl">
          <Quote aria-hidden className="h-8 w-8 text-primary/40" />

          <blockquote className="mt-5">
            <p className="text-pretty text-xl font-medium leading-relaxed tracking-tight text-foreground sm:text-2xl">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>

          <figcaption className="mt-8 flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0] ?? '')
                .join('')
                .toUpperCase()}
            </span>
            <span className="text-sm">
              <span className="block font-semibold">{name}</span>
              <span className="block text-muted-foreground">
                {role}, {company}
              </span>
            </span>
          </figcaption>
        </figure>

        <dl className="grid content-center gap-6 border-border/60 max-lg:border-t max-lg:pt-8 sm:max-lg:grid-cols-3 lg:min-w-52 lg:border-l lg:pl-16">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-3xl font-bold tracking-tight text-primary">{stat.value}</dd>
              <dd className="mt-1 text-sm leading-snug text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trusted by support teams at
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map((logo) => (
            <li key={logo}>
              <span className="text-lg font-bold tracking-tight text-muted-foreground/60">
                {logo}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
