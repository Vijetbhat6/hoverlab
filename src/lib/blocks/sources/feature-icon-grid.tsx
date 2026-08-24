/**
 * <FeatureIconGrid> — the plain three-across feature grid.
 *
 * Deliberately the least clever block in the marketing set, and absent from
 * the catalog until now. <BentoFeatures> composes an asymmetric picture,
 * <FeatureTabs> hides two features to give one the stage, <FeatureRows>
 * spends a full row each. All three are choices, and all three are wrong
 * when there are nine things to say and none of them outranks the others —
 * a bento of nine tiles is a wall, and nine tabs is a filing cabinet.
 *
 * So the design decision here is restraint: uniform cells, no spans, no
 * state, in source order. The grid stops being about itself and lets the
 * nine headings do the work, which is exactly what a features page under a
 * hero is for.
 *
 * Icons are decorative and marked `aria-hidden`. They give the eye a
 * fixation point per cell and carry no meaning the heading does not already
 * carry — a screen reader announcing "sparkles, no login to copy" is worse
 * off, not better.
 *
 * Icons arrive as component references rather than elements, so the caller
 * passes `Zap` and not `<Zap />` and this block keeps control of sizing.
 * The map is built at module scope, so the component identity is stable and
 * a cell does not remount on every render.
 */

import * as React from 'react'
import {
  Boxes,
  Code2,
  Gauge,
  KeyRound,
  Palette,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react'

/** A lucide icon, or anything with the same call signature. */
type IconType = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

export interface IconFeature {
  icon: IconType
  title: string
  body: string
}

export interface FeatureIconGridProps {
  features?: IconFeature[]
  heading?: string
  subheading?: string
  /** Columns at `lg`. Two suits longer copy; four suits one-liners. */
  columns?: 2 | 3 | 4
  className?: string
}

const DEFAULT_FEATURES: IconFeature[] = [
  {
    icon: Sparkles,
    title: 'Copy without an account',
    body: 'Every artifact is readable and copyable signed out. The wall is on commercial use, not on looking.',
  },
  {
    icon: Palette,
    title: 'Your colours, applied',
    body: 'Set a brand palette once and the whole catalog previews in it, so what you copy already matches.',
  },
  {
    icon: Code2,
    title: 'Plain TSX and utilities',
    body: 'No runtime package, no wrapper components, nothing to keep in step with a version of ours.',
  },
  {
    icon: Terminal,
    title: 'A CLI that scaffolds',
    body: 'Install a component, a page or a whole template into an existing project from the terminal.',
  },
  {
    icon: Puzzle,
    title: 'Agent-installable',
    body: 'An MCP server your editor can call, so the component arrives without anyone opening a browser.',
  },
  {
    icon: KeyRound,
    title: 'A public API with no key',
    body: 'The catalog is a plain unauthenticated REST surface. Read it, script it, mirror it.',
  },
  {
    icon: ShieldCheck,
    title: 'Accessible by default',
    body: 'Real semantics, real focus states, and decorative motion gated behind prefers-reduced-motion.',
  },
  {
    icon: Gauge,
    title: 'No layout shift',
    body: 'Panels are drawn rather than fetched, so nothing reflows while a remote asset decides to arrive.',
  },
  {
    icon: Boxes,
    title: 'One ladder, four rungs',
    body: 'Effects build blocks, blocks build pages, pages build templates — one system rather than four products.',
  },
]

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function FeatureIconGrid({
  features = DEFAULT_FEATURES,
  heading = 'Everything in the box',
  subheading = 'No tiers on the reading, no account on the copying.',
  columns = 3,
  className = '',
}: FeatureIconGridProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      {heading ? (
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-3 text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
      ) : null}

      <ul className={`grid grid-cols-1 gap-x-8 gap-y-10 ${COLUMN_CLASS[columns]}`}>
        {features.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/60">
              <Icon aria-hidden className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold leading-snug">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
