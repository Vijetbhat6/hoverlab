import { getPage } from '@/lib/pages/pages'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse, readDeep } from '@/lib/api/artifacts'
import { apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/pages/{id} — one page, with its source.
 *
 * `files` is the page source alone, not the blocks it imports. A page's
 * source imports from `@/components/...`, so installing one without its
 * blocks leaves broken imports. Pass `?deep=true` to get those blocks in
 * the same `files` array — that is what `hoverlab add <page>` does, and it
 * is opt-in so a client that only wants to read the page is not sent ten
 * times the payload to do it.
 */

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return artifactDetailResponse({
    id,
    artifact: getPage(id),
    level: 'page',
    siteOrigin: siteUrl,
    deep: readDeep(new URL(request.url)),
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
