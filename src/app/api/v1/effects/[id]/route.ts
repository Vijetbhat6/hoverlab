import { getEffect } from '@/lib/effects'
import { siteUrl } from '@/lib/site'
import type { CustomizationOptions } from '@/lib/customize'
import { FRAMEWORKS, isFrameworkId } from '@/lib/export'
import { buildEffectPayload } from '@/lib/api/artifacts'
import { DETAIL_CACHE, apiError, apiJson, apiPreflight } from '@/lib/api/public'

/**
 * GET /api/v1/effects/{id} — one effect, in the framework you asked for.
 *
 * Query params:
 *   framework   html | css | react | vue | svelte | styled-components | tailwind
 *               (default: css)
 *   hue, sat, scale, speed
 *               the same customization knobs the site's sliders drive, so
 *               a shared/customized URL can be installed verbatim by the
 *               CLI rather than only viewed in the browser
 *
 * The response carries the generated files, the caveats for that target,
 * and the raw html/css — enough for the CLI to write files, and enough for
 * an MCP client to reason about the effect without a second request.
 */

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** Read a numeric query param, falling back when absent or malformed. */
function readNumber(url: URL, key: string, fallback: number): number {
  const raw = url.searchParams.get(key)
  if (raw === null) return fallback
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const url = new URL(request.url)

  const effect = getEffect(id)
  if (!effect) {
    return apiError(`No effect with id "${id}"`, 404, {
      hint: `Search for one at ${siteUrl}/api/v1/effects?q=${encodeURIComponent(id)}`,
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

  return apiJson(buildEffectPayload(effect, siteUrl, requested, opts), {
    cache: DETAIL_CACHE,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
