import type { Metadata } from 'next'

import { ToolPermalinkGallery } from '@/components/designer-tools/tool-permalink-gallery'
import { parseToolState, type SearchParams } from '@/lib/tools/permalink'
import { PALETTE_PERMALINK } from '@/lib/tools/permalinks/palette'
import { toolPageMetadata } from '@/lib/tools/tool-page-metadata'
import PaletteTool from './palette-tool'

/**
 * /tools/palette — the server half.
 *
 * A palette is a base colour and a harmony, and `generatePalette` is a
 * pure function of exactly those two. That is what makes the permalink
 * worth having here: the server can resolve the link to five real
 * swatches and put them in the HTML, so a shared palette is a document
 * rather than a bookmark that only means something once JavaScript runs.
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
  return searchParams.then((params) => toolPageMetadata(PALETTE_PERMALINK, params))
}

export default async function PaletteToolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { state, fromLink } = parseToolState(PALETTE_PERMALINK, params)

  return (
    <PaletteTool
      initial={fromLink ? state : undefined}
      permalinks={
        <ToolPermalinkGallery
          spec={PALETTE_PERMALINK}
          current={state}
          heading="Palettes, as links"
          blurb="Twelve starting points — a base colour people search for by name, paired with the harmony that flatters it. Open one, retune the base, and the address bar follows; what is in it is the palette."
        />
      }
    />
  )
}
