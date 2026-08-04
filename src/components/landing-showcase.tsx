'use client'

/**
 * LandingShowcase — a small client-side gallery of live effect previews
 * for the public landing page. Renders 4 featured effects (button,
 * loader, text, background) so visitors can see the library's range
 * without logging in.
 *
 * Each tile injects the effect's CSS via a <style> tag (same pattern as
 * EffectCard) and renders the effect's HTML markup. The tiles are
 * display-only — no favorites / bundle buttons on the landing page
 * (those require auth).
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getBundledEffect } from '@/lib/bundled-effects'
import type { Effect } from '@/lib/effect-types'
import { cn } from '@/lib/utils'

// Pick 4 visually distinct featured effects for the showcase.
const SHOWCASE_IDS = ['btn-gradient', 'loader-orbit', 'text-shimmer', 'bg-aurora']

function getShowcaseEffects(): Effect[] {
  const out: Effect[] = []
  for (const id of SHOWCASE_IDS) {
    const e = getBundledEffect(id)
    if (e) out.push(e)
  }
  return out
}

export function LandingShowcase() {
  const effects = React.useMemo(() => getShowcaseEffects(), [])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {effects.map((effect) => (
        <ShowcaseTile key={effect.id} effect={effect} />
      ))}
    </div>
  )
}

function ShowcaseTile({ effect }: { effect: Effect }) {
  const surfaceDark = effect.darkSurface
  return (
    <Link
      href={`/effect/${effect.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5',
      )}
    >
      {/* Inject the effect CSS scoped to this tile only. */}
      <style dangerouslySetInnerHTML={{ __html: effect.css }} />

      {/* Preview area */}
      <div
        className={cn(
          'relative flex h-32 items-center justify-center overflow-hidden',
          surfaceDark ? 'bg-slate-950' : 'bg-background',
        )}
      >
        <div
          className="pointer-events-none flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: effect.html }}
        />
      </div>

      {/* Caption */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{effect.name}</p>
          <p className="truncate text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {effect.category}
          </p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  )
}
