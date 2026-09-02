import { siteUrl } from '@/lib/site'
import { API_VERSION, apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /api — what lives under this origin's API.
 *
 * This route shipped as the Next.js starter's `{ "message": "Hello, world!" }`
 * and stayed that way, which made the one URL somebody pokes at by hand
 * before reading any docs answer with nothing about this API at all. It now
 * points at the real surface: `/api/v1`, the public, unauthenticated,
 * CORS-open catalog the CLI and MCP server are built on.
 *
 * Deliberately a directory rather than a schema — the tier routes describe
 * their own parameters, and a second copy of that here is a second thing to
 * keep true.
 */

export const runtime = 'nodejs'

export async function GET() {
  const base = `${siteUrl.replace(/\/$/, '')}/api/${API_VERSION}`

  return apiJson(
    {
      name: 'Hoverlab API',
      version: API_VERSION,
      documentation: `${siteUrl.replace(/\/$/, '')}/docs/api`,
      /*
        Every public route under /api/v1, not just the four catalog tiers.

        This listed the tiers and stopped, which left `skills`, `dna`,
        `trending` and `revisions` reachable but undiscoverable: the one URL
        somebody pokes at by hand before reading any docs said they did not
        exist. They are the endpoints the agent rails are built on — the CLI
        and the MCP server call them — so they are precisely what the reader
        of this response is looking for.
      */
      endpoints: {
        artifacts: `${base}/artifacts/{id}`,
        effects: `${base}/effects`,
        blocks: `${base}/blocks`,
        pages: `${base}/pages`,
        templates: `${base}/templates`,
        skills: `${base}/skills`,
        dna: `${base}/dna/{id}`,
        trending: `${base}/trending`,
        revisions: `${base}/revisions`,
      },
      notes: [
        'Public and unauthenticated — no key required.',
        'Use /artifacts/{id} when you do not know which tier an id belongs to.',
        'skills returns agent skill documents; dna returns an artifact’s tokens, shape, motion and rules.',
        'revisions is what `npx hoverlab outdated` compares against; trending ranks by recorded copies and installs.',
      ],
    },
    { cache: LIST_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
