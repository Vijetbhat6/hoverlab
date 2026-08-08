import { PAGE_INDEX, populatedPageCategories } from '@/lib/pages/page-index'
import { siteUrl } from '@/lib/site'
import { apiPreflight, artifactListResponse } from '@/lib/api/public'

/**
 * GET /api/v1/pages — search and browse the page catalog.
 *
 * `composedOf` rides along on every summary. It is the cheapest thing that
 * makes the tier navigable from a client: an agent that fetched a page can
 * see which blocks it is built from without a second request, and can offer
 * "install just the pricing table" instead of the whole screen.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return artifactListResponse({
    url: new URL(request.url),
    items: PAGE_INDEX,
    categories: populatedPageCategories(),
    siteOrigin: siteUrl,
    key: 'pages',
    extend: (page) => ({
      deps: page.deps,
      lines: page.lines,
      composedOf: page.composedOf,
    }),
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
