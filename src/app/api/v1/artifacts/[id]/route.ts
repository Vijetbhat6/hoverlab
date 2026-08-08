import { siteUrl } from '@/lib/site'
import type { CustomizationOptions } from '@/lib/customize'
import { FRAMEWORKS, isFrameworkId } from '@/lib/export'
import {
  buildArtifactPayload,
  buildEffectPayload,
  readDeep,
  resolveArtifact,
} from '@/lib/api/artifacts'
import { ARTIFACT_CACHE, DETAIL_CACHE, apiError, apiJson, apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/artifacts/{id} — one artifact, whichever rung it sits on.
 *
 * This exists so `npx hoverlab add product-grid` works. The user knows the
 * id they saw on the site; they do not know, and should not have to say,
 * whether it is an effect, a block or a page. Without this route the CLI
 * would have to guess a tier and retry on 404 — three round-trips and a
 * confusing error when all three miss.
 *
 * The body is a discriminated union on `level`. An effect resolves to
 * exactly what `/api/v1/effects/{id}` returns (framework codegen and all);
 * everything above it to what `/api/v1/{level}s/{id}` returns. Both are
 * built by the same functions those routes call, so a client can follow
 * `level` to the tier-specific route and get an identical answer.
 *
 * Query params:
 *   framework, hue, sat, scale, speed   effect ids only — ignored otherwise
 *   deep=true                           page ids: include the blocks it
 *                                       imports, so the result installs and
 *                                       compiles rather than only describing
 *
 * 404s list the four tiers searched, because "no artifact with id x" is
 * otherwise indistinguishable from "this endpoint only knows about effects".
 */

export const runtime = 'nodejs'

/** Read a numeric query param, falling back when absent or malformed. */
function readNumber(url: URL, key: string, fallback: number): number {
  const raw = url.searchParams.get(key)
  if (raw === null) return fallback
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const url = new URL(request.url)

  const resolved = resolveArtifact(id)
  if (!resolved) {
    return apiError(`No artifact with id "${id}"`, 404, {
      searched: ['effect', 'block', 'page', 'template'],
      hint: `Search for one at ${siteUrl}/api/v1/effects?q=${encodeURIComponent(id)}`,
    })
  }

  if (resolved.level !== 'effect') {
    return apiJson(buildArtifactPayload(resolved.artifact, siteUrl, { deep: readDeep(url) }), {
      cache: ARTIFACT_CACHE,
    })
  }

  const requested = url.searchParams.get('framework') ?? 'css'
  if (!isFrameworkId(requested)) {
    return apiError(`Unknown framework "${requested}"`, 400, {
      frameworks: FRAMEWORKS.map((f) => f.id),
    })
  }

  const opts: CustomizationOptions = {
    hue: readNumber(url, 'hue', 0),
    saturation: readNumber(url, 'sat', 0),
    scale: readNumber(url, 'scale', 1),
    speed: readNumber(url, 'speed', 1),
  }

  return apiJson(buildEffectPayload(resolved.effect, siteUrl, requested, opts), {
    cache: DETAIL_CACHE,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
