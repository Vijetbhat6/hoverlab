'use client'

/**
 * <StatsBand> — full-width numeric stats strip for the landing page.
 *
 * Sits between the hero and the live showcase. Four stats, each with
 * a number, a label, and a one-line caption. The whole band fades in
 * on scroll via <Reveal>; individual stats get a tiny `.fx-stat-pop`
 * animation on hover for affordance.
 *
 * Numbers are computed from the same EFFECTS / CATEGORIES source the
 * rest of the landing uses, so they stay in sync automatically.
 */

import * as React from 'react'
import { Reveal } from '@/components/reveal'
import { CATEGORIES, EFFECT_INDEX as EFFECTS } from '@/lib/effect-index'

interface Stat {
  value: string
  label: string
  caption: string
}

function buildStats(): Stat[] {
  return [
    {
      value: `${EFFECTS.length}+`,
      label: 'Effects',
      caption: 'Hand-crafted, all categories',
    },
    {
      value: `${CATEGORIES.length}`,
      label: 'Categories',
      caption: 'Buttons, loaders, cards, more',
    },
    {
      value: '0',
      label: 'Dependencies',
      caption: 'No npm, no supply-chain risk',
    },
    {
      value: '< 8KB',
      label: 'Per effect',
      caption: 'Average CSS, gzipped',
    },
  ]
}

export function StatsBand() {
  const stats = React.useMemo(() => buildStats(), [])
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="group bg-background/80 p-5 text-center backdrop-blur transition-colors hover:bg-background sm:p-6"
            >
              <div className="fx-stat-pop text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground/80">
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {s.caption}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
