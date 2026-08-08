/**
 * Thin client for the Hoverlab public API (`/api/v1`).
 *
 * Kept deliberately small and dependency-free — `fetch` has been global
 * since Node 18, which is also the floor for the CLI.
 */

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

async function request(path, { origin = DEFAULT_ORIGIN, signal } = {}) {
  const url = `${origin.replace(/\/$/, '')}${path}`

  let response
  try {
    response = await fetch(url, {
      signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'hoverlab-cli',
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
