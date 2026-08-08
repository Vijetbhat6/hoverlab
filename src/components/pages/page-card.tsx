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
import { Blocks, FileCode } from 'lucide-react'
import { PageThumbnail } from './page-preview'
import type { PageMeta } from '@/lib/pages/page-types'

export function PageCard({ page }: { page: PageMeta }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <PageThumbnail componentKey={page.previewComponent} />

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/page/${page.id}`}
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
        </div>
      </div>
    </article>
  )
}
