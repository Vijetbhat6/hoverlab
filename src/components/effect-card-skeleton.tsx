'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EffectMeta } from '@/lib/effect-index'

/**
 * Placeholder shown while an effect's markup + CSS are in flight.
 *
 * The client ships effect metadata only, so a card's name, category, and
 * description are already known at this point — only the live preview is
 * waiting on `/api/effects/batch`. Rendering the real text immediately
 * (rather than grey bars) keeps the grid readable and stops the layout
 * from shifting when the preview lands.
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
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{meta.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {meta.category}
          </Badge>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {meta.description}
        </p>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div
          className="flex h-40 animate-pulse items-center justify-center rounded-lg bg-muted/60"
          role="status"
          aria-label={`Loading preview for ${meta.name}`}
        />
      </CardContent>
    </Card>
  )
}
