/**
 * A page's card in a grid.
 *
 * Carries the block count rather than a dependency count — at this tier
 * "made of 9 blocks" is the useful number, and it is also the hook for the
 * drill-down: the card is the first place a visitor learns that a page is
 * not a monolith.
 */

import * as React from 'react'
import Link from 'next/link'
import { Blocks, FileCode, Layers2 } from 'lucide-react'
import { PageThumbnail } from './page-preview'
import { ArtifactUpdated } from '@/components/artifact-updated'
import { CardHoverActions } from '@/components/card-hover-actions'
import { CardStats, UsageCount } from '@/components/usage-count'
import { takeNumber } from '@/lib/pages/page-index'
import type { PageMeta } from '@/lib/pages/page-types'

export function PageCard({ page }: { page: PageMeta }) {
  // Undefined on a page type with only one layout — see takeNumber(). The
  // badge is the whole point of shipping two takes: on a card it is the
  // only signal that this layout is a choice rather than the answer.
  const take = takeNumber(page.id)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="relative">
        <PageThumbnail componentKey={page.previewComponent} />
        {take ? (
          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur">
            <Layers2 aria-hidden className="h-3 w-3" />
            Take {take.n} of {take.of}
          </span>
        ) : null}

        {/* Opposite corner from the take badge, which is why this one is
            positioned by the caller — see <CardHoverActions>. */}
        <CardHoverActions
          artifact={{
            id: page.id,
            name: page.name,
            category: page.category,
            level: 'page',
          }}
          href={`/page/${page.id}`}
          className="right-2 top-2"
        />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/page/${page.id}`}
            prefetch={false}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {page.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {page.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{page.category}</span>

          <span className="inline-flex items-center gap-1">
            <Blocks aria-hidden className="h-3.5 w-3.5" />
            {page.composedOf.length} blocks
          </span>

          <span className="inline-flex items-center gap-1">
            <FileCode aria-hidden className="h-3.5 w-3.5" />
            {page.lines} lines
          </span>

          {/* Absent on anything nobody copied this week — see <UsageCount>.
              The date above it is static; these arrive after the HTML. */}
          <ArtifactUpdated level="page" id={page.id} />

          <UsageCount id={page.id} className="font-medium text-foreground/70" />

          <CardStats id={page.id} />
        </div>
      </div>
    </article>
  )
}
