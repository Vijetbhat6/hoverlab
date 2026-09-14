import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { SHADOW_PERMALINK } from '@/lib/tools/permalinks/shadow'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import ShadowTool from './shadow-tool'

/**
 * /tools/shadow — the server half.
 *
 * A shadow is the hardest of the six to put in a URL — eight fields per
 * layer, up to eight layers — and the one where a shareable link pays
 * off most, because nobody reproduces a three-layer elevation stack by
 * describing it. The layer form matches how `box-shadow` is written, so
 * the URL stays legible at that size.
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
  return searchParams.then((params) => toolPageMetadata(SHADOW_PERMALINK, params))
}

export default async function ShadowToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(SHADOW_PERMALINK, params)

  return (
    <ShadowTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={SHADOW_PERMALINK}
          current={state}
          heading="Shadows, as links"
          blurb="Nine stacks, each a shape rather than a setting — the hairline that stands in for a border, the elevation that reads as height, the two-offset neumorphic pair that only makes sense on a matched surface."
        />
      }
    />
  )
}
