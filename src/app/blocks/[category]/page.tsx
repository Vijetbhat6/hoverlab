/**
 * Block category hubs — /blocks/pricing, /blocks/faq, …
 *
 * Same job as the effect category pages: rank for the head term ("tailwind
 * pricing table", "react faq accordion") and hand the visitor to a specific
 * block. Static HTML with live previews in the markup and dense internal
 * links out to siblings.
 *
 * `dynamicParams = false` — the taxonomy is a closed set and a category
 * with no blocks in it should 404 rather than render an empty grid.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { BlockCard } from '@/components/blocks/block-card'
import { TierDefinition } from '@/components/tier-definition'
import {
  blockCategoryFromSlug,
  blockCategorySlug,
  GROUP_OF,
} from '@/lib/blocks/block-types'
import {
  blocksInCategory,
  populatedBlockCategories,
  BLOCK_COUNT,
} from '@/lib/blocks/block-index'
import { absoluteUrl } from '@/lib/site'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'

export const dynamicParams = false

export function generateStaticParams() {
  return populatedBlockCategories().map((c) => ({ category: blockCategorySlug(c) }))
}

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = blockCategoryFromSlug(slug)
  if (!category) return { title: 'Category not found — Hoverlab' }

  const blocks = blocksInCategory(category)
  const title = `${blocks.length} ${category} Blocks — Hoverlab`
  const description = `Copy-paste ${category.toLowerCase()} sections for React and Tailwind. ${blocks
    .map((b) => b.name)
    .slice(0, 3)
    .join(', ')} and more — responsive, accessible, no component library required.`

  return {
    title,
    description,
    keywords: [
      `${category.toLowerCase()} component`,
      `tailwind ${category.toLowerCase()}`,
      'react ui blocks',
      'copy paste sections',
    ],
    alternates: { canonical: `/blocks/${slug}` },
    openGraph: {
      url: absoluteUrl(`/blocks/${slug}`),
      title,
      description,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BlockCategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = blockCategoryFromSlug(slug)
  if (!category) notFound()

  const blocks = blocksInCategory(category)
  if (blocks.length === 0) notFound()

  const siblings = populatedBlockCategories().filter((c) => c !== category)

  /*
    The blocks themselves, not the sibling categories: this is a leaf hub,
    and what a "react pricing section" result should be able to show is the
    sections it holds. The breadcrumb gives the same query Home > Blocks >
    Pricing rather than a bare URL.
  */
  const listLd = itemListLd(
    `${category} blocks`,
    `/blocks/${slug}`,
    blocks.map((block) => ({ name: block.name, path: `/block/${block.id}` })),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={listLd} />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Blocks', path: '/blocks' },
          { name: category },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          All blocks
        </Link>

        <header className="mt-6 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {GROUP_OF[category]}
          </span>
          <h1 className="type-hub mt-2">
            {category}
          </h1>
          <p className="mt-4 text-pretty text-body">
            {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} in this
            category, each rendered live below. Open any of them for the full
            source and a copy button.
          </p>

          {/* These pages are the site's most common cold landing — someone
              arrives here from a search for the head term without having
              seen /blocks, so the definition has to be on this page too. */}
          <TierDefinition tier="block" className="mt-5" />
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </div>

        {siblings.length > 0 ? (
          <nav aria-label="Other categories" className="mt-16 border-t border-border/60 pt-8">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Browse other categories
            </h2>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((c) => (
                <li key={c}>
                  <Link
                    href={`/blocks/${blockCategorySlug(c)}`}
                    className="inline-block rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/blocks"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
            >
              See all {BLOCK_COUNT} blocks
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
