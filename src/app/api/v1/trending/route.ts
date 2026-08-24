import { topUsage } from '@/lib/usage'
import { resolveArtifact } from '@/lib/api/artifacts'
import { levelOf, artifactHref, type ArtifactLevel } from '@/lib/artifact-types'
import { siteUrl } from '@/lib/site'
import { apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /api/v1/trending — what people actually took this week.
 *
 * Query params:
 *   level   effect | block | page | template — restrict to one rung
 *   limit   1-50, default 12
 *
 * Ranked by copies and installs over the last seven days, not by views.
 * Views measure search ranking; a catalog sorted by them promotes whatever
 * already ranks, which is the opposite of a recommendation.
 *
 * An empty list is a normal answer, not an error: nothing has been used yet
 * on a fresh deployment, and a fabricated ranking would be worse than none.
 */

export const runtime = 'nodejs'

const LEVELS: ArtifactLevel[] = ['effect', 'block', 'page', 'template']

function parseLevel(value: string | null): ArtifactLevel | null {
  return LEVELS.includes(value as ArtifactLevel) ? (value as ArtifactLevel) : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const level = parseLevel(url.searchParams.get('level'))
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 12, 1), 50)
  const origin = siteUrl.replace(/\/$/, '')

  // Over-fetch when filtering by level: the counters do not know which rung
  // an id belongs to, so the filter happens after resolution and would
  // otherwise return four blocks out of a twelve-row query.
  const counts = await topUsage(level ? limit * 6 : limit)

  const items = counts
    .map((count) => {
      // An id in the counters that no longer resolves is a retired artifact.
      // Dropped rather than rendered, so a renamed effect cannot leave a
      // dead link at the top of the trending list.
      const resolved = resolveArtifact(count.id)
      if (!resolved) return null

      const artifact = resolved.level === 'effect' ? resolved.effect : resolved.artifact
      const itemLevel = levelOf(artifact)
      if (level && itemLevel !== level) return null

      return {
        id: count.id,
        name: artifact.name,
        level: itemLevel,
        category: artifact.category,
        description: artifact.description,
        uses: count.recent,
        total: count.total,
        url: `${origin}${artifactHref(artifact)}`,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, limit)

  return apiJson(
    { items, total: items.length, window: '7d' },
    // Short: this is the one list on the site that is supposed to move.
    { cache: LIST_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
