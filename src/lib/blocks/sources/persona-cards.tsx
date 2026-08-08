/**
 * <PersonaCards> — a "who this is for" grid.
 *
 * Four cards, each naming an audience, the outcome they want, and the
 * bullets that get them there. The point is self-identification: a visitor
 * should find their own job title in the first screenful and stop
 * wondering whether the product is aimed at them.
 */

import * as React from 'react'
import { Code2, Palette, Rocket, GraduationCap, ArrowRight } from 'lucide-react'

export interface Persona {
  name: string
  headline: string
  bullets: string[]
  icon?: React.ReactNode
  /** Tailwind text-color class; the bullet marker derives from it. */
  accent?: string
  href?: string
  ctaLabel?: string
}

export interface PersonaCardsProps {
  personas?: Persona[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_PERSONAS: Persona[] = [
  {
    icon: <Code2 className="h-5 w-5" />,
    name: 'Frontend developers',
    headline: 'Ship polish without the busywork',
    bullets: [
      'Stop rewriting the same hover and focus states',
      'Drop a whole section in instead of assembling one',
      'No runtime means no bundle-size regression',
    ],
    accent: 'text-sky-500',
  },
  {
    icon: <Palette className="h-5 w-5" />,
    name: 'Designers',
    headline: 'Close the gap between the mock and the build',
    bullets: [
      'Show stakeholders something live, not a screenshot',
      'Tune spacing, colour and motion against real markup',
      'Hand over a link instead of a spec document',
    ],
    accent: 'text-rose-500',
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    name: 'Founders',
    headline: 'Make an MVP feel like a funded product',
    bullets: [
      'A credible landing page in an afternoon',
      'No design hire required to launch',
      'Commercial use covered — ship it and charge for it',
    ],
    accent: 'text-amber-500',
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    name: 'Learners',
    headline: 'Read patterns that are actually in production',
    bullets: [
      'Every source is commented and idiomatic',
      'Learn layout and motion by working example',
      'Fork a piece and break it — nothing to set up',
    ],
    accent: 'text-emerald-500',
  },
]

export function PersonaCards({
  personas = DEFAULT_PERSONAS,
  heading = 'Built for everyone who ships UI',
  subheading = 'Whichever seat you are in, the work starts further along.',
  className = '',
}: PersonaCardsProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {personas.map((p) => {
          const accent = p.accent ?? 'text-primary'
          return (
            <div
              key={p.name}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="relative">
                {p.icon ? (
                  <div
                    className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${accent}`}
                  >
                    {p.icon}
                  </div>
                ) : null}
                <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                <p className="mt-1 text-sm font-medium text-foreground/80">{p.headline}</p>

                <ul className="mt-4 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent.replace('text-', 'bg-')}`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {p.href ? (
                  <a
                    href={p.href}
                    className={`mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2 ${accent}`}
                  >
                    {p.ctaLabel ?? 'Get started'}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
