'use client'

/**
 * The two personalization affordances the upper tiers were missing.
 *
 * `/block/[slug]`, `/page/[slug]` and `/template/[slug]` are server
 * components — deliberately, since a block detail page is static HTML plus
 * one live preview. Favoriting and view-tracking are localStorage, so they
 * need a client boundary, and these are it: two small islands rather than
 * turning a whole detail page into a client component to get a heart icon.
 *
 * Both take a plain artifact descriptor instead of a catalog record, so the
 * server page passes four strings and neither component pulls a catalog
 * into the client bundle.
 */

import * as React from 'react'
import { Heart } from 'lucide-react'

import { useFavorites } from '@/hooks/use-favorites'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import type { RecordableArtifact } from '@/lib/artifact-history'
import { LEVEL_LABEL, levelOf } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'

/**
 * Records a detail-page view. Renders nothing.
 *
 * Artifact ids are unique across all four tiers (verified against the
 * catalog — 4,402 artifacts, zero collisions), which is why the history and
 * favorites stores can stay keyed on a bare id and still hold a mix of
 * levels. `level` rides along so the rail can build the right href without
 * loading a catalog to look it up.
 */
export function TrackArtifactView({ artifact }: { artifact: RecordableArtifact }) {
  const { record } = useRecentlyViewed()

  // Depend on the id, not the object: a server component hands over a fresh
  // object literal on every render, and depending on it would re-record on
  // each one.
  const { id, name, category, level } = artifact
  React.useEffect(() => {
    record({ id, name, category, level })
  }, [record, id, name, category, level])

  return null
}

/**
 * Favorite toggle for a non-effect artifact.
 *
 * `useFavorites` already stored a `Set<string>` of ids and synced it to
 * Firestore, so nothing about the store had to change to hold a block —
 * what was missing was any control that could put one in.
 */
export function FavoriteArtifactButton({
  artifact,
  className = '',
}: {
  artifact: RecordableArtifact
  className?: string
}) {
  const { has, toggle } = useFavorites()
  const [mounted, setMounted] = React.useState(false)

  // Favorites live in localStorage, so the server render and the first
  // client render disagree by definition. Waiting a tick before reflecting
  // the real state keeps that out of hydration.
  React.useEffect(() => setMounted(true), [])

  const isFavorite = mounted && has(artifact.id)
  const noun = LEVEL_LABEL[levelOf(artifact)].one.toLowerCase()

  return (
    <button
      type="button"
      onClick={() => toggle(artifact.id)}
      aria-pressed={isFavorite}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isFavorite
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Heart aria-hidden className={cn('h-4 w-4', isFavorite && 'fill-current')} />
      {isFavorite ? 'Saved' : 'Save'}
      <span className="sr-only">
        {isFavorite ? `Remove this ${noun} from favorites` : `Save this ${noun} to favorites`}
      </span>
    </button>
  )
}
