import { siteUrl, absoluteUrl } from '@/lib/site'
import { apiError, apiJson, LIST_CACHE } from '@/lib/api/public'
import { buildCompositionSandbox } from '@/lib/export/composition-sandbox'
import { builderHref, COMPOSITION_PARAM, parseComposition, THEME_PARAM } from '@/lib/builder/compose'
import { compositionTheme, themeInstallCommand } from '@/lib/builder/theme'

/**
 * GET /api/sandbox/builder?b=hero-split,pricing-tiers — the StackBlitz
 * POST payload for a composition.
 *
 * WHY A ROUTE AND NOT A PROP. Same reason as its artifact sibling: the
 * project is a package.json, a tsconfig, a Vite config, the whole token
 * sheet and every chosen block's source. For a thirty-section composition
 * that is a couple of hundred kilobytes, and `/builder` already ships every
 * one of those blocks once as a live preview. Serving it on click keeps the
 * page as heavy as it was before the button existed.
 *
 * Not under /api/v1, and for a sharper version of the sibling's reason.
 * That is the shape of a third party's form fields, which we do not
 * control; this is that plus an input format — `?b=` — that belongs to one
 * page's query string. Neither is a contract we want to be held to.
 *
 * `LIST_CACHE` rather than the long artifact cache. The response is a pure
 * function of the query string so it is safe to cache at any length, but the
 * blocks it inlines are edited — a composition pinned at the edge for a
 * year would keep serving sections the catalog has since changed.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const { ids } = parseComposition(params.get(COMPOSITION_PARAM) ?? undefined)
  const theme = compositionTheme(params.get(THEME_PARAM) ?? undefined)

  const sandbox = buildCompositionSandbox(ids, {
    siteUrl,
    shareUrl: absoluteUrl(builderHref(ids, theme.param)),
    theme: theme.state,
    themeCommand: themeInstallCommand(theme.param, siteUrl),
  })

  /*
   * One message for both failure modes, because from the caller's side they
   * are the same situation: there is no composition here to run. An empty
   * `?b=` and a `?b=` of ids that no longer exist both mean the button
   * should not have been offered, and the builder does not offer it.
   */
  if (!sandbox) {
    return apiError(
      'That composition has no sections that resolve to a block. Pick some sections in the builder first.',
      404,
    )
  }

  return apiJson(
    {
      sections: ids.length,
      themed: theme.state !== null,
      openFile: sandbox.openFile,
      action: sandbox.form.action,
      fields: sandbox.form.fields,
    },
    { cache: LIST_CACHE },
  )
}
