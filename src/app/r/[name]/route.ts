import { buildRegistryItem } from '@/lib/registry/registry'
import { siteUrl } from '@/lib/site'
import { apiError, apiJson, apiPreflight, ARTIFACT_CACHE } from '@/lib/api/public'

/**
 * GET /r/{name}.json — one registry item, with its source inlined.
 *
 * This is the URL `npx shadcn add` actually fetches, and the shape of it is
 * fixed by the CLI, not by us: a project configures
 *
 *   "registries": { "@hoverlab": "https://hoverlab.dev/r/{name}.json" }
 *
 * and every `@hoverlab/hero-split` becomes a GET here. The `.json` is part
 * of the filename, not a Next.js convention, so the segment captures it and
 * this route strips it — `/r/hero-split.json` and `/r/hero-split` both
 * resolve, because a human poking at the API by hand will drop the
 * extension and there is no reason to 404 them for it.
 *
 * `ARTIFACT_CACHE`, matching `/api/v1/blocks/{id}`: a block is hand-written
 * code that gets fixed, and an accessibility bug repaired today should
 * reach the next install rather than sit pinned at the edge for a year.
 */

export const runtime = 'nodejs'

/*
 * Served on demand rather than prerendered, matching every other public
 * route here.
 *
 * A `generateStaticParams` over the 143 item names was the obvious idea and
 * was removed: a Route Handler taking `request` is dynamic regardless, so
 * the function built nothing and only looked like it did. The CDN does the
 * same job through `ARTIFACT_CACHE` below — which is exactly how
 * `/api/v1/blocks/{id}` already works, and an agent resolving a page pulls a
 * dozen of these in a burst from the edge either way.
 */

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params
  const item = buildRegistryItem(name.replace(/\.json$/, ''), siteUrl)

  if (!item) {
    return apiError('Registry item not found.', 404, {
      hint: 'Every item is listed at /registry.json.',
    })
  }

  return apiJson(
    { $schema: 'https://ui.shadcn.com/schema/registry-item.json', ...item },
    { cache: ARTIFACT_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
