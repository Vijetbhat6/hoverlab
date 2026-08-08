import { TEMPLATE_INDEX, populatedTemplateCategories } from '@/lib/templates/template-index'
import { siteUrl } from '@/lib/site'
import { apiPreflight, artifactListResponse } from '@/lib/api/public'

/**
 * GET /api/v1/templates — search and browse the template catalog.
 *
 * The counts are the point of this response. `hoverlab init` is about to
 * write a whole project into someone's directory, and "43 files, 7 routes"
 * shown before that happens is what makes the command safe to run without
 * reading the site first.
 *
 * Reads `template-index`, which derives its counts from the page and block
 * indexes rather than assembling the projects — the same numbers the site's
 * cards show, at a fraction of the load.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return artifactListResponse({
    url: new URL(request.url),
    items: TEMPLATE_INDEX,
    categories: populatedTemplateCategories(),
    siteOrigin: siteUrl,
    key: 'templates',
    extend: (template) => ({
      deps: template.deps,
      lines: template.lines,
      fileCount: template.fileCount,
      blockCount: template.blockCount,
      composedOf: template.composedOf,
      routes: template.routes,
    }),
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
