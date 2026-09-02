/**
 * Server-side search over the registry index — shadcn's "dynamic search".
 *
 * ── WHY ─────────────────────────────────────────────────────────────────
 *
 * `/registry.json` lists every item we publish. That was 143 items when the
 * registry shipped and it is 1,211 now, and the shadcn CLI's default
 * behaviour is to download the whole document and filter it locally. So
 * every `shadcn search @hoverlab button` pulls ~377 KB to show six rows,
 * and every agent asking the MCP server "what does Hoverlab have" pays the
 * same. That cost only goes one way as the catalog grows.
 *
 * shadcn shipped dynamic search in July 2026 for registries in exactly this
 * position. The contract is deliberately tiny: the CLI appends `q`, `type`,
 * `limit` and `offset` to the SAME registry.json URL, and a registry that
 * handles search itself returns the matching items plus a `pagination`
 * object. There is no capability negotiation and no second endpoint —
 * **the presence of `pagination` in the response is the signal**. A
 * registry that ignores the params keeps working, which is why this is
 * additive rather than a version bump.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ───────────────────────────────────────
 *
 * The catalog already has a good search — `lib/browse.ts` and `/api/v1`
 * rank effects for the site and the CLI. This is not that, and must not
 * become that. This ranks *registry items* over the four fields the shadcn
 * schema gives them (`name`, `title`, `description`, `categories`), because
 * those are the only fields the consumer on the other end will ever see.
 * Reaching for richer catalog metadata here would rank on things the CLI
 * cannot display and cannot explain.
 *
 * Pure and dependency-free: it takes items in and gives items out, so it is
 * testable without a server and cannot drag the 1.6 MB effect catalog into
 * a client bundle.
 */

/** The subset of a registry item this module ranks on. */
export interface SearchableItem {
  name: string
  type: string
  title?: string
  description?: string
  categories?: string[]
}

/** shadcn's pagination object. Field names are fixed by the CLI. */
export interface RegistryPagination {
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface RegistrySearchParams {
  q: string
  /** Item types to keep, already split. Empty means every type. */
  types: string[]
  limit: number
  offset: number
  /**
   * Whether the caller asked for anything at all.
   *
   * False for a bare `GET /registry.json`, which must keep returning the
   * complete static document: registry.directory audits it, the shadcn MCP
   * server reads it to enumerate the catalog, and a default page size
   * silently applied to those would make the registry look 50 items long.
   */
  requested: boolean
}

/**
 * Default page size when a search arrives without one.
 *
 * The CLI always sends a limit, so this only covers a human with curl.
 */
const DEFAULT_LIMIT = 50

/**
 * Ceiling on one page.
 *
 * Generous rather than tight, because the CLI is documented to request a
 * limit large enough to fill the page it wants and then paginate the merged
 * results locally — a small cap here would hand it a short page it did not
 * ask for. Even at the ceiling the response is bounded by the full index,
 * which is what an unparameterised request returns anyway.
 */
const MAX_LIMIT = 1000

export function parseRegistrySearch(url: URL): RegistrySearchParams {
  const params = url.searchParams
  const q = (params.get('q') ?? '').trim()
  const typeParam = params.get('type') ?? ''
  const rawLimit = Number.parseInt(params.get('limit') ?? '', 10)
  const rawOffset = Number.parseInt(params.get('offset') ?? '', 10)

  const types = typeParam
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return {
    q,
    types,
    limit: Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT,
    offset: Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0,
    requested:
      params.has('q') || params.has('type') || params.has('limit') || params.has('offset'),
  }
}

/* ------------------------------------------------------------------ *
 *  Ranking
 * ------------------------------------------------------------------ */

function normalise(value: string): string {
  return value.toLowerCase()
}

/**
 * Split a query into terms, and treat `-` and space as the same thing.
 *
 * Every item name in this registry is kebab-case, so a user typing
 * "hero split" and a user typing "hero-split" are asking for one item and
 * must not get different answers. The item side is normalised the same way
 * below.
 */
function terms(query: string): string[] {
  return normalise(query)
    .split(/[\s\-_/]+/)
    .filter(Boolean)
}

/**
 * How well one item answers one query, or 0 for no match.
 *
 * The weights are ordered by how much a field means when it matches, not by
 * how often it does. A hit in the name is the user naming the thing; a hit
 * in the description is the thing merely mentioning the word, and there are
 * 973 effects whose descriptions mention "hover".
 *
 * EVERY TERM MUST MATCH SOMEWHERE. A two-word query that scores items
 * matching either word ranks 400 loosely-related effects above the one
 * block the user described, which is the failure mode that makes people
 * stop typing two words.
 */
function score(item: SearchableItem, queryTerms: string[]): number {
  const name = normalise(item.name)
  const nameWords = name.split(/[\s\-_]+/)
  const title = normalise(item.title ?? '')
  const description = normalise(item.description ?? '')
  const categories = normalise((item.categories ?? []).join(' '))

  let total = 0

  for (const term of queryTerms) {
    let best = 0

    if (name === term) best = 120
    else if (nameWords.includes(term)) best = 60
    else if (name.includes(term)) best = 40
    else if (title.includes(term)) best = 30
    else if (categories.includes(term)) best = 16
    else if (description.includes(term)) best = 8

    // One unmatched term disqualifies the item entirely.
    if (best === 0) return 0
    total += best
  }

  /*
   * A whole-phrase hit on the name outranks the same words found
   * separately: "agent thinking trace" should put `agent-thinking-trace`
   * first even though several other blocks contain all three words.
   */
  const phrase = queryTerms.join('-')
  if (queryTerms.length > 1 && name.includes(phrase)) total += 80

  // Shorter names win ties. `button` beats `button-group-toolbar-compact`
  // for the query "button", which is what a person means by it.
  return total * 1000 - Math.min(name.length, 999)
}

/* ------------------------------------------------------------------ *
 *  Search
 * ------------------------------------------------------------------ */

export interface RegistrySearchResult<T> {
  items: T[]
  pagination: RegistryPagination
}

/**
 * Filter, rank and page a registry index.
 *
 * Order without a query is the index's own order, which is meaningful here:
 * `buildRegistryIndex` puts the base first and the guided paths before the
 * parts, so a consumer paging through with no query sees the curated route
 * into the catalog rather than block number one of 210.
 */
export function searchRegistryItems<T extends SearchableItem>(
  items: readonly T[],
  params: RegistrySearchParams,
): RegistrySearchResult<T> {
  const wantedTypes = params.types.length > 0 ? new Set(params.types) : null

  let matched: T[] = wantedTypes ? items.filter((item) => wantedTypes.has(item.type)) : [...items]

  if (params.q) {
    const queryTerms = terms(params.q)
    matched = matched
      .map((item) => ({ item, score: score(item, queryTerms) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
  }

  const total = matched.length
  const page = matched.slice(params.offset, params.offset + params.limit)

  return {
    items: page,
    pagination: {
      total,
      offset: params.offset,
      limit: params.limit,
      hasMore: params.offset + page.length < total,
    },
  }
}
