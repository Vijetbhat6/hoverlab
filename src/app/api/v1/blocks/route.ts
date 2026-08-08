import { BLOCK_INDEX, populatedBlockCategories } from '@/lib/blocks/block-index'
import { siteUrl } from '@/lib/site'
import { apiPreflight, artifactListResponse } from '@/lib/api/public'

/**
 * GET /api/v1/blocks — search and browse the block catalog.
 *
 * Same query params as `/api/v1/effects`: q, category, featured, limit,
 * offset. Metadata only — `hoverlab search checkout` should be one small
 * round-trip, and a block's source is several kilobytes of TSX that only
 * `hoverlab add` needs.
 *
 * Reads `block-index` rather than `blocks`: the index is the same metadata
 * without the inlined sources, so listing 58 blocks does not load ~53 KB of
 * TSX into the route's graph to produce names and tags.
 *
 * `categories` lists only the populated ones. The full taxonomy runs well
 * ahead of what is built, and a CLI that offered 28 category filters where
 * 21 return nothing would be worse than one offering seven that work.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return artifactListResponse({
    url: new URL(request.url),
    items: BLOCK_INDEX,
    categories: populatedBlockCategories(),
    siteOrigin: siteUrl,
    key: 'blocks',
    extend: (block) => ({ deps: block.deps, lines: block.lines }),
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
