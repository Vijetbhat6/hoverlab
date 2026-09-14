/**
 * A primitive's card in a grid — demo, name, description, metadata.
 *
 * The whole card is one link, via an overlay anchor spanning it, so the
 * demo and the body share a hit target while the accessible name stays on
 * the title. Same pattern as `BlockCard`, and the same reason: without it
 * the link is announced as the entire contents of the control it previews.
 *
 * The one row that differs from a block's is "No deps". On a block that is
 * a nice-to-have; here it is the tier's argument, so it is stated on every
 * card rather than only where it is true.
 */

import * as React from 'react'
import Link from 'next/link'
import { FileCode, Package } from 'lucide-react'

import { PrimitiveThumbnail } from './primitive-preview'
import { ArtifactUpdated } from '@/components/artifact-updated'
import { CardHoverActions } from '@/components/card-hover-actions'
import { CardStats, UsageCount } from '@/components/usage-count'
import {
  primitiveCategorySlug,
  type PrimitiveMeta,
} from '@/lib/primitives/primitive-types'

export function PrimitiveCard({ primitive }: { primitive: PrimitiveMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="relative">
        <PrimitiveThumbnail
          componentKey={primitive.previewComponent}
          height={primitive.thumbHeight}
        />
        <CardHoverActions
          artifact={{
            id: primitive.id,
            name: primitive.name,
            category: primitive.category,
            level: 'primitive',
          }}
          href={`/primitive/${primitive.id}`}
          className="right-2 top-2"
        />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/primitive/${primitive.id}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {primitive.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {primitive.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {/* Relative to the card's link overlay, so it stays clickable. */}
          <Link
            href={`/primitives/${primitiveCategorySlug(primitive.category)}`}
            className="relative z-10 font-medium transition-colors hover:text-foreground"
          >
            {primitive.category}
          </Link>

          <span className="inline-flex items-center gap-1">
            <FileCode aria-hidden className="h-3.5 w-3.5" />
            {primitive.lines} lines
          </span>

          <span
            className={`inline-flex items-center gap-1 ${primitive.deps.length === 0 ? 'font-medium text-foreground/70' : ''}`}
          >
            <Package aria-hidden className="h-3.5 w-3.5" />
            {primitive.deps.length === 0
              ? 'No deps'
              : `${primitive.deps.length} dep${primitive.deps.length > 1 ? 's' : ''}`}
          </span>

          <ArtifactUpdated level="primitive" id={primitive.id} />

          <UsageCount id={primitive.id} className="font-medium text-foreground/70" />

          <CardStats id={primitive.id} />
        </div>
      </div>
    </article>
  )
}
