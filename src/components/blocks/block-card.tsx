/**
 * A block's card in a grid — thumbnail, name, description, metadata.
 *
 * The whole card is one link. An overlay anchor spanning the card gives the
 * thumbnail and the body a single hit target while leaving the accessible
 * name on the title, so the link is announced as "Bento Feature Grid" and
 * not as the entire contents of the section it is previewing.
 */

import * as React from 'react'
import Link from 'next/link'
import { Package, FileCode } from 'lucide-react'
import { BlockThumbnail } from './block-preview'
import { ArtifactUpdated } from '@/components/artifact-updated'
import { CardHoverActions } from '@/components/card-hover-actions'
import { CardStats, UsageCount } from '@/components/usage-count'
import { blockCategorySlug, type BlockMeta } from '@/lib/blocks/block-types'

export function BlockCard({ block }: { block: BlockMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="relative">
        <BlockThumbnail componentKey={block.previewComponent} height={block.thumbHeight} />
        <CardHoverActions
          artifact={{
            id: block.id,
            name: block.name,
            category: block.category,
            level: 'block',
          }}
          href={`/block/${block.id}`}
          className="right-2 top-2"
        />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/block/${block.id}`}
            prefetch={false}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {block.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {block.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {/* Relative to the card's link overlay, so it stays clickable. */}
          <Link
            href={`/blocks/${blockCategorySlug(block.category)}`}
            prefetch={false}
            className="relative z-10 font-medium transition-colors hover:text-foreground"
          >
            {block.category}
          </Link>

          <span className="inline-flex items-center gap-1">
            <FileCode aria-hidden className="h-3.5 w-3.5" />
            {block.lines} lines
          </span>

          <span className="inline-flex items-center gap-1">
            <Package aria-hidden className="h-3.5 w-3.5" />
            {block.deps.length === 0
              ? 'No deps'
              : `${block.deps.length} dep${block.deps.length > 1 ? 's' : ''}`}
          </span>

          {/* The date is static and in the HTML; the three counts arrive
              from Firestore afterwards and are each independently absent.
              The metadata row already wraps, so a card that gains four
              items and one that gains none both stay aligned. */}
          <ArtifactUpdated level="block" id={block.id} />

          <UsageCount id={block.id} className="font-medium text-foreground/70" />

          <CardStats id={block.id} />
        </div>
      </div>
    </article>
  )
}
