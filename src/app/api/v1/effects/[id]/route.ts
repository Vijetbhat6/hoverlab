import { getEffect } from '@/lib/effects'
import { siteUrl } from '@/lib/site'
import { customizeCss, type CustomizationOptions } from '@/lib/customize'
import { FRAMEWORKS, exportEffect, isFrameworkId } from '@/lib/export'
import {
  API_VERSION,
  DETAIL_CACHE,
  apiError,
  apiJson,
  apiPreflight,
  toSummary,
} from '@/lib/api/public'

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

  const css = customizeCss(effect.css, opts)
  const generated = exportEffect(
    {
      id: effect.id,
      name: effect.name,
      description: effect.description,
      category: effect.category,
      html: effect.html,
      css,
    },
    requested,
  )

  return apiJson(
    {
      version: API_VERSION,
      effect: {
        ...toSummary(effect, siteUrl),
        darkSurface: effect.darkSurface === true,
        previewClass: effect.previewClass ?? null,
      },
      framework: generated.framework,
      files: generated.files,
      notes: generated.notes,
      /** The raw source, so clients can run their own transforms. */
      source: { html: effect.html, css },
      customization: opts,
    },
    { cache: DETAIL_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
