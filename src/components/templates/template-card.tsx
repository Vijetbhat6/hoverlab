/**
 * A template's card in a grid.
 *
 * The thumbnail is the template's first route — its landing screen for a
 * marketing site, its dashboard for an admin panel. That is the screen
 * someone is deciding about, and it is the one the route table puts first.
 * A template that shares its first screen with another one overrides this
 * with `previewPageId`, so no two cards in a grid render the same picture.
 *
 * The three counts are the honest measure of what you get: routes you can
 * visit, pages underneath them, blocks underneath those.
 *
 * Pro templates are badged rather than hidden or dimmed. Every screen here
 * is still previewable, every route table still readable, and the file list
 * on the detail page is still complete — what the licence buys is the
 * source. A card that hid what it was selling would be a card nobody
 * clicked.
 */

import * as React from 'react'
import Link from 'next/link'
import { Route, LayoutTemplate, Blocks, Lock } from 'lucide-react'
import { ArtifactThumbnail } from '@/components/artifact-preview'
import { getPagePreview } from '@/lib/pages/registry'
import type { TemplateMeta } from '@/lib/templates/template-types'

export function TemplateCard({ template }: { template: TemplateMeta }) {
  const first = template.routes[0]
  const previewPageId = template.previewPageId ?? first?.pageId

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <ArtifactThumbnail
        preview={previewPageId ? getPagePreview(previewPageId) : undefined}
        missingKey={previewPageId ?? template.id}
        height="h-80"
      />

      {template.tier === 'pro' ? (
        <span className="pointer-events-none absolute right-5 top-5 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm ring-1 ring-primary/30 backdrop-blur">
          <Lock aria-hidden className="h-3 w-3" />
          Pro
        </span>
      ) : null}

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/template/${template.id}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {template.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {template.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Route aria-hidden className="h-3.5 w-3.5" />
            {template.routes.length} routes
          </span>
          <span className="inline-flex items-center gap-1">
            <LayoutTemplate aria-hidden className="h-3.5 w-3.5" />
            {template.composedOf.length} pages
          </span>
          <span className="inline-flex items-center gap-1">
            <Blocks aria-hidden className="h-3.5 w-3.5" />
            {template.blockCount} blocks
          </span>
        </div>
      </div>
    </article>
  )
}
