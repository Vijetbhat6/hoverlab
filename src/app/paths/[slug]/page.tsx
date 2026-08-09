/**
 * /paths/[slug] — one guided path, step by step.
 *
 * Each step is a real block rendered live, with the reason it sits at that
 * position. The reasons are the product: anyone can list eight blocks, and
 * what a beginner is missing is that proof goes after the claim and the FAQ
 * exists to answer the objection the price just created.
 *
 * Fully static. Every step's preview is the same component the block detail
 * page renders, so a path can never show something the catalog does not
 * actually contain.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Clock, Layers, Terminal } from 'lucide-react'

import { BlockThumbnail } from '@/components/blocks/block-preview'
import { getPath, PATHS } from '@/lib/paths/catalog'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { blockCategorySlug } from '@/lib/blocks/block-types'
import { absoluteUrl } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return PATHS.map((p) => ({ slug: p.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const path = getPath(slug)
  if (!path) return { title: 'Path not found — Hoverlab' }

  const title = `${path.title} — ${path.steps.length} blocks — Hoverlab`

  return {
    title,
    description: path.description,
    alternates: { canonical: `/paths/${path.slug}` },
    openGraph: {
      url: absoluteUrl(`/paths/${path.slug}`),
      title,
      description: path.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: path.description },
  }
}

export default async function PathDetailPage({ params }: PageProps) {
  const { slug } = await params
  const path = getPath(slug)
  if (!path) notFound()

  // One command that installs the whole path. This is the payoff of the
  // ids being real: the list on screen and the list in the terminal cannot
  // disagree, because they are the same array.
  const installCommand = `npx hoverlab add ${path.steps.map((s) => s.blockId).join(' ')}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link
            href="/paths"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Guided paths
          </Link>
        </nav>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {path.level}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="h-3 w-3" />
              {path.duration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers aria-hidden className="h-3 w-3" />
              {path.steps.length} steps
            </span>
          </div>

          <h1 className="type-page mt-3">
            {path.title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-body">
            {path.description}
          </p>
        </header>

        {/* Install-the-lot shortcut */}
        <section className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Terminal aria-hidden className="h-4 w-4 text-primary" />
            Take all {path.steps.length} at once
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0b1020] p-4 text-[13px] leading-relaxed text-slate-100">
            <code>{installCommand}</code>
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Or work down the list and copy each one from its page — the order
            is what matters, not how the files get there.
          </p>
        </section>

        {/* Steps */}
        <ol className="mt-10 space-y-8">
          {path.steps.map((step, i) => {
            const block = getBlockMeta(step.blockId)
            if (!block) return null

            return (
              <li key={step.blockId} className="relative">
                <div className="flex items-start gap-4">
                  {/* Step number + rail */}
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    {i < path.steps.length - 1 ? (
                      <span aria-hidden className="mt-2 w-px flex-1 bg-border" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="text-lg font-bold tracking-tight">
                        <Link
                          href={`/block/${block.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {block.name}
                        </Link>
                      </h2>
                      <Link
                        href={`/blocks/${blockCategorySlug(block.category)}`}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {block.category}
                      </Link>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {step.why}
                    </p>

                    <div className="mt-4">
                      <BlockThumbnail
                        componentKey={block.previewComponent}
                        height={block.thumbHeight}
                      />
                    </div>

                    {step.alternatives && step.alternatives.length > 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Or:{' '}
                        {step.alternatives.map((alt, j) => {
                          const altBlock = getBlockMeta(alt)
                          if (!altBlock) return null
                          return (
                            <span key={alt}>
                              {j > 0 ? ', ' : ''}
                              <Link
                                href={`/block/${alt}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {altBlock.name}
                              </Link>
                            </span>
                          )
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {/* What next */}
        <section className="mt-12 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            When you are done
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{path.next}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/templates"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Browse templates
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href="/paths"
              className="inline-flex h-9 items-center rounded-lg border border-border/60 px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Other paths
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
