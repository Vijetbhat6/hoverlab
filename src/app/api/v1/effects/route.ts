import { EFFECTS, CATEGORIES } from '@/lib/effects'
import { siteUrl } from '@/lib/site'
import {
  API_VERSION,
  LIST_CACHE,
  apiJson,
  apiPreflight,
  readPagination,
  searchArtifacts,
  toSummary,
} from '@/lib/api/public'

/**
 * GET /api/v1/effects — search and browse the catalog.
 *
 * Query params:
 *   q          free-text search across id, name, tags, category, description
 *   category   exact category filter (see `categories` in the response)
 *   featured   `true` to restrict to the curated set
 *   limit      1–100, default 20
 *   offset     pagination cursor, default 0
 *
 * Returns metadata only — no `html` / `css`. Clients that need the source
 * follow up on `/api/v1/effects/{id}`, which is where the framework
 * codegen lives. Keeping the list lean matters: `hoverlab search gradient`
 * should be one small round-trip, not a megabyte of CSS.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const { limit, offset } = readPagination(url, { limit: 20, maxLimit: 100 })

  const category = url.searchParams.get('category') ?? undefined
  if (category && !CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase())) {
    return apiJson(
      {
        error: `Unknown category: ${category}`,
        categories: CATEGORIES,
      },
      { status: 400 },
    )
  }

  const { items: effects, total } = searchArtifacts(EFFECTS, {
    q: url.searchParams.get('q') ?? undefined,
    category,
    featured: url.searchParams.get('featured') === 'true',
    limit,
    offset,
  })

  return apiJson(
    {
      version: API_VERSION,
      total,
      limit,
      offset,
      categories: CATEGORIES,
      effects: effects.map((e) => toSummary(e, siteUrl)),
    },
    { cache: LIST_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
