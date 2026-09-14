import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { GRADIENT_PERMALINK } from '@/lib/tools/permalinks/gradient'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import GradientTool from './gradient-tool'

/**
 * /tools/gradient — the server half.
 *
 * The stop list is the reason this tool has the most carefully designed
 * encoding of the six: `f43f5e@0,10b981@100` is the CSS in the same
 * order the CSS is written in, so somebody who can read a
 * `linear-gradient` can read the URL without a key. That is the real
 * test of "readable", not character count.
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
  return searchParams.then((params) => toolPageMetadata(GRADIENT_PERMALINK, params))
}

export default async function GradientToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(GRADIENT_PERMALINK, params)

  return (
    <GradientTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={GRADIENT_PERMALINK}
          current={state}
          heading="Gradients, as links"
          blurb="Ten gradients, including the same three stops twice — once in sRGB and once in OKLCH — because the muddy midpoint that comparison exposes is the most useful thing this tool has to say."
        />
      }
    />
  )
}
