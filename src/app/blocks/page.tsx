/**
 * /blocks — the Tier 2 hub.
 *
 * Effects answer "how do I make this button glow". Blocks answer "how do I
 * build the section I was actually asked for", and this page is where that
 * shift is made legible: the audience rail up top says the catalog covers
 * marketing, product and commerce, and the grid below shows every section
 * rendered live rather than as a screenshot.
 *
 * Fully static and server-rendered — no filter chips, no client grid. The
 * category links are real URLs, which is both the cheaper page and the one
 * a crawler can actually follow.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Blocks as BlocksIcon, Layers, Sparkles } from 'lucide-react'
import { BlockCard } from '@/components/blocks/block-card'
import { TierDefinition } from '@/components/tier-definition'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import {
  BLOCK_COUNT,
  populatedByGroup,
  populatedBlockCategories,
  blocksInCategory,
} from '@/lib/blocks/block-index'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { absoluteUrl } from '@/lib/site'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'

const TITLE = `${BLOCK_COUNT} Copy-Paste UI Blocks — Hoverlab`
const DESCRIPTION =
  'Full page sections you can paste into any React project — pricing tables, FAQs, testimonial walls, feature grids and more. Tailwind classes, no component library required.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ui blocks',
    'tailwind blocks',
    'react sections',
    'landing page sections',
    'copy paste components',
    'pricing table component',
  ],
  alternates: { canonical: '/blocks' },
  openGraph: {
    url: absoluteUrl('/blocks'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function BlocksHubPage() {
  const groups = populatedByGroup()
  const categories = populatedBlockCategories()

  /*
    A CollectionPage + ItemList, and a breadcrumb.

    The detail pages have carried structured data since they were written
    and the hubs never did, which is backwards for the pages the sitemap
    ranks highest: these are the ones a "react pricing section" query lands
    on, and an ItemList is what lets the result carry its own contents
    rather than a description.

    Capped by `itemListLd` rather than here — a hub can list two hundred
    blocks and a list that long is ignored by every consumer of it.
  */
  const listLd = itemListLd(
    'Blocks',
    '/blocks',
    categories.map((category) => ({
      name: category,
      path: `/blocks/${blockCategorySlug(category)}`,
    })),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={listLd} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Blocks' }])} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------- *
         *  Header
         * ---------------------------------------------------------- */}
        <TierDefinition tier="block" />

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <BlocksIcon aria-hidden className="h-3.5 w-3.5" />
            Blocks
          </span>

          <h1 className="type-hub mt-5">
            Whole sections, not just the parts
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            Laid out, responsive and accessible, in plain markup and Tailwind
            classes — paste one into your project and it works, with no
            component library to install first.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers aria-hidden className="h-4 w-4" />
              {BLOCK_COUNT} blocks in {categories.length} categories
            </span>
            <span aria-hidden>·</span>
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <Sparkles aria-hidden className="h-4 w-4" />
              {TOTAL_COUNT.toLocaleString('en-US')} effects underneath them
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* ---------------------------------------------------------- *
         *  Category rail, bucketed by audience
         * ---------------------------------------------------------- */}
        <nav aria-label="Block categories" className="mt-14 space-y-6">
          {groups.map(({ group, categories: inGroup }) => (
            <div key={group}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {inGroup.map(({ category, count }) => (
                  <li key={category}>
                    <Link
                      href={`/blocks/${blockCategorySlug(category)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                    >
                      {category}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ---------------------------------------------------------- *
         *  Every block, grouped by category
         * ---------------------------------------------------------- */}
        <div className="mt-16 space-y-16">
          {categories.map((category) => {
            const blocks = blocksInCategory(category)
            return (
              <section key={category} id={blockCategorySlug(category)}>
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
                  <Link
                    href={`/blocks/${blockCategorySlug(category)}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
                  >
                    View all {blocks.length}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {blocks.map((block) => (
                    <BlockCard key={block.id} block={block} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* ---------------------------------------------------------- *
         *  What is coming
         * ---------------------------------------------------------- */}
        <section className="mt-20 rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <h2 className="text-lg font-bold tracking-tight">
            Dashboards, tables and auth are next
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            The taxonomy already covers product and commerce — sidebars, data
            tables, settings screens, checkout flows. Those categories appear
            here as their first block lands.
          </p>
        </section>
      </div>
    </div>
  )
}
