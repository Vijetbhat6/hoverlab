/**
 * /browse — one surface over all four tiers.
 *
 * The catalog grew a ladder (effect → block → page → template) but kept
 * four separate front doors, and search only ever covered the bottom rung.
 * Someone who types "pricing" wants the pricing block, the pricing page and
 * the pricing effects, ranked against each other — not to guess which of
 * four hubs to look in first. This is that surface.
 *
 * Server-rendered, and the filters are a plain GET form plus ordinary
 * links. That is not nostalgia: `/library` is the client-side grid with
 * live customization, and rebuilding it here would mean shipping the
 * 772 KB effect index to a page whose job is to *route people onward*.
 * Every control here is a URL, so the whole surface works before
 * JavaScript, is shareable, and costs one server render.
 *
 * `?level=` and `?category=` are filters, not new documents — the canonical
 * for every variant is `/browse`. The sitemap lists the bare URL only, for
 * the same reason it points at `/category/<slug>` instead of
 * `/library?filter=`: query-string URLs make weak canonicals, and the real
 * indexable landing pages for these terms are the tier hubs.
 */

import * as React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Layers, SlidersHorizontal } from 'lucide-react'

import { CatalogSearchForm } from '@/components/catalog-search-form'
import { hoverPeekCssFor } from '@/lib/hover-peek-css'
import { BlockCard } from '@/components/blocks/block-card'
import { PageCard } from '@/components/pages/page-card'
import { TemplateCard } from '@/components/templates/template-card'
import { EffectStaticCard } from '@/components/effect-static-card'
import { getEffect } from '@/lib/effects'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { getPageMeta } from '@/lib/pages/page-index'
import { getTemplateMeta } from '@/lib/templates/template-index'
import {
  searchArtifacts,
  categoriesAtLevel,
  parseLevel,
  BROWSE_TOTAL,
  LEVEL_TOTALS,
  type BrowseHit,
} from '@/lib/browse'
import { ARTIFACT_LEVELS, LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { absoluteUrl } from '@/lib/site'

const TITLE = `Browse all ${BROWSE_TOTAL.toLocaleString('en-US')} components — Hoverlab`
const DESCRIPTION =
  'Search every effect, block, page and template in one place — CSS atoms through whole multi-page starters, ranked together.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['ui components', 'css effects', 'react blocks', 'page templates', 'component search'],
  // Every filtered variant collapses to the bare URL. See the note above.
  alternates: { canonical: '/browse' },
  openGraph: {
    url: absoluteUrl('/browse'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * How many of each level to show when no level is selected.
 *
 * Effects get the smallest slice despite being 98% of the catalog: the
 * point of the unsegmented view is to prove the other three tiers exist,
 * and 4,300 effects will bury them given any budget at all.
 */
const PREVIEW_LIMIT: Record<ArtifactLevel, number> = {
  effect: 6,
  block: 6,
  page: 3,
  template: 3,
}

/** Cap on a single level's grid. Effects are the only level that reaches it. */
const LEVEL_LIMIT = 24

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; level?: string; category?: string }>
}

/** Build a /browse URL, dropping empty params so the bare URL stays clean. */
function browseHref(params: { q?: string; level?: string; category?: string }): string {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.level) search.set('level', params.level)
  if (params.category) search.set('category', params.category)
  const qs = search.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const level = parseLevel(params.level)
  // A category is only meaningful within a level — "Pricing" names a block
  // category and an effect category, and they are different taxonomies.
  const category = level ? params.category : undefined

  const { hits, countsByLevel, total } = searchArtifacts({ q, level, category })

  const grouped = level ? null : groupByLevel(hits)
  const shown = level ? hits.slice(0, LEVEL_LIMIT) : (grouped ?? []).flatMap((g) => g.items)

  // One <style> for every effect preview on the page. Class names are
  // globally unique per effect, so concatenation cannot collide.
  //
  // The second half is the hover-to-play CSS: without it, 44% of these
  // tiles are a still image until you land the pointer on the element
  // itself. See `lib/hover-peek-css`.
  const shownEffectCss = shown
    .filter((h) => h.level === 'effect')
    .map((h) => getEffect(h.id)?.css ?? '')
  const effectCss = [shownEffectCss.join('\n'), hoverPeekCssFor(shownEffectCss)]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Layers aria-hidden className="h-3.5 w-3.5" />
            Everything
          </span>
          <h1 className="type-hub mt-5">
            Browse the whole catalog
          </h1>
          <p className="mt-4 text-pretty text-body">
            {BROWSE_TOTAL.toLocaleString('en-US')} components across four tiers — a CSS
            hover state, a pricing section, a whole dashboard screen, or a project you can
            clone. One search over all of them.
          </p>
        </header>

        {/* The same form the landing hero now leads with. See
            <CatalogSearchForm> for why it is a plain GET. */}
        <CatalogSearchForm
          defaultValue={q}
          level={level}
          className="mx-auto mt-8 max-w-xl"
        />

        {/* -- Level rail ------------------------------------------------ */}
        <nav aria-label="Filter by tier" className="mt-6 flex flex-wrap justify-center gap-2">
          <LevelChip
            href={browseHref({ q })}
            label="All"
            count={q ? total + otherLevels(countsByLevel, level) : BROWSE_TOTAL}
            active={!level}
          />
          {ARTIFACT_LEVELS.map((l) => (
            <LevelChip
              key={l}
              href={browseHref({ q, level: l })}
              label={LEVEL_LABEL[l].many}
              count={q ? countsByLevel[l] : LEVEL_TOTALS[l]}
              active={level === l}
            />
          ))}
        </nav>

        {/* -- Category rail, scoped to the chosen level ----------------- */}
        {level ? (
          <nav
            aria-label={`Filter ${LEVEL_LABEL[level].many.toLowerCase()} by category`}
            className="mt-4 flex flex-wrap justify-center gap-1.5"
          >
            <CategoryChip
              href={browseHref({ q, level })}
              label="All categories"
              active={!category}
            />
            {categoriesAtLevel(level).map((c) => (
              <CategoryChip
                key={c}
                href={browseHref({ q, level, category: c })}
                label={c}
                active={category === c}
              />
            ))}
          </nav>
        ) : null}

        {/* -- Result summary ------------------------------------------- */}
        <p className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
          {q ? (
            <>
              <strong className="font-semibold text-foreground">{total.toLocaleString('en-US')}</strong>{' '}
              {total === 1 ? 'match' : 'matches'} for{' '}
              <span className="font-medium text-foreground">“{q}”</span>
            </>
          ) : (
            <>
              Showing{' '}
              <strong className="font-semibold text-foreground">
                {total.toLocaleString('en-US')}
              </strong>{' '}
              {level ? LEVEL_LABEL[level].many.toLowerCase() : 'components'}
            </>
          )}
        </p>

        {effectCss ? <style dangerouslySetInnerHTML={{ __html: effectCss }} /> : null}

        {/* -- Results --------------------------------------------------- */}
        {total === 0 ? (
          <EmptyState q={q} />
        ) : level ? (
          <>
            <div className="mt-8">
              <ResultGrid level={level} items={shown} />
            </div>
            {total > LEVEL_LIMIT ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Showing the first {LEVEL_LIMIT} of {total.toLocaleString('en-US')}.{' '}
                {level === 'effect' ? (
                  <Link
                    href={q ? `/library?q=${encodeURIComponent(q)}` : '/library'}
                    className="font-semibold text-primary hover:underline"
                  >
                    Open the full library →
                  </Link>
                ) : (
                  'Narrow it with a category or a search term.'
                )}
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-8 space-y-14">
            {(grouped ?? []).map((group) => (
              <section key={group.level}>
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
                  <h2 className="text-lg font-bold tracking-tight">
                    {LEVEL_LABEL[group.level].many}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {countsByLevel[group.level].toLocaleString('en-US')}
                    </span>
                  </h2>
                  <Link
                    href={browseHref({ q, level: group.level })}
                    className="shrink-0 text-sm font-semibold text-primary hover:underline"
                  >
                    See all →
                  </Link>
                </div>
                <ResultGrid level={group.level} items={group.items} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Pieces
 * ------------------------------------------------------------------ */

/**
 * Hits bucketed by level, each capped for the overview.
 *
 * Assembly first, atoms last — the reverse of `ARTIFACT_LEVELS`. Ladder
 * order is right for explaining the model and wrong for a result page: a
 * search for "pricing" returns 24 effects and 2 blocks, and putting the
 * effects on top means scrolling past six near-identical pricing cards to
 * reach the pricing *section*, which is what the word usually means here.
 */
const GROUP_ORDER: readonly ArtifactLevel[] = [...ARTIFACT_LEVELS].reverse()

function groupByLevel(hits: BrowseHit[]): Array<{ level: ArtifactLevel; items: BrowseHit[] }> {
  return GROUP_ORDER.map((level) => ({
    level,
    items: hits.filter((h) => h.level === level).slice(0, PREVIEW_LIMIT[level]),
  })).filter((g) => g.items.length > 0)
}

/**
 * Count for the "All" chip when a level filter is active.
 *
 * `total` in that case is the filtered count, so the unfiltered total has
 * to come back from the per-level counts.
 */
function otherLevels(
  counts: Record<ArtifactLevel, number>,
  active: ArtifactLevel | undefined,
): number {
  if (!active) return 0
  return ARTIFACT_LEVELS.filter((l) => l !== active).reduce((n, l) => n + counts[l], 0)
}

function LevelChip({
  href,
  label,
  count,
  active,
}: {
  href: string
  label: string
  count: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
      }`}
    >
      {label}
      <span className={active ? 'text-primary' : 'text-muted-foreground/70'}>
        {count.toLocaleString('en-US')}
      </span>
    </Link>
  )
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border/60 text-muted-foreground hover:bg-card hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  )
}

/**
 * The grid for one level, dispatching to that tier's own card.
 *
 * Deliberately not a single unified card: a block card shows a line count
 * and a dependency list, a page card shows how many blocks it is made of,
 * a template card shows routes. Flattening those into one card would mean
 * showing the union (noise) or the intersection (nothing useful). The tier
 * cards already exist and are already what each hub renders.
 */
function ResultGrid({ level, items }: { level: ArtifactLevel; items: BrowseHit[] }) {
  if (level === 'effect') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const effect = getEffect(hit.id)
          return effect ? <EffectStaticCard key={hit.id} effect={effect} /> : null
        })}
      </div>
    )
  }

  if (level === 'template') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const template = getTemplateMeta(hit.id)
          return template ? <TemplateCard key={hit.id} template={template} /> : null
        })}
      </div>
    )
  }

  if (level === 'page') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const page = getPageMeta(hit.id)
          return page ? <PageCard key={hit.id} page={page} /> : null
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((hit) => {
        const block = getBlockMeta(hit.id)
        return block ? <BlockCard key={hit.id} block={block} /> : null
      })}
    </div>
  )
}

function EmptyState({ q }: { q: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-border/60 p-10 text-center">
      <p className="font-semibold">Nothing matched “{q}”.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Try a shorter term, or browse a tier directly.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {ARTIFACT_LEVELS.map((l) => (
          <Link
            key={l}
            href={browseHref({ level: l })}
            className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-card"
          >
            {LEVEL_LABEL[l].many}
          </Link>
        ))}
      </div>
    </div>
  )
}
