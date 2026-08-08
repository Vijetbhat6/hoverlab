import { getTemplate } from '@/lib/templates/templates'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse } from '@/lib/api/artifacts'
import { apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/templates/{id} — the whole project as JSON.
 *
 * This is what `hoverlab init` writes. JSON rather than the zip at
 * `/api/templates/{id}/download`, deliberately: the CLI is dependency-free
 * on principle, and adding an unzip library to it would cost every user of
 * `hoverlab add` an install they get nothing from. ~200 KB of JSON over one
 * request is the cheaper trade.
 *
 * Paths arrive ready to write — `gitignore` has already become
 * `.gitignore`, so the extracted project and the downloaded zip are the
 * same project.
 */

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return artifactDetailResponse({
    id,
    artifact: getTemplate(id),
    level: 'template',
    siteOrigin: siteUrl,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
