'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import type { EffectMeta } from '@/lib/effect-index'

/**
 * Placeholder shown while an effect's markup + CSS are in flight.
 *
 * The client ships effect metadata only, so a card's name and category
 * are already known at this point — only the live preview is waiting on
 * `/api/effects/batch`. Rendering the real text immediately (rather than
 * grey bars) keeps the grid readable and stops the layout from shifting
 * when the preview lands.
 *
 * The shape mirrors <EffectCard> exactly — h-40 preview, then the two
 * metadata lines — for the same reason: this swaps in place, and any
 * disagreement about height is a jump in a 24-tile grid.
 *
 * Only generated effects reach this state. Hand-crafted ones are bundled
 * and render fully on the first paint.
 */
export function EffectCardSkeleton({ meta }: { meta: EffectMeta }) {
  return (
    <Card
      className="flex flex-col overflow-hidden border-border/60 bg-card/80 backdrop-blur"
      aria-busy="true"
    >
      <div
        className="h-40 animate-pulse bg-muted/60"
        role="status"
        aria-label={`Loading preview for ${meta.name}`}
      />
      <div className="flex flex-col gap-1 border-t border-border/60 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold tracking-tight">{meta.name}</h3>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {meta.featured ? 'Featured' : 'Free'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {meta.category}
          </span>
          <span className="h-7 w-16 shrink-0 animate-pulse rounded-md bg-muted/60" />
        </div>
      </div>
    </Card>
  )
}
