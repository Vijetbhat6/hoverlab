import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { TYPOGRAPHY_PERMALINK } from '@/lib/tools/permalinks/typography'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import TypographyTool from './typography-tool'

/**
 * /tools/typography — the server half.
 *
 * Ten fields, and a permalink that is usually two, because the query
 * carries only what differs from the defaults. That asymmetry is the
 * point: the state is large because the tool is thorough, and the URL
 * stays short because almost nobody changes the paragraph spacing.
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
  return searchParams.then((params) => toolPageMetadata(TYPOGRAPHY_PERMALINK, params))
}

export default async function TypographyToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(TYPOGRAPHY_PERMALINK, params)

  return (
    <TypographyTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={TYPOGRAPHY_PERMALINK}
          current={state}
          heading="Type scales, as links"
          blurb="Ten scales, each a pairing and a ratio that belong together — a 1.125 product scale where hierarchy comes from weight, a 1.618 long-read scale where the body has to breathe more than the headings."
        />
      }
    />
  )
}
