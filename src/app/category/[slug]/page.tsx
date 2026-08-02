import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/command-palette'
import { EFFECTS } from '@/lib/effects'
import { CATEGORIES, categoryFromSlug, categorySlug, type Effect } from '@/lib/effect-types'
import { CATEGORY_META } from '@/lib/category-meta'
import { absoluteUrl } from '@/lib/site'
import { cn } from '@/lib/utils'

/**
 * Category hub pages — /category/buttons, /category/glow-neon, …
 *
 * The catalog's head terms ("css loaders", "css neon text") had no landing
 * page: the only category entry point was /library?filter=Buttons, which
 * is a client-rendered grid behind a query string. Crawlers see an empty
 * shell there, and a query-string URL is a weak canonical.
 *
 * These pages are the opposite: fully static HTML, real previews in the
 * markup, editorial copy above the fold, and dense internal links out to
 * both the individual effects and the sibling categories.
 *
 * Previews are capped at PREVIEW_LIMIT. Buttons alone has 249 effects, and
 * inlining every one would push several hundred KB of CSS into the
 * document for no ranking benefit — the long tail is already covered by
 * the per-effect pages the grid links to.
 */

const PREVIEW_LIMIT = 48

export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: categorySlug(c) }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = categoryFromSlug(slug)
  if (!category) return { title: 'Category not found — Hoverlab' }

  const meta = CATEGORY_META[category]
  const count = EFFECTS.filter((e) => e.category === category).length
  const title = `${count} CSS ${category} Effects — Hoverlab`

  return {
    title,
    description: meta.blurb,
    keywords: [...meta.keywords, 'css', 'copy paste css', 'css snippets'],
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      url: absoluteUrl(`/category/${slug}`),
      title,
      description: meta.blurb,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: meta.blurb },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = categoryFromSlug(slug)
  if (!category) notFound()

  const meta = CATEGORY_META[category]
  const all = EFFECTS.filter((e) => e.category === category)
  if (all.length === 0) notFound()

  // Featured (hand-crafted) effects lead — they're the best-looking ones
  // and the ones bundled on the client, so they're the most useful first
  // click. The generated remainder is round-robined by template so the
  // page opens on variety instead of forty recolors of one button.
  const featured = all.filter((e) => e.featured)
  const shown = [...featured, ...interleaveByTemplate(all.filter((e) => !e.featured))].slice(
    0,
    PREVIEW_LIMIT,
  )

  const others = CATEGORIES.filter((c) => c !== category)

  return (
    <div className="min-h-screen bg-background">
      {/* Structured data: an ItemList of the effects on this page gives the
          category a rich-result shape instead of a wall of divs. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `CSS ${category} Effects`,
            description: meta.blurb,
            url: absoluteUrl(`/category/${slug}`),
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: all.length,
              itemListElement: shown.slice(0, 20).map((e, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: e.name,
                url: absoluteUrl(`/effect/${e.id}`),
              })),
            },
          }),
        }}
      />

      <header className="border-b border-border/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/library">
              <ArrowLeft className="h-4 w-4" />
              All effects
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/category" className="hover:text-foreground">
            Categories
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{category}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          CSS {category} Effects
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{meta.blurb}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Layers className="h-3 w-3" />
            {all.length} effects
          </Badge>
          <Badge variant="outline">Free &amp; MIT-licensed</Badge>
          <Badge variant="outline">No JavaScript</Badge>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Every preview's CSS in one document-level tag. Class names are
            globally unique per effect (`fx-<slug>-<seq>`), so concatenating
            them can't collide. */}
        <style dangerouslySetInnerHTML={{ __html: shown.map((e) => e.css).join('\n') }} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((effect) => (
            <StaticPreviewCard key={effect.id} effect={effect} />
          ))}
        </div>

        {all.length > shown.length ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {shown.length} of {all.length}. The rest are searchable in the library.
            </p>
            <Button asChild className="mt-3 gap-1.5">
              <Link href={`/library?filter=${encodeURIComponent(category)}`}>
                Browse all {all.length} {category}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : null}

        {/* Sibling categories — the internal link graph these pages exist
            to create. */}
        <section className="mt-16 border-t border-border/60 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Other categories
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map((c) => (
              <Link
                key={c}
                href={`/category/${categorySlug(c)}`}
                className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <CommandPalette />
    </div>
  )
}

/**
 * Which generator template produced an effect, inferred from its class name.
 *
 * Generated classes are `fx-<template>-<variant>-<seq>` — `fx-ch-bars-rose-0001`,
 * `fx-td-flip-ocean-0042` — so the first two segments identify the template
 * while the rest is the color/size variant. Effects with no recognizable
 * class (hand-written ones) each become their own group, which is correct:
 * they aren't variants of anything.
 */
function templateKey(effect: Effect): string {
  const m = /\.fx-([a-z0-9]+-[a-z0-9]+)/.exec(effect.css)
  return m ? m[1] : effect.id
}

/**
 * Round-robin the list across its templates: one of each, then the second
 * of each, and so on. A category is generated as template × palette, so
 * source order groups all 17 colors of one template together — the top of
 * a hub page would otherwise be a single design repeated in every hue.
 */
function interleaveByTemplate(effects: Effect[]): Effect[] {
  const groups = new Map<string, Effect[]>()
  for (const e of effects) {
    const key = templateKey(e)
    const bucket = groups.get(key)
    if (bucket) bucket.push(e)
    else groups.set(key, [e])
  }

  const buckets = [...groups.values()]
  const out: Effect[] = []
  for (let round = 0; out.length < effects.length; round++) {
    for (const bucket of buckets) {
      if (round < bucket.length) out.push(bucket[round])
    }
  }
  return out
}

/**
 * Server-rendered preview card.
 *
 * The card is a plain <div> and the link is a stretched anchor over the
 * title, rather than an <a> wrapping the whole thing. Effect markup
 * routinely contains buttons, <details>, and its own anchors — nesting
 * those inside an <a> is invalid, and the parser restructures the DOM to
 * fix it, which shows up as a hydration mismatch on every card.
 */
function StaticPreviewCard({ effect }: { effect: Effect }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-lg">
      <div
        className={cn(
          'flex min-h-[180px] items-center justify-center overflow-hidden p-6',
          effect.darkSurface ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
        )}
        // The preview is decoration; the stretched link below is the real
        // control, so nothing in here should take focus or be announced.
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: effect.html }}
      />
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-semibold group-hover:text-primary">
            <Link
              href={`/effect/${effect.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {effect.name}
            </Link>
          </h2>
          {effect.featured ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Featured
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{effect.description}</p>
      </div>
    </div>
  )
}
