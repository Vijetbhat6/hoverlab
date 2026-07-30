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
