/**
 * /primitives — the hub for the rung between effects and blocks.
 *
 * The page has one argument to make, and the header makes it in a sentence:
 * this is not another Button. shadcn already installed a Button; what is
 * missing is the button *group*, the input group, the field wrapper, the
 * segmented control, the verification code input — the parts of an
 * interface that every project rebuilds because no base library ships them.
 *
 * Static and server-rendered, like `/blocks`. The category links are real
 * URLs a crawler can follow, and the sort control reorders finished nodes
 * rather than dragging 160 KB of sources into the browser.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Blocks as BlocksIcon, Component, Layers, Package } from 'lucide-react'

import { NewThisWeek } from '@/components/new-this-week'
import { PrimitiveCard } from '@/components/primitives/primitive-card'
import { TierDefinition } from '@/components/tier-definition'
import { SortableArtifactGrid } from '@/components/sortable-artifact-grid'
import { JsonLd } from '@/components/json-ld'
import { primitiveCategorySlug } from '@/lib/primitives/primitive-types'
import {
  PRIMITIVE_COUNT,
  ZERO_DEP_COUNT,
  populatedPrimitiveCategories,
  primitivesInCategory,
} from '@/lib/primitives/primitive-index'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { addedAt } from '@/lib/recency'
import { absoluteUrl } from '@/lib/site'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'

const TITLE = `${PRIMITIVE_COUNT} React UI Primitives — Hoverlab`
const DESCRIPTION =
  'The controls no base library ships: button groups, input groups, field wrappers, segmented controls, verification code inputs, tag fields, tree views. Plain Tailwind, no component library, most with no dependencies at all.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'react ui primitives',
    'tailwind components',
    'segmented control react',
    'input group tailwind',
    'button group component',
    'verification code input',
    'headless ui alternative',
  ],
  alternates: { canonical: '/primitives' },
  openGraph: {
    url: absoluteUrl('/primitives'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function PrimitivesHubPage() {
  const categories = populatedPrimitiveCategories()
  const all = categories.flatMap((category) => primitivesInCategory(category))

  const listLd = itemListLd(
    'Primitives',
    '/primitives',
    categories.map((category) => ({
      name: category,
      path: `/primitives/${primitiveCategorySlug(category)}`,
    })),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={listLd} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Primitives' }])} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TierDefinition tier="primitive" />

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Component aria-hidden className="h-3.5 w-3.5" />
            Primitives
          </span>

          <h1 className="type-hub mt-5">The parts between an element and a section</h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            Not another Button. You already have one — what you do not have is
            the button <em>group</em> with its borders collapsed, the input
            with an addon on each end, the field that wires a label to a hint
            to an error, the segmented control that a screen reader can
            actually read. Every project rebuilds these, and no base library
            ships them.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers aria-hidden className="h-4 w-4" />
              {PRIMITIVE_COUNT} primitives in {categories.length} categories
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Package aria-hidden className="h-4 w-4" />
              {ZERO_DEP_COUNT} need nothing but React
            </span>
            <span aria-hidden>·</span>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <BlocksIcon aria-hidden className="h-4 w-4" />
              {BLOCK_COUNT} blocks built on top
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <NewThisWeek level="primitive" />

        {/* ---------------------------------------------------------- *
         *  Category rail
         * ---------------------------------------------------------- */}
        {/*
          Flat, not bucketed by audience the way `/blocks` is. Eight
          categories fit on one line and a group heading above each pair
          would be more chrome than menu.
        */}
        <nav aria-label="Primitive categories" className="mt-14">
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/primitives/${primitiveCategorySlug(category)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  {category}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {primitivesInCategory(category).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------------------------------------------------------- *
         *  Every primitive, grouped by category
         * ---------------------------------------------------------- */}
        <div className="mt-16">
          <SortableArtifactGrid
            noun="primitives"
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            items={all.map((primitive) => ({
              id: primitive.id,
              added: addedAt('primitive', primitive.id),
              node: <PrimitiveCard key={primitive.id} primitive={primitive} />,
            }))}
            groups={categories.map((category) => ({
              key: category,
              ids: primitivesInCategory(category).map((p) => p.id),
              heading: (
                <div
                  key={category}
                  id={primitiveCategorySlug(category)}
                  className="mb-6 flex scroll-mt-20 items-baseline justify-between gap-4"
                >
                  <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
                  <Link
                    href={`/primitives/${primitiveCategorySlug(category)}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
                  >
                    View all {primitivesInCategory(category).length}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
