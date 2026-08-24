/**
 * Thin client for the Hoverlab public API (`/api/v1`).
 *
 * Kept deliberately small and dependency-free — `fetch` has been global
 * since Node 18, which is also the floor for the CLI.
 */

import { resolveKey } from './auth.mjs'

export const DEFAULT_ORIGIN = process.env.HOVERLAB_API_URL || 'https://hoverlab.dev'

export const FRAMEWORKS = [
  'html',
  'css',
  'react',
  'vue',
  'svelte',
  'styled-components',
  'tailwind',
]

/**
 * Rungs of the catalog ladder, atom → assembly.
 *
 * Mirrors `ArtifactLevel` on the site. Every level has the same two
 * endpoints — `/api/v1/{level}s` to search and `/api/v1/{level}s/{id}` to
 * fetch — which is what lets one client serve all four.
 */
export const LEVELS = ['effect', 'block', 'page', 'template']

/** Response key each list endpoint uses for its results array. */
const LIST_KEY = {
  effect: 'effects',
  block: 'blocks',
  page: 'pages',
  template: 'templates',
}

/** `"block"` → `"blocks"`, for building a URL path. */
function pathFor(level) {
  if (!LEVELS.includes(level)) {
    throw new Error(`Unknown level "${level}". Pick one of: ${LEVELS.join(', ')}.`)
  }
  return `${level}s`
}

class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export { ApiError }

/**
 * Raised when the catalog answered, but withheld the source.
 *
 * A distinct error rather than an ApiError with a 402, because the
 * response is a 200: the artifact exists, its description is right there,
 * and only the file bodies are missing. Callers that treat "no files" as a
 * transport failure would tell the user to check their connection, which
 * is the wrong instruction entirely.
 */
export class LicenseError extends Error {
  constructor(message, { id, url, hint } = {}) {
    super(message)
    this.name = 'LicenseError'
    this.id = id
    this.url = url
    this.hint = hint
  }
}

/**
 * Throw if a detail payload came back locked.
 *
 * Called by every path that is about to write files. Centralised so a new
 * command cannot forget it and silently scaffold an empty directory.
 */
export function assertUnlocked(payload) {
  if (!payload?.locked) return payload
  throw new LicenseError(
    payload.license?.message ?? 'That artifact needs a licence.',
    {
      id: payload.artifact?.id,
      url: payload.license?.url,
      hint: payload.license?.hint,
    },
  )
}

async function request(path, { origin = DEFAULT_ORIGIN, signal } = {}) {
  const url = `${origin.replace(/\/$/, '')}${path}`

  /*
   * The key is attached to every request, not only the ones that need it.
   *
   * Almost nothing here is gated — effects, blocks, pages and the free
   * template answer identically with or without it — so the alternative is
   * a per-endpoint list of which calls carry credentials, which drifts the
   * first time a route changes. Sending it always costs one header and
   * means a licensed user never sees "this needs a licence" while holding
   * one. Callers with no key send no header at all.
   */
  const key = await resolveKey()

  let response
  try {
    response = await fetch(url, {
      signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'hoverlab-cli',
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
    })
  } catch (cause) {
    // Network-level failure: no DNS, offline, TLS. Worth distinguishing
    // from a 4xx, because the fix is completely different.
    throw new ApiError(
      `Could not reach ${origin}. Check your connection, or set HOVERLAB_API_URL to point somewhere else.`,
      { status: 0 },
    )
  }

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError(
      `${url} returned ${response.status} but the body was not JSON. Is HOVERLAB_API_URL pointing at a Hoverlab deployment?`,
      { status: response.status },
    )
  }

  if (!response.ok) {
    throw new ApiError(body?.error || `Request failed with status ${response.status}`, {
      status: response.status,
      body,
    })
  }

  return body
}

/**
 * Search the catalog. Returns `{ total, effects, categories }` where each
 * effect is metadata only.
 */
export async function searchEffects(
  { query, category, featured, limit = 20, offset = 0 } = {},
  options = {},
) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  if (featured) params.set('featured', 'true')
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return request(`/api/v1/effects?${params}`, options)
}

/**
 * Search one rung of the ladder.
 *
 * Normalises the per-level response key to `items`, so callers iterate one
 * shape whichever level they asked for. The raw key stays what it is on the
 * wire — `effects`, `blocks` — because that half of the contract is public
 * and older CLIs read it.
 */
export async function searchLevel(
  { level = 'effect', query, category, featured, limit = 20, offset = 0 } = {},
  options = {},
) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  if (featured) params.set('featured', 'true')
  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const body = await request(`/api/v1/${pathFor(level)}?${params}`, options)
  return {
    level,
    total: body.total ?? 0,
    categories: body.categories ?? [],
    items: body[LIST_KEY[level]] ?? [],
  }
}

/**
 * Search every rung at once, in parallel.
 *
 * The default for `hoverlab search`, and the reason is the catalog's own
 * shape: someone typing "checkout" may want the button hover, the checkout
 * form block, the checkout page or the storefront template, and which one
 * they meant is not knowable from the query. Four small concurrent requests
 * cost about as much as one, and all four are edge-cached.
 *
 * A level that fails is dropped rather than failing the search — one
 * endpoint being down should not stop the other three answering.
 */
export async function searchAll(params = {}, options = {}) {
  const results = await Promise.all(
    LEVELS.map((level) =>
      searchLevel({ ...params, level }, options).catch((error) => ({
        level,
        total: 0,
        categories: [],
        items: [],
        error,
      })),
    ),
  )

  return {
    results,
    total: results.reduce((sum, r) => sum + r.total, 0),
    // Surfaced only when *nothing* came back, so a total outage reads as an
    // outage rather than as an empty catalog.
    errors: results.filter((r) => r.error).map((r) => r.error),
  }
}

/**
 * Fetch one effect, already rendered into `framework`.
 * `customization` mirrors the site's sliders: { hue, sat, scale, speed }.
 */
export async function getEffect(
  id,
  { framework = 'css', customization = {} } = {},
  options = {},
) {
  const params = new URLSearchParams({ framework })
  for (const [key, value] of Object.entries(customization)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  return request(`/api/v1/effects/${encodeURIComponent(id)}?${params}`, options)
}

/**
 * Fetch any artifact by id, whichever rung it sits on.
 *
 * One request, because the user typed an id they saw on the site and does
 * not know or care which tier it belongs to. The response is a union
 * discriminated by `level`; `framework` and `customization` apply to
 * effects and are ignored above them.
 *
 * `deep` asks a page to bring the blocks it imports. Without it a page
 * installs as one file of imports pointing at components that are not
 * there.
 */
export async function getArtifact(
  id,
  { framework, customization = {}, deep = false } = {},
  options = {},
) {
  const params = new URLSearchParams()
  if (framework) params.set('framework', framework)
  for (const [key, value] of Object.entries(customization)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  if (deep) params.set('deep', 'true')

  const query = params.toString()
  return request(`/api/v1/artifacts/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, options)
}

/** Fetch one template — every file of the project it generates. */
export async function getTemplate(id, options = {}) {
  return request(`/api/v1/templates/${encodeURIComponent(id)}`, options)
}

/* ------------------------------------------------------------------ *
 *  Skills
 * ------------------------------------------------------------------ */

/**
 * List the published agent skills.
 *
 * Fetched rather than bundled with this package, for the same reason the
 * catalog is: a skill teaches an agent what the catalog can do, and a copy
 * frozen at install time would teach it last quarter's answer.
 */
export async function listSkills(options = {}) {
  const body = await request('/api/v1/skills', options)
  return body.skills ?? []
}

/** One skill, including the markdown to write to disk. */
export async function getSkill(id, options = {}) {
  return request(`/api/v1/skills/${encodeURIComponent(id)}`, options)
}

/* ------------------------------------------------------------------ *
 *  Design DNA
 * ------------------------------------------------------------------ */

/**
 * Fetch the Design DNA document for an id (or the literal `catalog`).
 *
 * Returns the JSON envelope rather than the raw markdown, because the CLI
 * wants the title and the token data alongside the file it writes.
 */
export async function getDna(id = 'catalog', { brand } = {}, options = {}) {
  const params = new URLSearchParams()
  if (brand) params.set('brand', brand)
  const query = params.toString()
  return request(`/api/v1/dna/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, options)
}

/* ------------------------------------------------------------------ *
 *  Usage reporting
 * ------------------------------------------------------------------ */

/**
 * Tell the catalog an artifact was installed, so the Trending list means
 * something.
 *
 * Deliberately silent and never awaited by callers on the critical path:
 * an install that already wrote files to disk has succeeded, and a counter
 * that could turn that into a visible error would be a worse trade than
 * undercounting. Set HOVERLAB_NO_TELEMETRY=1 to switch it off — it sends
 * only the artifact ids, but somebody's proxy logs are their business.
 */
export async function reportInstall(ids, { origin = DEFAULT_ORIGIN } = {}) {
  if (process.env.HOVERLAB_NO_TELEMETRY) return
  const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean)
  if (!list.length) return

  try {
    await fetch(`${origin.replace(/\/$/, '')}/api/usage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'hoverlab-cli' },
      body: JSON.stringify({ ids: list, kind: 'install' }),
      signal: AbortSignal.timeout(2500),
    })
  } catch {
    /* offline, blocked, slow — none of it matters to the install */
  }
}
