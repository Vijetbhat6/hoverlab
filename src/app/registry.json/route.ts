import { buildRegistryIndex } from '@/lib/registry/registry'
import { parseRegistrySearch, searchRegistryItems } from '@/lib/registry/search'
import { siteUrl } from '@/lib/site'
import { apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /registry.json — the shadcn registry discovery document.
 *
 * This URL is the one third parties ask for by name. registry.directory
 * audits it on submission and re-fetches it to index items; the shadcn MCP
 * server reads it to answer "what does this registry have"; a human pastes
 * it into `components.json` to get `@hoverlab/...` working. It has to live
 * at the root, spelled exactly this way, which is why the route segment is
 * literally `registry.json` rather than something tidier under `/api`.
 *
 * Metadata only — no file contents. See `buildRegistryIndex`.
 *
 * `LIST_CACHE` rather than the long detail cache: this document changes
 * every time a block lands, and a registry that advertises a stale item list
 * is the one failure mode an indexer will notice.
 *
 * ── DYNAMIC SEARCH ──────────────────────────────────────────────────────
 *
 * The same URL answers `?q=&type=&limit=&offset=`. That is not an API of
 * our design: shadcn's dynamic-search contract puts server-side search on
 * the registry document itself rather than on a second endpoint, and the
 * CLI signals nothing — it simply appends the params. See
 * `lib/registry/search.ts` for why that matters at 1,211 items.
 *
 * TWO SHAPES, ONE URL, AND THE DISTINCTION IS LORE-CRITICAL:
 *
 *   no params    the complete static index, byte-identical to what shipped
 *                before this. registry.directory's audit and the MCP
 *                server's enumeration both depend on getting everything,
 *                and a default page size applied here would make a 1,211
 *                item registry look 50 items long to every indexer.
 *
 *   any param    the matching page, plus `pagination`. The presence of
 *                that object is what tells the CLI it need not download
 *                and filter the whole catalog itself.
 */

export const runtime = 'nodejs'

/**
 * The index, built once per origin.
 *
 * `buildRegistryIndex` walks 210 blocks, 21 pages and 973 effects and
 * converts every effect's CSS on the way. That was fine when the route was
 * one document per deploy and is not fine now that a search is a request:
 * a CLI paging through results would rebuild the whole catalog per page.
 * The origin is fixed at runtime, so the map has exactly one entry in
 * practice — it is keyed anyway so that a preview deployment answering on
 * two hostnames cannot serve one of them the other's URLs.
 */
const INDEX_CACHE = new Map<string, ReturnType<typeof buildRegistryIndex>>()

function indexFor(origin: string) {
  let index = INDEX_CACHE.get(origin)
  if (!index) {
    index = buildRegistryIndex(origin)
    INDEX_CACHE.set(origin, index)
  }
  return index
}

export async function GET(request: Request) {
  const index = indexFor(siteUrl)
  const params = parseRegistrySearch(new URL(request.url))

  if (!params.requested) return apiJson(index, { cache: LIST_CACHE })

  const { items, pagination } = searchRegistryItems(index.items, params)

  return apiJson({ ...index, items, pagination }, { cache: LIST_CACHE })
}

export async function OPTIONS() {
  return apiPreflight()
}
