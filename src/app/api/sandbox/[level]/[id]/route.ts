import { siteUrl } from '@/lib/site'
import { apiError, apiJson, ARTIFACT_CACHE } from '@/lib/api/public'
import { buildArtifactSandbox, isSandboxLevel } from '@/lib/export/artifact-sandbox'

/**
 * GET /api/sandbox/{block|page}/{id} — the StackBlitz POST payload.
 *
 * WHY A ROUTE AND NOT A PROP. The button could have been handed its form
 * fields at render time, but a project is a package.json, a tsconfig, a
 * Vite config, the whole token sheet and the sources — about 15 KB per
 * artifact, and the source half of that is already in the page as the code
 * block underneath. Serving it on click keeps every block and page detail
 * page exactly as heavy as it was before the button existed, which matters
 * on the tier of the site that gets crawled.
 *
 * Not under /api/v1. The public API is a contract we ask people to build
 * against and this is an implementation detail of one button — the shape
 * of a third party's form fields, which we do not control and would have
 * to keep stable if it were versioned.
 *
 * Public and unauthenticated, like the rest of the catalog surface. There
 * is deliberately no `template` level: see the header of
 * `lib/export/artifact-sandbox.ts` for why that would be a paywall hole.
 */

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ level: string; id: string }> },
) {
  const { level, id } = await context.params

  if (!isSandboxLevel(level)) {
    return apiError(
      `No sandbox for "${level}". Blocks and pages only — templates ship as a download.`,
      404,
    )
  }

  const sandbox = buildArtifactSandbox(level, id, siteUrl)
  if (!sandbox) return apiError(`No ${level} with id "${id}".`, 404)

  return apiJson(
    {
      level,
      id,
      openFile: sandbox.openFile,
      action: sandbox.form.action,
      fields: sandbox.form.fields,
    },
    { cache: ARTIFACT_CACHE },
  )
}
