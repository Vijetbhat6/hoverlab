import { getBlock } from '@/lib/blocks/blocks'
import { siteUrl } from '@/lib/site'
import { artifactDetailResponse } from '@/lib/api/artifacts'
import { apiPreflight, apiError, apiJson, API_VERSION, ARTIFACT_CACHE } from '@/lib/api/public'
import { blockMarkup, markupNotes } from '@/lib/blocks/block-markup'
import {
  MARKUP_FRAMEWORKS,
  isMarkupFramework,
  wrapMarkup,
  type MarkupFramework,
} from '@/lib/blocks/markup-frameworks'


/**
 * GET /api/v1/blocks/{id} — one block, with its source.
 * GET /api/v1/blocks/{id}?format=html — the same block as rendered markup.
 * GET /api/v1/blocks/{id}?format=html&framework=vue — that markup, as a file.
 *
 * `framework` selects a FILE FORMAT, never a translation, and the original
 * reason still holds: an effect is CSS
 * and can be re-expressed as Vue or Svelte without losing anything; a block
 * is three hundred lines of React with hooks, generics and event handlers,
 * and a machine translation of it would be a worse block that claimed to be
 * the same one. The tier ships as what it was written as.
 *
 * `format=html` is not that. It does not claim to be the block in another
 * framework — it is the component rendered once, returned as HTML with its
 * Tailwind classes intact, with the caveats attached to the response. That
 * is the thing a non-React developer can actually use, and it is honest
 * about being one frame with the handlers gone. See `block-markup.ts`.
 */

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const block = getBlock(id)

  const url = new URL(request.url)

  if (url.searchParams.get('format') === 'html') {
    if (!block) return apiError('Block not found.', 404)

    const html = blockMarkup(block.id)
    if (!html) {
      // A catalog entry naming a preview the registry does not have. The
      // detail page renders a visible placeholder for this; here it is a
      // 500, because it is our bug and not a bad request.
      return apiError('Block has no registered preview to render.', 500)
    }

    const isInteractive = block.files.some((f) => f.source.includes("'use client'"))

    /*
     * `?framework=` narrows the *file format*, not the code.
     *
     * Still no translation — the note at the top of this file stands. What
     * this returns is the same rendered markup wrapped as a file the target
     * compiles, with the caveat carried inside the file rather than only in
     * `notes`. See `lib/blocks/markup-frameworks.ts` for why a
     * template-only SFC is a real component and not a costume.
     */
    const requested = url.searchParams.get('framework')
    if (requested && !isMarkupFramework(requested)) {
      return apiError(
        `Unknown framework "${requested}". One of: ${MARKUP_FRAMEWORKS.join(', ')}.`,
        400,
      )
    }

    const framework = (requested ?? 'html') as MarkupFramework
    const wrapped = wrapMarkup(html, {
      framework,
      id: block.id,
      name: block.name,
      isInteractive,
    })

    return apiJson(
      {
        version: API_VERSION,
        id: block.id,
        name: block.name,
        level: 'block' as const,
        format: 'html' as const,
        framework,
        html,
        file: wrapped,
        deps: [],
        notes: markupNotes(isInteractive),
      },
      { cache: ARTIFACT_CACHE },
    )
  }

  return artifactDetailResponse({
    id,
    artifact: block,
    level: 'block',
    siteOrigin: siteUrl,
  })
}

export async function OPTIONS() {
  return apiPreflight()
}
