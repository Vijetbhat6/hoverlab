'use client'

/**
 * LibraryProTile — the Pro plan, sold as tile one of the /library grid.
 *
 * Pricing lived in a section of the landing page and nowhere in the
 * browse flow, which meant the plan only ever reached people who had not
 * started using the catalog yet. Someone eleven pages into the effects
 * grid is the person most likely to want everything unlocked, and they
 * were the one person never shown the offer.
 *
 * So it competes for attention where the attention is, in the same card
 * shell as the effects around it — same border, same radius, same two
 * metadata lines, the price sitting exactly where each effect card says
 * "Free". It reads as one more item in the grid, which is the point: a
 * banner gets scrolled past, a tile gets read.
 *
 * Price, currency ladder and checkout all already existed; this is a
 * shell around `PLANS.pro`.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

/** The three lines that fit. Kept short — this is a tile, not the pricing page. */
const PERKS = ['Every effect, block, page and template', 'Bundle export as CSS, Vue, Svelte, Tailwind', 'One payment — no subscription']

export function LibraryProTile() {
  const pro = PLANS.pro

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden border-primary/30 bg-card/80 backdrop-blur transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10',
      )}
    >
      {/* Same h-40 as the preview on every effect card, so the row lines up. */}
      <div className="relative flex h-40 flex-col justify-center gap-2 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Lock aria-hidden className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-bold tracking-tight">Hoverlab {pro.name}</span>
        </div>
        <ul className="space-y-1">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-1.5 text-[11px] leading-tight text-muted-foreground">
              <Check aria-hidden className="mt-px h-3 w-3 shrink-0 text-primary" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      {/* The two metadata lines, in the effect card's positions. */}
      <div className="flex flex-col gap-1 border-t border-primary/20 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold tracking-tight">
            <Link
              href="/#pricing"
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Unlock everything
            </Link>
          </h3>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {formatPrice(pro.priceCents)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            All access
          </span>
          <Link
            href="/#pricing"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            See what&apos;s in it
          </Link>
        </div>
      </div>
    </Card>
  )
}
