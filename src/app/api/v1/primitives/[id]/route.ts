import { getPrimitive } from '@/lib/primitives/primitives'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse } from '@/lib/api/artifacts'
import { apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/primitives/{id} — one primitive, with its source.
 *
 * No `?format=html` here, unlike the block route. A rendered snapshot of a
 * section is a useful thing to hand a non-React developer; a rendered
 * snapshot of a combobox is a div that does not open, because everything
 * that makes it a combobox is the handlers that the render drops. The tier
 * ships as what it was written as.
 */

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  return artifactDetailResponse({
    id,
    artifact: getPrimitive(id),
    level: 'primitive',
    siteOrigin: siteUrl,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
