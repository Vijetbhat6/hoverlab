/**
 * /preview/block/pricing-tiers — one artifact, alone, in a real viewport.
 *
 * ── WHY THIS ROUTE EXISTS ───────────────────────────────────────────────
 *
 * Every block in this catalog is responsive and there was no way to see it.
 * The obvious fix — put the preview in a narrower box — does not work, and
 * the reason is worth stating because it is the whole design constraint:
 * Tailwind's `sm:` and `md:` are viewport media queries, so a 375px-wide
 * container renders the *desktop* layout squeezed into 375px. What you see
 * is not what a phone gets; it is a lie that looks like a feature.
 *
 * A real viewport means a real frame. This route is what an iframe on the
 * detail page points at: the artifact, the app's stylesheet, and nothing
 * else. No header, no footer, no nav — that furniture is what the reader is
 * trying to see past.
 *
 * ── THEME ───────────────────────────────────────────────────────────────
 *
 * Not passed in. The frame is same-origin, so the root layout's
 * ThemeProvider reads the same `localStorage` key the parent page did and
 * lands on the same theme by itself. A `?theme=` parameter would be a
 * second source of truth that could disagree with the switch in the header.
 *
 * ── NOT INDEXED ─────────────────────────────────────────────────────────
 *
 * `noindex`, because this is the same content as `/block/<id>` with the
 * context stripped out. Letting a search engine choose between them is how
 * a catalog ends up ranking its own chrome-less duplicates above the pages
 * that can actually sell something.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockPreview } from '@/components/blocks/block-preview'
import { PagePreview } from '@/components/pages/page-preview'
import { BLOCKS, getBlock } from '@/lib/blocks/blocks'
import { PAGES, getPage } from '@/lib/pages/pages'

const LEVELS = ['block', 'page'] as const
type PreviewLevel = (typeof LEVELS)[number]

function isPreviewLevel(value: string): value is PreviewLevel {
  return (LEVELS as readonly string[]).includes(value)
}

export const dynamicParams = false

export function generateStaticParams() {
  return [
    ...BLOCKS.map((block) => ({ level: 'block', slug: block.id })),
    ...PAGES.map((page) => ({ level: 'page', slug: page.id })),
  ]
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ level: string; slug: string }>
  searchParams: Promise<{ dir?: string }>
}

export default async function ArtifactPreviewFrame({ params, searchParams }: PageProps) {
  const { level, slug } = await params
  if (!isPreviewLevel(level)) notFound()

  const artifact = level === 'block' ? getBlock(slug) : getPage(slug)
  if (!artifact) notFound()

  /*
   * `?dir=rtl` — the other reason this route exists.
   *
   * Direction is a document-level property in every sense that matters: it
   * flips `padding-inline-start`, the writing order of inline content, and
   * the default alignment of tables and lists. Setting `dir` on a div
   * inside the parent page gets some of that and not all of it, and the
   * parts it misses are exactly the parts a reader is checking for. A frame
   * carrying a real `dir` on a real element is the honest test.
   *
   * `dynamicParams = false` prerenders the LTR form; the RTL variant is the
   * same page with one attribute, so it costs nothing to serve.
   */
  const { dir } = await searchParams
  const rtl = dir === 'rtl'

  return (
    /*
     * `min-h-screen` and the background token, because the frame is its own
     * document: without them a short block sits on the browser's default
     * white and the dark theme looks broken at exactly the width someone
     * switched to in order to check it.
     */
    <main dir={rtl ? 'rtl' : undefined} className="min-h-screen bg-background text-foreground">
      {level === 'block' ? (
        <BlockPreview componentKey={artifact.previewComponent} />
      ) : (
        <PagePreview componentKey={artifact.previewComponent} />
      )}
    </main>
  )
}
