import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { CONTRAST_PERMALINK } from '@/lib/tools/permalinks/contrast'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import ContrastTool from './contrast-tool'

/**
 * /tools/contrast — the server half.
 *
 * Every tool under /tools was a single `'use client'` file, which is right
 * for nineteen of them and was quietly wrong for this one. A contrast pair
 * is two colours and a verdict; that is a fact about the world somebody
 * searched for, and it was sitting behind a URL the server never saw — the
 * state lived in `#s=`, which browsers do not send.
 *
 * Splitting the page in two is what fixes it, and the split is thin on
 * purpose. This file reads the query string, decides what the page is ABOUT
 * — the <title>, the description, the canonical — and hands the parsed
 * state to the same client component that always rendered the tool. The
 * tool did not become a server component and could not: it is sliders over
 * a live preview.
 *
 * `initial` is passed only when the URL actually carried a pair. That
 * distinction is the whole reason `parseToolState` returns `fromLink`
 * separately from the state: a link spelling out the defaults must still
 * outrank whatever this browser had in `localStorage`, and a bare visit
 * must not. Passing the state unconditionally would make every visit look
 * like a shared link and quietly break the restore that was already there.
 */

export function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  return searchParams.then((params) => toolPageMetadata(CONTRAST_PERMALINK, params))
}

export default async function ContrastToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(CONTRAST_PERMALINK, params)

  return (
    <ContrastTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={CONTRAST_PERMALINK}
          current={state}
          heading="Contrast pairs, as links"
          blurb="The pairs people actually open a checker to settle — greys on white at the step where they stop passing, and white on each of the colours a button gets painted. Each one is a URL; open it, nudge either colour, and the address bar follows."
        />
      }
    />
  )
}
