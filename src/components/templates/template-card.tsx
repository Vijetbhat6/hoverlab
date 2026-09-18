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
import { Route, LayoutTemplate, Blocks, Lock, Sparkles } from 'lucide-react'
import { ArtifactThumbnail } from '@/components/artifact-preview'
import { ArtifactUpdated } from '@/components/artifact-updated'
import { CardHoverActions } from '@/components/card-hover-actions'
import { CardStats, UsageCount } from '@/components/usage-count'
import { PaletteScope } from '@/components/templates/palette-scope'
import { getPagePreview } from '@/lib/pages/registry'
import { getPalette, paletteSwatch } from '@/lib/templates/palettes'
import type { TemplateMeta } from '@/lib/templates/template-types'

export function TemplateCard({ template }: { template: TemplateMeta }) {
  const first = template.routes[0]
  const previewPageId = template.previewPageId ?? first?.pageId
  const palette = getPalette(template.palette)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      {/* Only the thumbnail is scoped. The card's own chrome — the Pro
          badge, the counts, the hover border — belongs to this site and
          should stay in this site's colours, or a grid of four palettes
          stops reading as one page. */}
      <PaletteScope palette={template.palette} className="contents">
        <ArtifactThumbnail
          preview={previewPageId ? getPagePreview(previewPageId) : undefined}
          missingKey={previewPageId ?? template.id}
          height="h-80"
        />
      </PaletteScope>

      {template.tier === 'pro' ? (
        <span className="pointer-events-none absolute right-5 top-5 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm ring-1 ring-primary/30 backdrop-blur">
          <Lock aria-hidden className="h-3 w-3" />
          Pro
        </span>
      ) : null}

      {/*
        Left, not right: the Pro badge owns the right corner on the paid
        templates, and an overlay that appeared under the reader's cursor
        on top of it would cover the one thing on the card that says what
        buying it gets you. Positioned against the article rather than a
        thumbnail wrapper — this card has none, because `PaletteScope`
        already wraps the thumbnail and re-colours anything inside it.
      */}
      <CardHoverActions
        artifact={{
          id: template.id,
          name: template.name,
          category: template.category,
          level: 'template',
        }}
        href={`/template/${template.id}`}
        className="left-5 top-5"
      />

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug tracking-tight">
          <Link
            href={`/template/${template.id}`}
            prefetch={false}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {template.name}
          </Link>
        </h3>

        {/*
            The set piece, directly under the name and above the
            description.

            This is the line the card is sold on. A grid of thirty-two
            cards whose only distinguishing text is "a landing page for X"
            is thirty-two copies of one sentence, and a visitor scanning it
            has no basis for opening any of them — so the one concrete
            screen goes first and the description follows as context.

            `truncate` rather than a clamp: the name is capped at 45
            characters by `templates.test.ts` precisely so it fits on one
            line, and if a longer one ever slips past that test, cutting it
            is better than growing this card taller than the three beside
            it. The full sentence behind it lives on the detail page.
        */}
        {template.setPiece ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{template.setPiece.name}</span>
          </p>
        ) : null}

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

          {/* The palette, named. The thumbnail above already shows the
              colour; this says it is a decision with a name and a file
              behind it rather than a screenshot that happened to be green.
              The swatch is `aria-hidden` because the name beside it is the
              accessible version of the same information. */}
          {palette ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-border/60"
                style={{ background: paletteSwatch(palette) }}
              />
              {palette.name}
            </span>
          ) : null}

          {/* Absent on anything nobody copied this week — see <UsageCount>.
              It sits after the palette rather than among the three counts,
              which are properties of the template; this one is a property
              of the week. */}
          <UsageCount id={template.id} className="font-medium text-foreground/70" />

          <CardStats id={template.id} />

          <ArtifactUpdated level="template" id={template.id} />
        </div>
      </div>
    </article>
  )
}
