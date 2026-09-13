import { PRIMITIVE_INDEX, populatedPrimitiveCategories } from '@/lib/primitives/primitive-index'
import { siteUrl } from '@/lib/site'
import { apiPreflight, artifactListResponse } from '@/lib/api/public'

/**
 * GET /api/v1/primitives — search and browse the primitive catalog.
 *
 * Same query params as `/api/v1/blocks`: q, category, featured, limit,
 * offset. Metadata only, for the same reason: `hoverlab search combobox`
 * should be one small round-trip, and the source is what `hoverlab add`
 * fetches afterwards.
 *
 * Reads `primitive-index` rather than `primitives` — the index is the same
 * metadata without the inlined sources, so listing 27 controls does not
 * pull 160 KB of TSX into the route's graph to produce names and tags.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return artifactListResponse({
    url: new URL(request.url),
    items: PRIMITIVE_INDEX,
    categories: populatedPrimitiveCategories(),
    siteOrigin: siteUrl,
    key: 'primitives',
    extend: (primitive) => ({ deps: primitive.deps, lines: primitive.lines }),
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
