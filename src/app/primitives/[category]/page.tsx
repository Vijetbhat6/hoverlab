/**
 * Primitive category hubs — /primitives/form-controls, /primitives/actions, …
 *
 * The same job as the block category pages: rank for the head term
 * ("react segmented control", "tailwind input group") and hand the visitor
 * straight to the control. Static HTML with live demos in the markup.
 *
 * `dynamicParams = false` — the taxonomy is a closed set, and a category
 * with nothing in it should 404 rather than render an empty grid.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { PrimitiveCard } from '@/components/primitives/primitive-card'
import { TierDefinition } from '@/components/tier-definition'
import { JsonLd } from '@/components/json-ld'
import {
  primitiveCategoryFromSlug,
  primitiveCategorySlug,
} from '@/lib/primitives/primitive-types'
import {
  PRIMITIVE_COUNT,
  populatedPrimitiveCategories,
  primitivesInCategory,
} from '@/lib/primitives/primitive-index'
import { absoluteUrl } from '@/lib/site'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'

export const dynamicParams = false

export function generateStaticParams() {
  return populatedPrimitiveCategories().map((c) => ({
    category: primitiveCategorySlug(c),
  }))
}

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = primitiveCategoryFromSlug(slug)
  if (!category) return { title: 'Category not found — Hoverlab' }

  const primitives = primitivesInCategory(category)
  const title = `${primitives.length} ${category} Primitives — Hoverlab`
  const description = `React and Tailwind ${category.toLowerCase()} you can paste into any project. ${primitives
    .map((p) => p.name)
    .slice(0, 3)
    .join(', ')} and more — accessible, keyboard-complete, no component library required.`

  return {
    title,
    description,
    keywords: [
      `react ${category.toLowerCase()}`,
      `tailwind ${category.toLowerCase()}`,
      'ui primitives',
      'copy paste components',
    ],
    alternates: { canonical: `/primitives/${slug}` },
    openGraph: {
      url: absoluteUrl(`/primitives/${slug}`),
      title,
      description,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PrimitiveCategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = primitiveCategoryFromSlug(slug)
  if (!category) notFound()

  const primitives = primitivesInCategory(category)
  if (primitives.length === 0) notFound()

  const siblings = populatedPrimitiveCategories().filter((c) => c !== category)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={itemListLd(
          `${category} primitives`,
          `/primitives/${slug}`,
          primitives.map((p) => ({ name: p.name, path: `/primitive/${p.id}` })),
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Primitives', path: '/primitives' },
          { name: category },
        ])}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/primitives"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
          All primitives
        </Link>

        <TierDefinition tier="primitive" className="mt-8" />

        <header className="mx-auto mt-8 max-w-3xl text-center">
          <h1 className="type-hub">{category}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            {primitives.length} of the {PRIMITIVE_COUNT} primitives in the
            catalog. Every one is a single file of plain markup and Tailwind
            classes — paste it and it works.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {primitives.map((primitive) => (
            <PrimitiveCard key={primitive.id} primitive={primitive} />
          ))}
        </div>

        {siblings.length > 0 ? (
          <nav aria-label="Other categories" className="mt-16 border-t border-border/60 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Other categories
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {siblings.map((sibling) => (
                <li key={sibling}>
                  <Link
                    href={`/primitives/${primitiveCategorySlug(sibling)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-sm font-medium transition-all hover:border-primary/40"
                  >
                    {sibling}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {primitivesInCategory(sibling).length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/blocks"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-all hover:gap-2.5 hover:text-foreground"
            >
              See what these compose into
              <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
