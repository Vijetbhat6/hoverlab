import { buildDna, BRAND_IDS, type DnaSubject } from '@/lib/dna'
import { resolveArtifact } from '@/lib/api/artifacts'
import { siteUrl } from '@/lib/site'
import { apiError, apiJson, apiPreflight, ARTIFACT_CACHE } from '@/lib/api/public'

/**
 * GET /api/v1/dna/{id} — the design system, formatted for an AI tool.
 *
 * `{id}` is any catalog id, or the literal `catalog` for the system on its
 * own. The id does not have to say which rung it belongs to — the same
 * `resolveArtifact` the rest of the API uses works that out.
 *
 * Query params:
 *   format=raw   the markdown itself, as text/markdown. This is the one an
 *                agent should be pointed at.
 *   brand=<id>   apply a brand preset's accent over `--primary`.
 *
 * Public and uncached-per-user like everything under /api/v1. There is no
 * reason to gate this: a design system that only paying customers can hand
 * to their agent is a design system nobody's agent has heard of.
 */

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const url = new URL(request.url)

  let subject: DnaSubject
  if (id === 'catalog') {
    subject = { kind: 'catalog' }
  } else {
    const resolved = resolveArtifact(id)
    if (!resolved) {
      return apiError(`No artifact with id "${id}"`, 404, {
        hint: `Search at ${siteUrl}/api/v1/artifacts?q=${encodeURIComponent(id)}, or ask for "catalog".`,
      })
    }
    subject = { kind: 'artifact', level: resolved.level, id }
  }

  const brand = url.searchParams.get('brand')
  if (brand && !BRAND_IDS.includes(brand)) {
    return apiError(`Unknown brand preset "${brand}"`, 400, { presets: BRAND_IDS })
  }

  const doc = buildDna(subject, { brand, origin: siteUrl })
  if (!doc) return apiError(`No artifact with id "${id}"`, 404)

  if (url.searchParams.get('format') === 'raw') {
    return new Response(doc.markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': ARTIFACT_CACHE,
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  return apiJson(
    {
      id: doc.id,
      title: doc.title,
      markdown: doc.markdown,
      ...doc.json,
      raw: `${siteUrl.replace(/\/$/, '')}/api/v1/dna/${doc.id}?format=raw`,
    },
    { cache: ARTIFACT_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
