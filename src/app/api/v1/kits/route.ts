import { KITS, getKit } from '@/lib/kits/catalog'
import { kitGroups, kitItems, kitSize } from '@/lib/kits/resolve'
import { siteUrl } from '@/lib/site'
import { apiError, apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /api/v1/kits — the curated cross-rung sets.
 *
 * Query params:
 *   slug   one kit's full contents instead of the list
 *
 * ── Why one route and not the usual list/detail pair ──
 *
 * Every other v1 resource has `/{thing}` and `/{thing}/{id}` because the
 * detail response carries source and the list cannot afford to. A kit has
 * no source of its own — it is names and ids, and its "detail" is a few
 * kilobytes — so a second route would exist only for symmetry, and would
 * be a second place for the shape to drift. `?slug=` covers it.
 *
 * ── What an agent gets out of this ──
 *
 * The install line. An agent asked to "build a storefront" can read one
 * kit and know the ids to hand `hoverlab add`, which is the thing it could
 * not do before: the four list endpoints are one rung each, and picking
 * the storefront pieces out of 210 blocks was the agent's problem. That is
 * why `install` is precomputed here rather than left to be assembled from
 * `items` — the assembly is where a caller gets it subtly wrong.
 *
 * Counts and contents both come from `resolve.ts`, so this response and
 * the page at /kits/{slug} cannot disagree about what a kit holds.
 */

export const runtime = 'nodejs'

const origin = siteUrl.replace(/\/$/, '')

function serialize(slug: string) {
  const kit = getKit(slug)
  if (!kit) return null

  const items = kitItems(kit)

  return {
    slug: kit.slug,
    name: kit.name,
    tagline: kit.tagline,
    description: kit.description,
    audience: kit.audience,
    size: kitSize(kit),
    url: `${origin}/kits/${kit.slug}`,
    install: `npx hoverlab add ${items.map((i) => i.id).join(' ')}`,
    contents: kitGroups(kit).map((group) => ({
      level: group.level,
      count: group.items.length,
      items: group.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        url: `${origin}${item.href}`,
      })),
    })),
  }
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')

  if (slug) {
    const kit = serialize(slug)
    if (!kit) {
      return apiError(`No kit with slug "${slug}".`, 404, {
        available: KITS.map((k) => k.slug),
      })
    }
    return apiJson({ kit }, { cache: LIST_CACHE })
  }

  /*
   * The list carries the summary and the size but not the item arrays. Six
   * kits' full contents is 133 rows, which is small enough to be tempting
   * and still the wrong default: a caller that wants one kit's ids should
   * say which kit, and a caller listing them wants to choose between them.
   */
  return apiJson(
    {
      kits: KITS.map((kit) => ({
        slug: kit.slug,
        name: kit.name,
        tagline: kit.tagline,
        audience: kit.audience,
        size: kitSize(kit),
        url: `${origin}/kits/${kit.slug}`,
        contents: kitGroups(kit).map((group) => ({
          level: group.level,
          count: group.items.length,
        })),
      })),
      total: KITS.length,
    },
    { cache: LIST_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
