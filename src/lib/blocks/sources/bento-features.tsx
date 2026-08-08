/**
 * <BentoFeatures> — an asymmetric feature grid.
 *
 * Six tiles on a 4-column × 3-row grid at `lg`, each declaring its own span
 * so the layout reads as composed rather than tiled. Below `lg` every tile
 * collapses to full width in source order, which is why the most important
 * tile is first in the array rather than positioned by grid placement.
 */

import * as React from 'react'
import { Sparkles, Shield, Zap, Layers, Globe, Quote } from 'lucide-react'

export interface BentoTile {
  title: string
  body: string
  icon?: React.ReactNode
  /** Tailwind span classes applied at `lg` and up. */
  span?: string
  accent?: string
}

export interface BentoFeaturesProps {
  tiles?: BentoTile[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_TILES: BentoTile[] = [
  {
    title: 'Fast by default',
    body: 'No runtime, no hydration cost, no waterfall. What you paste is what the browser paints.',
    icon: <Sparkles className="h-5 w-5" />,
    span: 'sm:col-span-2 lg:row-span-2',
    accent: 'text-primary',
  },
  {
    title: 'Yours to keep',
    body: 'Copied code lives in your repo. Nothing phones home and nothing breaks when we ship.',
    icon: <Shield className="h-5 w-5" />,
    span: 'sm:col-span-2',
    accent: 'text-emerald-500',
  },
  {
    title: 'Zero dependencies',
    body: 'Nothing to audit.',
    icon: <Zap className="h-5 w-5" />,
    span: 'lg:row-span-2',
    accent: 'text-amber-500',
  },
  {
    title: 'Composable',
    body: 'Every piece works alone or nested inside the next one up.',
    icon: <Layers className="h-5 w-5" />,
    accent: 'text-sky-500',
  },
  {
    title: 'Accessible',
    body: 'Keyboard paths, focus rings and reduced-motion fallbacks included.',
    icon: <Globe className="h-5 w-5" />,
    accent: 'text-rose-500',
  },
  {
    title: '"It replaced our design system backlog."',
    body: 'Priya R., Staff Engineer',
    icon: <Quote className="h-5 w-5" />,
    span: 'sm:col-span-2',
    accent: 'text-violet-500',
  },
]

export function BentoFeatures({
  tiles = DEFAULT_TILES,
  heading = 'Everything, in one place',
  subheading = 'The parts you would otherwise rebuild on every project.',
  className = '',
}: BentoFeaturesProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3">
        {tiles.map((tile) => (
          <div
            key={tile.title}
            className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg ${tile.span ?? ''}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
            />
            <div className="relative flex h-full flex-col">
              {tile.icon ? (
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${tile.accent ?? 'text-foreground'}`}
                >
                  {tile.icon}
                </div>
              ) : null}
              <h3 className="text-lg font-bold tracking-tight">{tile.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tile.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
