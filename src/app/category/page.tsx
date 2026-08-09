import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EFFECTS } from '@/lib/effects'
import { CATEGORIES, categorySlug, type EffectCategory, type Effect } from '@/lib/effect-types'
import { CATEGORY_META } from '@/lib/category-meta'
import { absoluteUrl } from '@/lib/site'
import { cn } from '@/lib/utils'

/**
 * The categories index — one static page that links to all 25 hubs.
 *
 * This is the crawl entry point for the hub pages: without it they'd only
 * be reachable from each other and the sitemap. Each row carries a live
 * hero preview so the page is also genuinely useful to a human deciding
 * where to start.
 */

export const metadata: Metadata = {
  title: 'CSS Effect Categories — Hoverlab',
  description:
    'Browse every category of copy-paste CSS effect: buttons, loaders, cards, neon, 3D, charts, patterns and more. All free, all pure CSS.',
  keywords: ['css effects', 'css snippets', 'css library', 'copy paste css'],
  alternates: { canonical: '/category' },
  openGraph: {
    url: absoluteUrl('/category'),
    title: 'CSS Effect Categories — Hoverlab',
    description: 'Every category of copy-paste CSS effect, in one place.',
    type: 'website',
    siteName: 'Hoverlab',
  },
}

export default function CategoryIndexPage() {
  const rows = CATEGORIES.map((category) => {
    const inCategory = EFFECTS.filter((e) => e.category === category)
    // Prefer a hand-crafted effect as the hero — those are the curated ones.
    const hero = inCategory.find((e) => e.featured) ?? inCategory[0]
    return { category, count: inCategory.length, hero }
  }).filter((r): r is { category: EffectCategory; count: number; hero: Effect } => Boolean(r.hero))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <h1 className="type-hub">Browse by category</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {EFFECTS.length.toLocaleString()} pure-CSS effects across {CATEGORIES.length} categories.
          Every one is copy-paste ready, needs no JavaScript, and is free to use.
        </p>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* All hero CSS in one tag — see the note on the [slug] page: the
            per-effect class names are globally unique, and keeping the
            <style> outside the cards avoids nesting it inside a link. */}
        <style dangerouslySetInnerHTML={{ __html: rows.map((r) => r.hero.css).join('\n') }} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ category, count, hero }) => (
            <div
              key={category}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div
                className={cn(
                  'flex min-h-[160px] items-center justify-center overflow-hidden p-6',
                  hero.darkSurface ? 'bg-slate-950' : hero.previewClass ?? 'bg-muted/30',
                )}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: hero.html }}
              />
              <div className="flex flex-1 flex-col border-t border-border/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold group-hover:text-primary">
                    <Link
                      href={`/category/${categorySlug(category)}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {category}
                    </Link>
                  </h2>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {CATEGORY_META[category].blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Browse {category} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
