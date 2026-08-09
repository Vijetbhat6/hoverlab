/**
 * Block detail — /block/pricing-tiers, /block/faq-accordion, …
 *
 * Singular path, matching `/effect/[slug]`: on this site plural is a hub
 * and singular is one thing. `artifactHref()` builds the same URL from a
 * level, so any future tier gets `/page/…` and `/template/…` for free.
 *
 * The page is the preview, the source, and the reason to trust it — the
 * dependency list and the "what to know" notes are there because the
 * questions a developer has before pasting 200 lines into their repo are
 * "what does this drag in" and "what will bite me".
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Package, FileCode, Layers } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { BlockPreview } from '@/components/blocks/block-preview'
import { BlockMarkupPanel } from '@/components/blocks/block-markup-panel'
import { BlockCard } from '@/components/blocks/block-card'
import { BLOCKS, getBlock, primaryFile } from '@/lib/blocks/blocks'
import { blockCategorySlug, GROUP_OF } from '@/lib/blocks/block-types'
import { blocksInCategory, getBlockMeta } from '@/lib/blocks/block-index'
import { pagesUsingBlock } from '@/lib/pages/page-index'
import { absoluteUrl } from '@/lib/site'
import {
  TrackArtifactView,
  FavoriteArtifactButton,
  BundleArtifactButton,
  CompareArtifactButton,
} from '@/components/artifact-actions'

/**
 * Every block is pre-rendered. There are thirteen of them and they are the
 * catalog's newest SEO surface, so there is no argument for serving any of
 * them as a cold on-demand render.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const block = getBlock(slug)
  if (!block) return { title: 'Block not found — Hoverlab' }

  const title = `${block.name} — ${block.category} Block — Hoverlab`

  return {
    title,
    description: block.description,
    keywords: [...block.tags, block.category.toLowerCase(), 'react block', 'tailwind section'],
    alternates: { canonical: `/block/${block.id}` },
    openGraph: {
      url: absoluteUrl(`/block/${block.id}`),
      title,
      description: block.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: block.description },
  }
}

export default async function BlockDetailPage({ params }: PageProps) {
  const { slug } = await params
  const block = getBlock(slug)
  if (!block) notFound()

  const file = primaryFile(block)
  const meta = getBlockMeta(block.id)

  // Siblings for the "more like this" rail, this block excluded.
  const related = blocksInCategory(block.category).filter((b) => b.id !== block.id)

  // The upward half of the drill-down — every page that renders this block.
  // Derived from the page catalog's `composedOf`, so it stays correct
  // without this tier knowing anything about pages.
  const usedIn = pagesUsingBlock(block.id)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------- *
         *  Breadcrumb + header
         * ---------------------------------------------------------- */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/blocks" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Blocks
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/blocks/${blockCategorySlug(block.category)}`}
            className="transition-colors hover:text-foreground"
          >
            {block.category}
          </Link>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {GROUP_OF[block.category]} block
          </span>
          <h1 className="type-page mt-2">
            {block.name}
          </h1>
          <p className="mt-3 text-pretty text-body">{block.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FavoriteArtifactButton
              artifact={{
                id: block.id,
                name: block.name,
                category: block.category,
                level: 'block',
              }}
            />
            <BundleArtifactButton
              artifact={{
                id: block.id,
                name: block.name,
                category: block.category,
                level: 'block',
              }}
            />
            <CompareArtifactButton
              artifact={{
                id: block.id,
                name: block.name,
                category: block.category,
                level: 'block',
              }}
            />
          </div>

          <TrackArtifactView
            artifact={{
              id: block.id,
              name: block.name,
              category: block.category,
              level: 'block',
            }}
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileCode aria-hidden className="h-4 w-4" />
              {meta?.lines ?? 0} lines
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package aria-hidden className="h-4 w-4" />
              {block.deps.length === 0 ? 'No dependencies' : block.deps.join(', ')}
            </span>
          </div>

          {block.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {block.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {/* ---------------------------------------------------------- *
         *  Live preview
         * ---------------------------------------------------------- */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </h2>
          <BlockPreview componentKey={block.previewComponent} />
          <p className="mt-3 text-xs text-muted-foreground">
            Rendered live in your current theme — this is the same component
            whose source is below, not a screenshot of it.
          </p>
        </section>

        <BlockMarkupPanel block={block} />

        {/* ---------------------------------------------------------- *
         *  Used in — climb the ladder rather than only descending it
         * ---------------------------------------------------------- */}
        {usedIn.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Used in these pages
            </h2>

            <ul className="grid gap-3 sm:grid-cols-2">
              {usedIn.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/page/${p.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <Layers aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.composedOf.length} blocks
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-muted-foreground">
              Want the whole screen instead of this one section? Open a page
              and copy it entire.
            </p>
          </section>
        ) : null}

        {/* ---------------------------------------------------------- *
         *  Source
         * ---------------------------------------------------------- */}
        {file ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Source
            </h2>
            <CodeBlock code={file.source} language="tsx" filename={file.path} />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <h3 className="text-sm font-semibold">Before you paste</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    Styling is Tailwind utility classes on semantic tokens
                    (<code className="font-mono text-xs">bg-card</code>,{' '}
                    <code className="font-mono text-xs">text-muted-foreground</code>) — it
                    inherits your theme instead of overriding it.
                  </li>
                  <li>
                    {block.deps.length === 0
                      ? 'Nothing to install. No component library, no icon package.'
                      : `Install: ${block.deps.map((d) => `npm i ${d}`).join(', ')}`}
                  </li>
                  <li>Every prop has a default, so it renders standalone before you wire it up.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <h3 className="text-sm font-semibold">Where it goes</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop it at{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {file.path}
                  </code>{' '}
                  and import it where you need the section:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs">
                  {`import { ${componentNameOf(file.source)} } from '@/${file.path.replace(/\.tsx$/, '')}'`}
                </pre>
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------------------------------------------------------- *
         *  Related
         * ---------------------------------------------------------- */}
        {related.length > 0 ? (
          <section className="mt-16 border-t border-border/60 pt-10">
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">
                More {block.category} blocks
              </h2>
              <Link
                href={`/blocks/${blockCategorySlug(block.category)}`}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
              >
                View category
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {related.map((b) => (
                <BlockCard key={b.id} block={b} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Pull the exported component's name out of its own source for the import
 * example.
 *
 * Reading it from the source rather than storing it in the catalog means
 * the snippet cannot go stale when a component is renamed — there is only
 * one place the name is written down. Falls back to the block's own name if
 * the export line ever stops matching.
 */
function componentNameOf(source: string): string {
  return /export function ([A-Z]\w*)/.exec(source)?.[1] ?? 'Block'
}
