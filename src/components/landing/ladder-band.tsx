'use client'

/**
 * <LadderBand> — the four tiers, on the landing page.
 *
 * Hoverlab reads as "a CSS effects library" until a visitor is told
 * otherwise, and that framing caps what they think to look for. This band
 * exists to say the quiet part early: the catalog goes from a single button
 * all the way up to a whole starter project, and you can enter at whichever
 * rung matches how much you want to build yourself.
 *
 * Unbuilt tiers are shown greyed rather than hidden. A ladder with the top
 * two rungs missing is still a clearer promise than pretending the ladder
 * only has two rungs — and it sets the expectation that they are coming.
 */

import * as React from 'react'
import Link from 'next/link'
import { Sparkles, Blocks, LayoutTemplate, Rocket, ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'

interface Rung {
  label: string
  count: string
  blurb: string
  icon: React.ReactNode
  href?: string
  accent: string
}

const RUNGS: Rung[] = [
  {
    label: 'Effects',
    count: TOTAL_COUNT.toLocaleString('en-US'),
    blurb: 'One element, styled right',
    icon: <Sparkles className="h-5 w-5" />,
    href: '/library',
    accent: 'text-primary',
  },
  {
    label: 'Blocks',
    count: `${BLOCK_COUNT}`,
    blurb: 'A whole section, laid out',
    icon: <Blocks className="h-5 w-5" />,
    href: '/blocks',
    accent: 'text-emerald-500',
  },
  {
    label: 'Pages',
    count: 'Soon',
    blurb: 'A finished screen',
    icon: <LayoutTemplate className="h-5 w-5" />,
    accent: 'text-sky-500',
  },
  {
    label: 'Templates',
    count: 'Soon',
    blurb: 'A project you can deploy',
    icon: <Rocket className="h-5 w-5" />,
    accent: 'text-amber-500',
  },
]

export function LadderBand() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Start at whichever rung you need
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Grab a single hover state, drop in an entire pricing section, or
          start from a project that already runs. Each tier is built from the
          one below it.
        </p>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {RUNGS.map((rung, i) => {
          const inner = (
            <>
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${
                  rung.href ? rung.accent : 'text-muted-foreground'
                }`}
              >
                {rung.icon}
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-extrabold tracking-tight ${
                    rung.href ? '' : 'text-muted-foreground'
                  }`}
                >
                  {rung.count}
                </span>
                <span className="text-sm font-semibold text-foreground/80">
                  {rung.label}
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">{rung.blurb}</p>

              {rung.href ? (
                <span
                  className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2 ${rung.accent}`}
                >
                  Browse
                  <ArrowRight aria-hidden className="h-3 w-3" />
                </span>
              ) : (
                <span className="mt-3 inline-block text-xs font-medium text-muted-foreground/70">
                  In progress
                </span>
              )}
            </>
          )

          return (
            <Reveal key={rung.label} delay={i * 70}>
              {rung.href ? (
                <Link
                  href={rung.href}
                  className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-2xl border border-dashed border-border/60 bg-card/40 p-5">
                  {inner}
                </div>
              )}
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
