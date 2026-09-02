import REVISIONS from '@/lib/generated-artifact-revisions.json'
import { apiError, apiJson, API_VERSION, LIST_CACHE } from '@/lib/api/public'
import { updatedAt } from '@/lib/recency'
import type { ArtifactLevel } from '@/lib/artifact-types'

/**
 * GET /api/v1/revisions — the content fingerprint of every artifact.
 *
 * WHAT IT IS FOR. `npx hoverlab outdated`. The CLI writes source into
 * somebody else's repo and then has no relationship with it; this is the one
 * endpoint that lets an installed copy find out a newer one exists. Pro
 * sells a twelve-month update window and this is the machinery that makes it
 * a delivery mechanism rather than a sentence on a pricing page.
 *
 * WHY THE WHOLE FILE BY DEFAULT. About 40 KB for ~1,200 artifacts, cached
 * hard, and it means the client needs no query construction and leaks
 * nothing: a lockfile with forty ids in it does not have to tell us which
 * forty. A caller that would rather narrow can pass `level` or `ids`, but
 * the privacy-preserving path is the default one.
 *
 * `updated` is included per id where the catalog can state it precisely, so
 * a CLI can say "changed on 12 August" rather than only "changed".
 *
 * Public and unauthenticated, like the rest of `/api/v1` — see
 * `lib/api/public.ts` for why that is a standing decision rather than an
 * oversight.
 */

export const runtime = 'nodejs'

const LEVELS = ['effect', 'block', 'page', 'template'] as const

const BY_LEVEL: Record<ArtifactLevel, Record<string, string>> = {
  effect: REVISIONS.effects,
  block: REVISIONS.blocks,
  page: REVISIONS.pages,
  template: REVISIONS.templates,
}

function isLevel(value: string): value is ArtifactLevel {
  return (LEVELS as readonly string[]).includes(value)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const levelParam = url.searchParams.get('level')
  const idsParam = url.searchParams.get('ids')

  if (levelParam && !isLevel(levelParam)) {
    return apiError(
      `Unknown level "${levelParam}". One of: ${LEVELS.join(', ')}.`,
      400,
    )
  }

  const levels = levelParam ? [levelParam as ArtifactLevel] : [...LEVELS]

  /*
   * `ids` accepts either a bare id or `level:id`.
   *
   * Bare ids are matched across every level because a caller holding a
   * lockfile written by an older CLI may not have recorded the level, and
   * ids are unique across the catalog anyway — `check-duplicate-ids.mts`
   * enforces that.
   */
  const wanted = idsParam
    ? new Set(
        idsParam
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => (value.includes(':') ? value.split(':')[1] : value)),
      )
    : null

  const artifacts: Record<
    string,
    { level: ArtifactLevel; revision: string; updated?: string }
  > = {}

  for (const level of levels) {
    for (const [id, revision] of Object.entries(BY_LEVEL[level])) {
      if (wanted && !wanted.has(id)) continue
      const changed = updatedAt(level, id)
      artifacts[id] = changed
        ? { level, revision, updated: changed }
        : { level, revision }
    }
  }

  return apiJson(
    {
      version: API_VERSION,
      generatedAt: REVISIONS.generatedAt,
      count: Object.keys(artifacts).length,
      artifacts,
    },
    { cache: LIST_CACHE },
  )
}
