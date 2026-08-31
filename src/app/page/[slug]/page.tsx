/**
 * Page detail — /page/saas-landing-page, /page/dashboard-overview, …
 *
 * Singular path, matching `/effect/[slug]` and `/block/[slug]`. The
 * directory is named `page`, which sits beside `app/page.tsx` without
 * colliding — one is a route segment, the other is the root route's file.
 *
 * The section that makes this tier worth having is "Built from": the blocks
 * resolved out of `composedOf`, each linking to its own detail page. That is
 * the downward half of the drill-down; the upward half lives on the block
 * detail page as "Used in these pages".
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Blocks, CalendarDays, FileCode, Package } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { JsonLd } from '@/components/json-ld'
import { PagePreview } from '@/components/pages/page-preview'
import { PageCard } from '@/components/pages/page-card'
import { PAGES, getPage, primaryFile } from '@/lib/pages/pages'
import { getPageMeta, pagesInCategory } from '@/lib/pages/page-index'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import { templatesUsingPage } from '@/lib/templates/template-index'
import { absoluteUrl } from '@/lib/site'
import { addedAt, formatAdded } from '@/lib/recency'
import { artifactBreadcrumbLd, artifactLd } from '@/lib/structured-data'
import { AddToCollectionButton } from '@/components/collections/add-to-collection'
import {
  TrackArtifactView,
  FavoriteArtifactButton,
  BundleArtifactButton,
  CompareArtifactButton,
  CopyDnaButton,
} from '@/components/artifact-actions'
import { ArtifactFacts } from '@/components/artifact-facts'
import { OpenArtifactInSandbox } from '@/components/open-artifact-in-sandbox'
import { CopyFrameForFigma } from '@/components/copy-frame-for-figma'
import { StickyInstallBar } from '@/components/sticky-install-bar'

export const dynamicParams = false

/** The preview wrapper's DOM id — the element the Figma button traces. */
const FRAME_ID = 'artifact-frame' 

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getPage(slug)
  if (!page) return { title: 'Page not found — Hoverlab' }

  const title = `${page.name} — Page Template — Hoverlab`

  return {
    title,
    description: page.description,
    keywords: [...page.tags, 'page template', 'react layout', 'tailwind page'],
    alternates: { canonical: `/page/${page.id}` },
    openGraph: {
      url: absoluteUrl(`/page/${page.id}`),
      title,
      description: page.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: page.description },
  }
}

export default async function PageDetailPage({ params }: PageProps) {
  const { slug } = await params
  const page = getPage(slug)
  if (!page) notFound()

  const file = primaryFile(page)
  const meta = getPageMeta(page.id)

  // Resolve composedOf into real block metadata. An id with no match is
  // dropped rather than rendered as a broken tile — the catalog comment
  // warns that nothing validates these, so the UI degrades quietly.
  const blocks = page.composedOf
    .map((id) => getBlockMeta(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))

  const related = pagesInCategory(page.category).filter((p) => p.id !== page.id)

  // The upward half — every template that routes to this page. Mirrors
  // `pagesUsingBlock` one rung down, so the ladder climbs the whole way.
  const usedIn = templatesUsingPage(page.id)

  const added = addedAt('page', page.id)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={artifactLd({
          level: 'page',
          id: page.id,
          name: page.name,
          description: page.description,
          category: page.category,
          keywords: page.tags,
          dependencies: page.deps,
          datePublished: added,
        })}
      />
      <JsonLd data={artifactBreadcrumbLd('page', page.name, { name: page.category })} />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/pages" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Pages
          </Link>
          <span aria-hidden>/</span>
          <span>{page.category}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="type-page">
            {page.name}
          </h1>
          <p className="mt-3 text-pretty text-body">{page.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FavoriteArtifactButton
              artifact={{
                id: page.id,
                name: page.name,
                category: page.category,
                level: 'page',
              }}
            />
            <BundleArtifactButton
              artifact={{
                id: page.id,
                name: page.name,
                category: page.category,
                level: 'page',
              }}
            />
            <CompareArtifactButton
              artifact={{
                id: page.id,
                name: page.name,
                category: page.category,
                level: 'page',
              }}
            />
            {/* Last in the row: copy, favorite and bundle all serve this
                visit, and a collection serves the month after it. */}
            <AddToCollectionButton
              artifact={{
                id: page.id,
                name: page.name,
                category: page.category,
                level: 'page',
              }}
            />
            {/* Aimed at whoever is about to build with an agent rather than
                paste a component: the tokens, motion and rules, as one
                pasteable document. */}
            <CopyDnaButton artifactId={page.id} />
            {/* A page is a composition, so the sandbox ships the blocks it
                renders alongside it — the only way to see the whole screen
                run without cloning a template. */}
            <OpenArtifactInSandbox level="page" id={page.id} name={page.name} />
            {/* A whole screen as Figma layers. The tier where this matters
                most: a designer redrawing a full page wants the layout, not
                one section of it. */}
            <CopyFrameForFigma targetId={FRAME_ID} name={page.name} level="page" />
          </div>

          <TrackArtifactView
            artifact={{
              id: page.id,
              name: page.name,
              category: page.category,
              level: 'page',
            }}
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Blocks aria-hidden className="h-4 w-4" />
              {blocks.length} blocks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCode aria-hidden className="h-4 w-4" />
              {meta?.lines ?? 0} lines
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package aria-hidden className="h-4 w-4" />
              {page.deps.length === 0 ? 'No dependencies' : page.deps.join(', ')}
            </span>
            {added ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden className="h-4 w-4" />
                Added {formatAdded(added)}
              </span>
            ) : null}
          </div>
        </header>

        <ArtifactFacts
          id={page.id}
          level="page"
          files={page.files}
          deps={page.deps}
          includes={page.composedOf}
        />

        <StickyInstallBar
          id={page.id}
          name={page.name}
          command={`npx hoverlab add ${page.id}`}
        />

        {/* ---------------------------------------------------------- *
         *  Live preview
         * ---------------------------------------------------------- */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </h2>
          {/* Traced by <CopyFrameForFigma>; see the block detail page for
              why the id wraps the preview instead of sitting inside it. */}
          <div id={FRAME_ID}>
            <PagePreview componentKey={page.previewComponent} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The real page, rendered in your current theme — every section
            below is a live block, not a screenshot.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
         *  Built from — the drill-down
         * ---------------------------------------------------------- */}
        {blocks.length > 0 ? (
          <section className="mt-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Built from
              </h2>
              <Link
                href="/blocks"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
              >
                All blocks
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ol className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
              {blocks.map((block, i) => (
                <li key={`${block.id}-${i}`}>
                  <Link
                    href={`/block/${block.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <span
                      aria-hidden
                      className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground"
                    >
                      {i + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{block.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {block.description}
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {block.category}
                    </span>

                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ol>

            <p className="mt-3 text-xs text-muted-foreground">
              Only want one section? Open it and copy that block instead —{' '}
              <Link
                href={`/blocks/${blockCategorySlug(blocks[0].category)}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                browse {blocks[0].category}
              </Link>
              .
            </p>
          </section>
        ) : null}

        {/* ---------------------------------------------------------- *
         *  Shipped in — the rung above
         * ---------------------------------------------------------- */}
        {usedIn.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Shipped in these templates
            </h2>

            <ul className="grid gap-3 sm:grid-cols-2">
              {usedIn.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/template/${t.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <Blocks aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.routes.length} routes · {t.composedOf.length} pages
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
              Want the whole project rather than this one screen? A template
              ships every route, the theme tokens and the layout.
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

            <div className="mt-6 rounded-xl border border-border/60 bg-card/60 p-4">
              <h3 className="text-sm font-semibold">How to use it</h3>
              <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  1. Copy each of the {blocks.length} blocks above into{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    components/
                  </code>{' '}
                  — each block page has its own copy button.
                </li>
                <li>
                  2. Drop this file at{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {file.path}
                  </code>
                  . The imports already point at{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    @/components/…
                  </code>
                  , so they resolve with no edits.
                </li>
                <li>
                  3. Delete the sections you do not want. Every block takes
                  props, so the copy changes without the layout moving.
                </li>
              </ol>
            </div>
          </section>
        ) : null}

        {/* ---------------------------------------------------------- *
         *  Related
         * ---------------------------------------------------------- */}
        {related.length > 0 ? (
          <section className="mt-16 border-t border-border/60 pt-10">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              More {page.category}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {related.map((p) => (
                <PageCard key={p.id} page={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
