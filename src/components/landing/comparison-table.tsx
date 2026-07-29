'use client'

/**
 * <ComparisonTable> — Hoverlab vs writing CSS from scratch vs npm packages.
 *
 * 4 columns: feature | Hoverlab | From scratch | npm package
 * 8 rows comparing key dimensions. Hoverlab column highlighted with
 * primary tint background. Check/X marks; partial = "Limited" text.
 *
 * Persuasive but honest — npm packages aren't bad, they're just a
 * different tradeoff. Hoverlab wins on copy-paste simplicity and
 * zero-dependency safety; loses on ecosystem depth.
 */

import * as React from 'react'
import { Check, X, Minus } from 'lucide-react'
import { Reveal } from '@/components/reveal'

type CellValue = 'yes' | 'no' | 'partial'

interface Row {
  feature: string
  hoverlab: CellValue
  scratch: CellValue
  npm: CellValue
  note?: string
}

const ROWS: Row[] = [
  {
    feature: 'Setup time',
    hoverlab: 'yes',
    scratch: 'no',
    npm: 'partial',
    note: 'Copy-paste vs hours writing/testing vs npm install + bundler config',
  },
  {
    feature: 'Bundle size impact',
    hoverlab: 'yes',
    scratch: 'yes',
    npm: 'no',
    note: '0KB JS, CSS only — vs 0KB vs typically 5–50KB JS per package',
  },
  {
    feature: 'Dependency risk',
    hoverlab: 'yes',
    scratch: 'yes',
    npm: 'no',
    note: 'No supply chain — vs none — vs tracked in your lockfile forever',
  },
  {
    feature: 'Framework lock-in',
    hoverlab: 'yes',
    scratch: 'yes',
    npm: 'partial',
    note: 'Plain HTML/CSS works anywhere — vs same — vs usually React-only',
  },
  {
    feature: 'Live customization',
    hoverlab: 'yes',
    scratch: 'no',
    npm: 'partial',
    note: 'Built-in sliders + brand colors — vs hand-edit — vs depends on API',
  },
  {
    feature: 'Accessibility built-in',
    hoverlab: 'yes',
    scratch: 'no',
    npm: 'partial',
    note: 'prefers-reduced-motion out of the box — vs your responsibility — vs varies',
  },
  {
    feature: 'Ecosystem depth',
    hoverlab: 'partial',
    scratch: 'no',
    npm: 'yes',
    note: '40+ curated effects — vs unlimited if you write them — vs millions of packages',
  },
  {
    feature: 'Free for commercial use',
    hoverlab: 'yes',
    scratch: 'yes',
    npm: 'partial',
    note: 'MIT — vs yours — vs check each license',
  },
]

function Cell({ value }: { value: CellValue }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-emerald-500" aria-label="Yes" />
      </span>
    )
  }
  if (value === 'no') {
    return (
      <span className="inline-flex items-center justify-center">
        <X className="h-4 w-4 text-rose-500/70" aria-label="No" />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center">
      <Minus className="h-4 w-4 text-amber-500" aria-label="Partial" />
    </span>
  )
}

export function ComparisonTable() {
  return (
    <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            How Hoverlab compares
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three ways to add CSS effects to your project. Hoverlab isn&apos;t
            always the right answer — but it usually is.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-2 border-b border-border/60 bg-muted/40 px-4 py-4 text-sm font-semibold sm:px-6">
              <div className="text-muted-foreground">Feature</div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Hoverlab
                </span>
              </div>
              <div className="text-center text-muted-foreground">From scratch</div>
              <div className="text-center text-muted-foreground">npm package</div>
            </div>

            {/* Body rows */}
            {ROWS.map((row, i) => (
              <div
                key={i}
                className={
                  'grid grid-cols-4 items-center gap-2 px-4 py-3.5 text-sm transition-colors hover:bg-muted/30 sm:px-6 ' +
                  (i !== ROWS.length - 1 ? 'border-b border-border/40' : '')
                }
              >
                <div className="font-medium">
                  {row.feature}
                  {row.note && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {row.note}
                    </div>
                  )}
                </div>
                <div className="rounded-md bg-primary/5 py-1 text-center">
                  <Cell value={row.hoverlab} />
                </div>
                <div className="text-center">
                  <Cell value={row.scratch} />
                </div>
                <div className="text-center">
                  <Cell value={row.npm} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={160} className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Best in class
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-amber-500" /> Partial / depends
          </span>
          <span className="inline-flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-rose-500/70" /> Not great
          </span>
        </Reveal>
      </div>
    </section>
  )
}
