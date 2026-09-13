/**
 * Primitive detail — /primitive/segmented-control, /primitive/field, …
 *
 * Singular path, matching `/effect/[slug]` and `/block/[slug]`: on this
 * site plural is a hub and singular is one thing, and `artifactHref()`
 * builds the same URL from a level.
 *
 * Leaner than the block page on purpose. A block's page carries a props
 * playground, a markup-framework panel and a "pages that use this" rail,
 * because a section is a commitment — two hundred lines, a layout decision,
 * and a thing a visitor wants to try before pasting. A primitive is one
 * control in one file: the questions are what it looks like, what it costs
 * and what the source says, and the page answers those three without
 * putting a workbench in front of them.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileCode,
  History,
  Package,
} from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { JsonLd } from '@/components/json-ld'
import { PrimitivePreview } from '@/components/primitives/primitive-preview'
import { PrimitiveCard } from '@/components/primitives/primitive-card'
import { ArtifactFacts } from '@/components/artifact-facts'
import { StickyInstallBar } from '@/components/sticky-install-bar'
import { ResponsivePreview } from '@/components/responsive-preview'
import { OpenArtifactInSandbox } from '@/components/open-artifact-in-sandbox'
import { CopyFrameForFigma } from '@/components/copy-frame-for-figma'
import { CopyForAi } from '@/components/copy-for-ai'
import { BlockPropsTable } from '@/components/blocks/block-props-table'
import { AddToCollectionButton } from '@/components/collections/add-to-collection'
import {
  TrackArtifactView,
  FavoriteArtifactButton,
  BundleArtifactButton,
  CompareArtifactButton,
} from '@/components/artifact-actions'
import { PRIMITIVES, getPrimitive, primaryFile } from '@/lib/primitives/primitives'
import { primitiveCategorySlug } from '@/lib/primitives/primitive-types'
import {
  getPrimitiveMeta,
  primitivesInCategory,
} from '@/lib/primitives/primitive-index'
import { parseBlockProps, sortBlockProps } from '@/lib/blocks/props-table'
import { addedAt, formatAdded, updatedAt } from '@/lib/recency'
import { absoluteUrl } from '@/lib/site'
import { artifactBreadcrumbLd, artifactLd } from '@/lib/structured-data'

/** Twenty-seven pages, all hand-authored. None of them should be cold. */
export const dynamicParams = false

/**
 * The preview wrapper's DOM id, shared by the Figma button and the element
 * it traces. Constant rather than derived: there is one preview per page.
 */
const FRAME_ID = 'artifact-frame'

export function generateStaticParams() {
  return PRIMITIVES.map((p) => ({ slug: p.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const primitive = getPrimitive(slug)
  if (!primitive) return { title: 'Primitive not found — Hoverlab' }

  const title = `${primitive.name} — React & Tailwind Primitive — Hoverlab`

  return {
    title,
    description: primitive.description,
    keywords: [
      primitive.name.toLowerCase(),
      `react ${primitive.name.toLowerCase()}`,
      `tailwind ${primitive.name.toLowerCase()}`,
      ...primitive.tags,
    ],
    alternates: { canonical: `/primitive/${primitive.id}` },
    openGraph: {
      url: absoluteUrl(`/primitive/${primitive.id}`),
      title,
      description: primitive.description,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: primitive.description,
    },
  }
}

export default async function PrimitiveDetailPage({ params }: PageProps) {
  const { slug } = await params
  const primitive = getPrimitive(slug)
  if (!primitive) notFound()

  const meta = getPrimitiveMeta(primitive.id)
  const file = primaryFile(primitive)
  const added = addedAt('primitive', primitive.id)
  const updated = updatedAt('primitive', primitive.id)
  const siblings = primitivesInCategory(primitive.category).filter(
    (p) => p.id !== primitive.id,
  )

  const artifact = {
    id: primitive.id,
    name: primitive.name,
    category: primitive.category,
    level: 'primitive' as const,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={artifactLd({
          level: 'primitive',
          id: primitive.id,
          name: primitive.name,
          description: primitive.description,
          category: primitive.category,
          keywords: primitive.tags,
          dependencies: primitive.deps,
          datePublished: added,
          dateModified: updated,
        })}
      />
      <JsonLd
        data={artifactBreadcrumbLd('primitive', primitive.name, {
          name: primitive.category,
          path: `/primitives/${primitiveCategorySlug(primitive.category)}`,
        })}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link
            href="/primitives"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
            Primitives
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/primitives/${primitiveCategorySlug(primitive.category)}`}
            className="transition-colors hover:text-foreground"
          >
            {primitive.category}
          </Link>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {primitive.category} primitive
          </span>
          <h1 className="type-page mt-2">{primitive.name}</h1>
          <p className="mt-3 text-pretty text-body">{primitive.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FavoriteArtifactButton artifact={artifact} />
            <BundleArtifactButton artifact={artifact} />
            <CompareArtifactButton artifact={artifact} />
            <AddToCollectionButton artifact={artifact} />
            <OpenArtifactInSandbox
              level="primitive"
              id={primitive.id}
              name={primitive.name}
            />
            <CopyFrameForFigma
              targetId={FRAME_ID}
              name={primitive.name}
              level="primitive"
            />
          </div>

          <TrackArtifactView artifact={artifact} />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileCode aria-hidden className="h-4 w-4" />
              {meta?.lines ?? 0} lines
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package aria-hidden className="h-4 w-4" />
              {primitive.deps.length === 0
                ? 'No dependencies'
                : primitive.deps.join(', ')}
            </span>
            {added ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden className="h-4 w-4" />
                Added {formatAdded(added)}
              </span>
            ) : null}
            {updated ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <History aria-hidden className="h-4 w-4" />
                Updated {formatAdded(updated)}
              </span>
            ) : null}
          </div>

          {primitive.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {primitive.tags.map((tag) => (
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

        <ArtifactFacts
          id={primitive.id}
          level="primitive"
          files={primitive.files}
          deps={primitive.deps}
        />

        <StickyInstallBar
          id={primitive.id}
          name={primitive.name}
          command={`npx hoverlab add ${primitive.id}`}
        />

        {/* ---------------------------------------------------------- *
         *  Demo
         * ---------------------------------------------------------- */}
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Live</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Interactive, in your current theme. Every state below is the real
            component — type in it, tab through it, switch the theme.
          </p>
          <div className="mt-4">
            <ResponsivePreview
              level="primitive"
              id={primitive.id}
              name={primitive.name}
            >
              <div id={FRAME_ID}>
                <PrimitivePreview componentKey={primitive.previewComponent} />
              </div>
            </ResponsivePreview>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  Source
         * ---------------------------------------------------------- */}
        {file ? (
          <section className="mt-12">
            <h2 className="text-lg font-bold tracking-tight">Source</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One file. Create{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {file.path}
              </code>{' '}
              and paste.
            </p>
            <div className="mt-4">
              <CodeBlock
                code={file.source}
                language="tsx"
                filename={file.path}
                maxHeightClass="max-h-[560px]"
              />
            </div>
          </section>
        ) : null}

        {/*
          The props table, between the source and the agent handoff.

          A primitive is the rung where "what can I change" is the whole
          question — nobody rewrites a Button, they pass it props — and the
          same parse already feeds the prompt below, so the page and the
          clipboard cannot disagree about the API.
        */}
        <BlockPropsTable block={primitive} />

        <div className="mt-10">
          <CopyForAi
            subject={{
              level: 'primitive',
              id: primitive.id,
              name: primitive.name,
              description: primitive.description,
              category: primitive.category,
              file: file ? { path: file.path, source: file.source } : null,
              props: sortBlockProps(parseBlockProps(file?.source ?? '')),
            }}
          />
        </div>

        {/* ---------------------------------------------------------- *
         *  Siblings
         * ---------------------------------------------------------- */}
        {siblings.length > 0 ? (
          <section className="mt-16 border-t border-border/60 pt-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold tracking-tight">
                More {primitive.category.toLowerCase()}
              </h2>
              <Link
                href={`/primitives/${primitiveCategorySlug(primitive.category)}`}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
              >
                View all
                <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {siblings.slice(0, 3).map((sibling) => (
                <PrimitiveCard key={sibling.id} primitive={sibling} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
