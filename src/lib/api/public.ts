/**
 * Shared plumbing for the public `/api/v1` surface.
 *
 * This API exists because the catalog's distribution story is no longer
 * "visit the website". `npx hoverlab add btn-gradient` and the MCP server
 * both need to search and fetch effects from outside the browser, and an
 * editor agent asking "which effects look like a pulsing teal button"
 * needs the same ranking the site uses. Rather than let three clients
 * grow three different notions of search, they all call these routes.
 *
 * The surface covers every rung of the ladder — `/effects`, `/blocks`,
 * `/pages`, `/templates` — plus `/artifacts/{id}`, which resolves an id
 * against all four so `hoverlab add <id>` does not have to know in advance
 * which tier the user meant.
 *
 * Design constraints:
 *  - Public and unauthenticated. The catalog is already fully indexed by
 *    search engines; gating it would only break the CLI.
 *  - CORS-open, so browser-based tools and playgrounds can call it.
 *  - Aggressively cacheable. Effects are immutable for a given id, so a
 *    detail response can sit in a CDN indefinitely.
 */

import { NextResponse } from 'next/server'
import type { Artifact, ArtifactLevel, ArtifactTier } from '@/lib/artifact-types'
import { artifactHref, levelOf, tierOf } from '@/lib/artifact-types'
import { updatedAt } from '@/lib/recency'
import REVISIONS from '@/lib/generated-artifact-revisions.json'

/** Fingerprints by level, for `revisionOf` below. */
const REVISIONS_BY_LEVEL: Record<ArtifactLevel, Record<string, string>> = {
  effect: REVISIONS.effects,
  block: REVISIONS.blocks,
  page: REVISIONS.pages,
  template: REVISIONS.templates,
}

export const API_VERSION = 'v1'

/**
 * Fully open CORS: every response here is public, read-only, static data.
 * There are no cookies or credentials involved, so `*` carries no risk.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

/** Search results shift as the catalog grows; cache briefly at the edge. */
export const LIST_CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

/** A given effect id always resolves to the same CSS — cache forever. */
export const DETAIL_CACHE = 'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400'

/**
 * Source for a block, page or template. Deliberately *not* `DETAIL_CACHE`.
 *
 * An effect id is immutable — the CSS was generated once and will never be
 * edited. A block is hand-written code that gets fixed: an accessibility
 * bug found in `data-table-sortable` should reach the next
 * `hoverlab add data-table-sortable`, not a year later. An hour at the edge
 * with a day of stale-while-revalidate keeps the route effectively free
 * without pinning a fixed bug in place.
 */
export const ARTIFACT_CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

export function apiJson(
  data: unknown,
  init: { status?: number; cache?: string } = {},
): NextResponse {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers: {
      ...CORS_HEADERS,
      ...(init.cache ? { 'Cache-Control': init.cache } : {}),
    },
  })
}

export function apiError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return apiJson({ error: message, ...extra }, { status })
}

/** Shared OPTIONS handler for the preflight request. */
export function apiPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/* ------------------------------------------------------------------ *
 *  Search
 * ------------------------------------------------------------------ */

export interface SearchParams {
  q?: string
  category?: string
  featured?: boolean
  limit: number
  offset: number
}

/**
 * The fields search and summarisation need.
 *
 * Every tier satisfies this — `Effect`, `BlockMeta`, `PageMeta` and
 * `TemplateMeta` all extend `Artifact` — which is the whole reason the
 * ladder was typed from a common base. One ranking function serves four
 * catalogs, so `hoverlab search checkout` cannot rank blocks by different
 * rules than the effect search the CLI was built around.
 */
export type SearchableArtifact = Pick<
  Artifact,
  'id' | 'name' | 'category' | 'description' | 'tags' | 'featured' | 'level' | 'tier'
>

/** Metadata shape returned by list endpoints — no source payload. */
export interface ArtifactSummary {
  id: string
  name: string
  level: ArtifactLevel
  category: string
  description: string
  tags: string[]
  featured: boolean
  tier: ArtifactTier
  url: string
  /**
   * Content fingerprint — what `npx hoverlab outdated` compares against.
   *
   * On the summary rather than only the detail response so a client can
   * record it from whatever call it already made, and so a lockfile written
   * after `add` never needs a second request. Twelve hex characters; see
   * `scripts/build-revisions.mts` for what is hashed and, more importantly,
   * what is not — metadata changes deliberately do not move it.
   */
  revision?: string
  /** ISO date this artifact last changed, where that is precisely known. */
  updated?: string
}

export function toSummary(artifact: SearchableArtifact, siteOrigin: string): ArtifactSummary {
  const level = levelOf(artifact)

  return {
    id: artifact.id,
    name: artifact.name,
    level,
    category: artifact.category,
    description: artifact.description,
    tags: artifact.tags ?? [],
    featured: artifact.featured === true,
    tier: tierOf(artifact),
    url: `${siteOrigin.replace(/\/$/, '')}${artifactHref(artifact)}`,
    ...revisionOf(level, artifact.id),
  }
}

/**
 * The revision and update date for one artifact, as spreadable fields.
 *
 * Omitted rather than nulled when unknown. A `revision` of null on the wire
 * invites a client to store null and then report the artifact as changed on
 * every check; an absent key makes the client's own `if (revision)` the
 * natural guard. `updated` follows the rule `recency.ts` already sets — no
 * entry means either "never changed" or "cannot be stated precisely", and
 * both render as nothing.
 */
function revisionOf(
  level: ArtifactLevel,
  id: string,
): { revision?: string; updated?: string } {
  const revision = REVISIONS_BY_LEVEL[level]?.[id]
  const updated = updatedAt(level, id)

  return {
    ...(revision ? { revision } : {}),
    ...(updated ? { updated } : {}),
  }
}

/**
 * Score one artifact against one lowercased query token.
 *
 * The weights encode what a search for "teal glow button" should surface:
 * an exact id wins outright, a name match beats a description match, and a
 * tag match beats a category match because tags are more specific. Artifacts
 * matching every token rank above those matching only some, which is
 * handled by the caller requiring a non-zero score per token.
 */
function scoreToken(artifact: SearchableArtifact, token: string): number {
  const id = artifact.id.toLowerCase()
  const name = artifact.name.toLowerCase()
  const description = artifact.description.toLowerCase()
  const category = artifact.category.toLowerCase()
  const tags = (artifact.tags ?? []).map((t) => t.toLowerCase())

  if (id === token) return 1000
  let score = 0
  if (id.includes(token)) score += 40
  if (name === token) score += 80
  else if (name.startsWith(token)) score += 50
  else if (name.includes(token)) score += 30
  if (tags.includes(token)) score += 25
  else if (tags.some((t) => t.includes(token))) score += 12
  if (category.includes(token)) score += 10
  if (description.includes(token)) score += 8
  return score
}

export interface SearchResult<T> {
  items: T[]
  total: number
}

export function searchArtifacts<T extends SearchableArtifact>(
  artifacts: readonly T[],
  params: SearchParams,
): SearchResult<T> {
  const query = (params.q ?? '').trim().toLowerCase()
  const tokens = query ? query.split(/\s+/).filter(Boolean) : []
  const category = params.category?.trim().toLowerCase()

  const candidates: Array<{ artifact: T; score: number; index: number }> = []

  artifacts.forEach((artifact, index) => {
    if (category && artifact.category.toLowerCase() !== category) return
    if (params.featured && artifact.featured !== true) return

    let score = 0
    if (tokens.length) {
      for (const token of tokens) {
        const tokenScore = scoreToken(artifact, token)
        // Every token must match something — "teal button" should not
        // return every button in the catalog.
        if (tokenScore === 0) return
        score += tokenScore
      }
      // Featured artifacts are hand-written and consistently better; nudge
      // them up without letting the bonus override a real text match.
      if (artifact.featured) score += 5
    }

    candidates.push({ artifact, score, index })
  })

  // Stable: equal scores keep the catalog's curated order.
  candidates.sort((a, b) => (b.score - a.score) || (a.index - b.index))

  return {
    items: candidates
      .slice(params.offset, params.offset + params.limit)
      .map((c) => c.artifact),
    total: candidates.length,
  }
}

/**
 * The whole body of a list endpoint: validate, paginate, search, summarise.
 *
 * `/blocks`, `/pages` and `/templates` are the same route three times over
 * — the only differences are which catalog they read, which category
 * vocabulary they validate against, and the handful of per-tier fields
 * worth carrying on a summary. Sharing the body means a fix to pagination
 * or to the unknown-category error lands on all of them at once.
 *
 * Effects keep their own handler: the response predates this and names its
 * array `effects`, and the CLI in the wild reads that key.
 */
export function artifactListResponse<T extends SearchableArtifact>(options: {
  url: URL
  items: readonly T[]
  categories: readonly string[]
  siteOrigin: string
  /** Response key for the result array — `"blocks"`, `"pages"`, … */
  key: string
  /** Per-tier fields to carry alongside the shared summary. */
  extend?: (item: T) => Record<string, unknown>
}): NextResponse {
  const { url, items, categories, siteOrigin, key, extend } = options
  const { limit, offset } = readPagination(url, { limit: 20, maxLimit: 100 })

  const category = url.searchParams.get('category') ?? undefined
  if (category && !categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    return apiError(`Unknown category: ${category}`, 400, { categories })
  }

  const { items: matched, total } = searchArtifacts(items, {
    q: url.searchParams.get('q') ?? undefined,
    category,
    featured: url.searchParams.get('featured') === 'true',
    limit,
    offset,
  })

  return apiJson(
    {
      version: API_VERSION,
      total,
      limit,
      offset,
      categories,
      [key]: matched.map((item) => ({
        ...toSummary(item, siteOrigin),
        ...(extend ? extend(item) : {}),
      })),
    },
    { cache: LIST_CACHE },
  )
}

/** Parse and clamp `limit` / `offset` from a URL. */
export function readPagination(
  url: URL,
  defaults: { limit: number; maxLimit: number },
): { limit: number; offset: number } {
  const rawLimit = Number.parseInt(url.searchParams.get('limit') ?? '', 10)
  const rawOffset = Number.parseInt(url.searchParams.get('offset') ?? '', 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), defaults.maxLimit)
    : defaults.limit
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0
  return { limit, offset }
}
