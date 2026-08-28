import { decodeTheme, themeRegistryItem, DEFAULT_THEME } from '@/lib/shadcn-theme'
import { apiError, apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /r/theme.json?t={packed} — one generated theme, as a registry item.
 *
 * Every other item under /r/ is a thing we wrote and can name. This one is
 * a thing the visitor made thirty seconds ago on /tools/shadcn, and the
 * whole point of the page is that they can install it without an account,
 * a saved project, or anything of theirs living on our side. So the theme
 * travels in the URL: `?t=` carries the four knobs plus whatever tokens
 * were overridden, and this route decodes that back into the JSON
 * `npx shadcn add` reads.
 *
 * Nothing is stored, nothing is looked up, and the same URL will produce
 * the same theme in a year — which is what makes it safe to paste into a
 * README or a team's setup notes.
 *
 * WHY IT SITS BESIDE `[name]` RATHER THAN INSIDE IT
 *
 * `/r/{name}.json` resolves a name against the catalog and 404s on a miss,
 * which is right for it and wrong for this: there is no `theme` item to
 * find. A literal route segment wins over the dynamic sibling in Next's
 * matcher, so this file claims exactly the one URL it needs and leaves
 * every other name to the catalog.
 *
 * `LIST_CACHE` rather than the long artifact cache: the response is a pure
 * function of the query string, so caching is safe at any length, but the
 * generator's derivation may be improved and a theme URL pinned at the
 * edge for a year would keep serving the old maths.
 */

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('t')

  /* No `t` at all is a person poking at the API by hand — serve the
     default theme rather than an error, so the shape is discoverable. A
     `t` that is present and unreadable is a different thing: something
     truncated it, and silently installing a theme they did not make is
     worse than telling them. */
  if (param !== null) {
    const decoded = decodeTheme(param)
    if (!decoded) {
      return apiError('That theme parameter could not be read.', 400, {
        hint: 'Copy the install command again from hoverlab.dev/tools/shadcn — the ?t= value was probably truncated.',
      })
    }
    return apiJson(themeRegistryItem(decoded), { cache: LIST_CACHE })
  }

  return apiJson(themeRegistryItem(DEFAULT_THEME), { cache: LIST_CACHE })
}

export async function OPTIONS() {
  return apiPreflight()
}
