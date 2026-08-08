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
import { blockCategorySlug, type BlockMeta } from '@/lib/blocks/block-types'

export function BlockCard({ block }: { block: BlockMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <BlockThumbnail componentKey={block.previewComponent} />

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug tracking-tight">
            <Link
              href={`/block/${block.id}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {block.name}
            </Link>
          </h3>

          {block.tier === 'pro' ? (
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              Pro
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {block.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {/* Relative to the card's link overlay, so it stays clickable. */}
          <Link
            href={`/blocks/${blockCategorySlug(block.category)}`}
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
        </div>
      </div>
    </article>
  )
}
