import { getBlock } from '@/lib/blocks/blocks'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse } from '@/lib/api/artifacts'
import { apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/blocks/{id} — one block, with its source.
 *
 * No `framework` param, unlike the effect route. An effect is CSS and can
 * be re-expressed as Vue or Svelte without losing anything; a block is
 * three hundred lines of React with hooks, generics and event handlers, and
 * a machine translation of it would be a worse block that claimed to be the
 * same one. The tier ships as what it was written as.
 */

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return artifactDetailResponse({
    id,
    artifact: getBlock(id),
    level: 'block',
    siteOrigin: siteUrl,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
