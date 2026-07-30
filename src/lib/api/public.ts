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
 * Design constraints:
 *  - Public and unauthenticated. The catalog is already fully indexed by
 *    search engines; gating it would only break the CLI.
 *  - CORS-open, so browser-based tools and playgrounds can call it.
 *  - Aggressively cacheable. Effects are immutable for a given id, so a
 *    detail response can sit in a CDN indefinitely.
 */

import { NextResponse } from 'next/server'
import type { Effect } from '@/lib/effects'

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

/** Metadata shape returned by list endpoints — no html/css payload. */
export interface EffectSummary {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
  featured: boolean
  url: string
}

export function toSummary(effect: Effect, siteOrigin: string): EffectSummary {
  return {
    id: effect.id,
    name: effect.name,
    category: effect.category,
    description: effect.description,
    tags: effect.tags ?? [],
    featured: effect.featured === true,
    url: `${siteOrigin}/effect/${effect.id}`,
  }
}

/**
 * Score one effect against one lowercased query token.
 *
 * The weights encode what a search for "teal glow button" should surface:
 * an exact id wins outright, a name match beats a description match, and a
 * tag match beats a category match because tags are more specific. Effects
 * matching every token rank above those matching only some, which is
 * handled by the caller requiring a non-zero score per token.
 */
function scoreToken(effect: Effect, token: string): number {
  const id = effect.id.toLowerCase()
  const name = effect.name.toLowerCase()
  const description = effect.description.toLowerCase()
  const category = effect.category.toLowerCase()
  const tags = (effect.tags ?? []).map((t) => t.toLowerCase())

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

export interface SearchResult {
  effects: Effect[]
  total: number
}

export function searchEffects(effects: Effect[], params: SearchParams): SearchResult {
  const query = (params.q ?? '').trim().toLowerCase()
  const tokens = query ? query.split(/\s+/).filter(Boolean) : []
  const category = params.category?.trim().toLowerCase()

  const candidates: Array<{ effect: Effect; score: number; index: number }> = []

  effects.forEach((effect, index) => {
    if (category && effect.category.toLowerCase() !== category) return
    if (params.featured && effect.featured !== true) return

    let score = 0
    if (tokens.length) {
      for (const token of tokens) {
        const tokenScore = scoreToken(effect, token)
        // Every token must match something — "teal button" should not
        // return every button in the catalog.
        if (tokenScore === 0) return
        score += tokenScore
      }
      // Featured effects are hand-written and consistently better; nudge
      // them up without letting the bonus override a real text match.
      if (effect.featured) score += 5
    }

    candidates.push({ effect, score, index })
  })

  // Stable: equal scores keep the catalog's curated order.
  candidates.sort((a, b) => (b.score - a.score) || (a.index - b.index))

  return {
    effects: candidates
      .slice(params.offset, params.offset + params.limit)
      .map((c) => c.effect),
    total: candidates.length,
  }
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
