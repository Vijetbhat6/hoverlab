'use client'

/**
 * Save / bundle / compare / open, revealed on a card's thumbnail.
 *
 * `EffectCard` has had this overlay since the grid stopped being 24 copies
 * of the detail page; the other four tiers never got it. A block card was
 * one big link and nothing else, so saving a block meant opening it,
 * finding the button, and coming back — three navigations to do the thing
 * a heart on the tile does in one click. The affordance existed at every
 * tier (`FavoriteArtifactButton` and friends are level-agnostic); what was
 * missing was any way to reach it from a grid.
 *
 * ── WHY THIS IS A CLIENT ISLAND AND THE CARD IS NOT ─────────────────────
 *
 * `BlockCard`, `PageCard`, `PrimitiveCard` and `TemplateCard` are server
 * components rendering live React previews out of a registry. Making one a
 * client component to get a heart on it would pull its preview — and
 * transitively a good part of the catalog — into the browser bundle, on
 * pages that already ship about 4MB. This takes four strings and renders
 * four buttons, so the boundary costs the strings and nothing else.
 *
 * ── WHY IT IS POSITIONED BY THE CALLER ──────────────────────────────────
 *
 * Each card's thumbnail is a different height and two of them already have
 * something in a corner (a take badge on the left, a Pro badge on the
 * right). The overlay takes a `className` and each card says where it
 * goes, rather than this guessing and colliding with the badge on the one
 * tier that has one.
 *
 * ── WHY THE BUTTONS SIT ABOVE THE CARD'S LINK OVERLAY ───────────────────
 *
 * The whole card is one link, via an `::after` pseudo-element spanning it.
 * Anything interactive on top of that needs `relative z-10` or the link
 * swallows the click — the same reason the category chip in the metadata
 * row carries it. `stopPropagation` would not help: there is no click
 * handler to stop, only a larger anchor underneath.
 */

import * as React from 'react'
import { Check, ExternalLink, Heart, Package, Scale } from 'lucide-react'
import { toast } from 'sonner'

import { IconAction } from '@/components/icon-action'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { useFavorites } from '@/hooks/use-favorites'
import type { RecordableArtifact } from '@/lib/artifact-history'
import { LEVEL_LABEL, levelOf } from '@/lib/artifact-types'
import { reportSave } from '@/lib/report-usage'
import { cn } from '@/lib/utils'

export function CardHoverActions({
  artifact,
  href,
  className,
}: {
  artifact: RecordableArtifact
  /** The artifact's detail page — the same target as the card's own link. */
  href: string
  className?: string
}) {
  const { has: isSaved, toggle: toggleSave } = useFavorites()
  const { has: hasBundle, toggle: toggleBundle } = useBundle()
  const { has: hasCompare, toggle: toggleCompare, isFull: compareFull } = useCompare()

  /*
   * All three stores are localStorage, so the server render and the first
   * client render disagree by definition — the same reason
   * `FavoriteArtifactButton` waits a tick. Here it matters more than there:
   * this renders inside statically prerendered HTML, so an unguarded read
   * would mismatch on every saved card in a 290-card grid at once.
   */
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const saved = mounted && isSaved(artifact.id)
  const bundled = mounted && hasBundle(artifact.id)
  const comparing = mounted && hasCompare(artifact.id)
  const noun = LEVEL_LABEL[levelOf(artifact)].one.toLowerCase()

  return (
    <div
      className={cn(
        /*
         * `hover:none` keeps the overlay permanently visible on touch.
         * "Reveal on hover" is a synonym for "gone" on a phone, and these
         * are the only controls on the tile besides the link itself.
         */
        'absolute z-10 flex items-center gap-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
        className,
      )}
    >
      <IconAction
        href={href}
        label={`Open the full page for this ${noun}`}
        icon={<ExternalLink aria-hidden className="h-3.5 w-3.5" />}
      />

      <IconAction
        label={comparing ? 'Remove from compare' : 'Add to compare'}
        icon={<Scale aria-hidden className="h-3.5 w-3.5" />}
        pressed={comparing}
        disabled={compareFull && !comparing}
        onClick={() => {
          const result = toggleCompare({
            id: artifact.id,
            name: artifact.name,
            category: artifact.category,
            level: artifact.level,
          })
          if (result === 'added') toast.success(`Added "${artifact.name}" to compare`)
          else if (result === 'full') {
            toast.error('Compare is full', {
              description: 'Remove something from the compare drawer to add another.',
            })
          }
        }}
      />

      <IconAction
        label={bundled ? 'Remove from bundle' : 'Add to bundle'}
        icon={
          bundled ? (
            <Check aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Package aria-hidden className="h-3.5 w-3.5" />
          )
        }
        pressed={bundled}
        onClick={() =>
          toggleBundle({
            id: artifact.id,
            name: artifact.name,
            category: artifact.category,
            level: artifact.level,
          })
        }
      />

      <IconAction
        label={saved ? 'Remove from favorites' : 'Save to favorites'}
        tone="rose"
        icon={
          <Heart
            aria-hidden
            className={cn('h-3.5 w-3.5 transition-all', saved && 'scale-110 fill-current')}
          />
        }
        pressed={saved}
        onClick={() => {
          toggleSave(artifact.id)
          // The save counter on the tile is fed from here and from the
          // detail page's button, which are the only two places a save can
          // happen. `saved` is the state BEFORE the toggle, so the report
          // is the negation of it.
          reportSave(artifact.id, !saved)
        }}
      />
    </div>
  )
}
