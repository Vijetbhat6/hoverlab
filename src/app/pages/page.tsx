/**
 * /pages — the Tier 3 hub.
 *
 * Blocks answer "how do I build this section". Pages answer "how do the
 * sections go together", which is the question that costs the most time and
 * has the least written about it. Every page here is a real composition:
 * the source imports its blocks by name, and the block count on each card
 * is the length of what it actually renders.
 *
 * Static and server-rendered, like `/blocks`.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, LayoutTemplate, Blocks as BlocksIcon } from 'lucide-react'
import { PageCard } from '@/components/pages/page-card'
import { TierDefinition } from '@/components/tier-definition'
import {
  PAGE_COUNT,
  PAGE_INDEX,
  pagesInCategory,
  populatedPageCategories,
} from '@/lib/pages/page-index'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { absoluteUrl } from '@/lib/site'

const TITLE = `${PAGE_COUNT} Ready-Made Page Layouts — Hoverlab`
const DESCRIPTION =
  'Complete screens assembled from blocks — SaaS landing, pricing, dashboard, settings, billing, sign-in and 404. Copy the whole page or drill into any section.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'page templates',
    'react page layouts',
    'tailwind pages',
    'dashboard layout',
    'saas landing page template',
    'admin page template',
  ],
  alternates: { canonical: '/pages' },
  openGraph: {
    url: absoluteUrl('/pages'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function PagesHubPage() {
  const categories = populatedPageCategories()

  // Every distinct block used across every page — the honest measure of how
  // much of the block catalog the pages tier actually exercises.
  const blocksUsed = new Set(PAGE_INDEX.flatMap((p) => p.composedOf)).size

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TierDefinition tier="page" />

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <LayoutTemplate aria-hidden className="h-3.5 w-3.5" />
            Pages
          </span>

          <h1 className="type-hub mt-5">
            Whole screens, already assembled
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            The spacing and the hierarchy are already decided — the part that
            takes longest and is hardest to judge on your own. Take the whole
            screen, or open it and take one section out.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LayoutTemplate aria-hidden className="h-4 w-4" />
              {PAGE_COUNT} pages in {categories.length} categories
            </span>
            <span aria-hidden>·</span>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <BlocksIcon aria-hidden className="h-4 w-4" />
              built from {blocksUsed} of {BLOCK_COUNT} blocks
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="mt-16 space-y-16">
          {categories.map((category) => {
            const pages = pagesInCategory(category)
            return (
              <section key={category}>
                <h2 className="mb-6 text-2xl font-bold tracking-tight">{category}</h2>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {pages.map((page) => (
                    <PageCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <section className="mt-20 rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <h2 className="text-lg font-bold tracking-tight">
            Multi-page templates are next
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            The rung above this one bundles pages into a project you can
            deploy — routing, layout and theme included.
          </p>
        </section>
      </div>
    </div>
  )
}
