import { getTemplate } from '@/lib/templates/templates'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse } from '@/lib/api/artifacts'
import { apiPreflight } from '@/lib/api/public'
import { getSession } from '@/lib/session'
import { entitlementsForApiRequest } from '@/lib/billing/api-key'

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
 *
 * THE ONE AUTHENTICATED ROUTE in `/api/v1`, and the exception is narrow on
 * purpose. Six of the seven templates are Pro; everything else in the
 * catalog — every effect, block and page, and `marketing-site` — answers
 * to an anonymous request exactly as it always has. An unlicensed caller
 * still gets the full description here, including the file count and the
 * route table, and no file bodies. See `lib/templates/catalog.ts` for why
 * the line is at this rung, and `lib/billing/api-key.ts` for the key.
 */

export const runtime = 'nodejs'
/**
 * Per-caller, so it cannot be prerendered or shared at the edge — the
 * response depends on a bearer token. `artifactDetailResponse` sets
 * `no-store` on the Pro tier for the same reason.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  // The session is read as well as the key so that a customer clicking
  // through from the site — where there is a cookie and no key — is not
  // told to authenticate against an API they are already signed in to.
  const session = await getSession().catch(() => null)
  const ent = await entitlementsForApiRequest(request, session?.uid ?? null)

  return artifactDetailResponse({
    id,
    artifact: getTemplate(id),
    level: 'template',
    siteOrigin: siteUrl,
    licensed: ent.canUseProFeatures,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
