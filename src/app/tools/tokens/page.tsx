import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { TOKENS_PERMALINK } from '@/lib/tools/permalinks/tokens'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import TokensTool from './tokens-tool'

/**
 * /tools/tokens — the server half.
 *
 * A whole shadcn theme falls out of four numbers, which makes this the
 * tool whose permalink is most obviously overdue. A theme used to be
 * shareable only as a 600-character base64 fragment; it is actually a
 * hue, a chroma and a radius, and those are worth being able to read,
 * compare and hand-edit in a review.
 *
 * The split is thin on purpose. This file reads the query string, decides
 * what the page is ABOUT — the <title>, the description, the canonical —
 * and hands the parsed state to the same client component that always
 * rendered the tool. The tool did not become a server component and could
 * not: it is controls over a live preview.
 *
 * `initial` is passed only when the URL actually carried a state. That is
 * why `parseToolState` reports `fromLink` separately: a link spelling out
 * the defaults must still outrank whatever this browser had in
 * `localStorage`, and a bare visit must not. Passing it unconditionally
 * would make every visit look like a shared link and break the restore that
 * was already there.
 */

export function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  return searchParams.then((params) => toolPageMetadata(TOKENS_PERMALINK, params))
}

export default async function TokensToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(TOKENS_PERMALINK, params)

  return (
    <TokensTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={TOKENS_PERMALINK}
          current={state}
          heading="Themes, as links"
          blurb="Eight token sets spanning the two decisions anyone actually makes here — how saturated the accent is, and how round the corners are. Every block in the catalog is styled against these names, so one of these links themes all of it."
        />
      }
    />
  )
}
