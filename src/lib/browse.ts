/**
 * One search across all four rungs of the ladder.
 *
 * Everything above `effect` was, until this module, invisible to search:
 * ⌘K read `EFFECT_INDEX` and nothing else, so a catalog of 4,384 artifacts
 * was one-third searchable and the two-thirds that were hand-authored were
 * the missing part. This is the shared query layer behind `/browse` and the
 * palette, so a fix to the ranking lands in both.
 *
 * The four indexes are the *metadata* modules, not the catalogs. They carry
 * everything a result row shows — name, category, description, tags — and
 * none of the source text, which is what keeps this importable from a
 * client bundle. `EFFECT_INDEX` is still ~772 KB and the reason `/browse`
 * renders on the server and the palette loads it on first open rather than
 * at mount.
 *
 * Ranking is deliberate rather than fuzzy. The palette's subsequence
 * matcher is right for a keystroke-at-a-time overlay where "btgr" should
 * find "Button Gradient"; a browse page is closer to a search engine, where
 * someone typing "pricing" expects the pricing *block* first and every
 * accidental subsequence match last. So: exact name, then name prefix, then
 * name substring, then category, then tag, then description — with a small
 * bonus for featured and for the higher tiers, which are hand-authored and
 * far more likely to be what someone means by a section-shaped word.
 */

import { EFFECT_INDEX } from '@/lib/effect-index'
import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import {
  ARTIFACT_LEVELS,
  tierOf,
  type ArtifactLevel,
  type ArtifactTier,
} from '@/lib/artifact-types'

/** One result row, flattened to what every level can answer. */
export interface BrowseHit {
  id: string
  level: ArtifactLevel
  name: string
  category: string
  description: string
  tags: string[]
  featured: boolean
  tier: ArtifactTier
  href: string
}

/* ------------------------------------------------------------------ *
 *  The flattened catalog
 * ------------------------------------------------------------------ */

/**
 * Built once at module load, not per query.
 *
 * 4,384 objects is a real allocation, and rebuilding it on every keystroke
 * or every request would be the whole cost of this feature. The arrays it
 * reads are themselves module-level constants, so this is one pass at
 * import and nothing after.
 */
function flatten(): BrowseHit[] {
  const hits: BrowseHit[] = []

  for (const e of EFFECT_INDEX) {
    hits.push({
      id: e.id,
      level: 'effect',
      name: e.name,
      category: e.category,
      description: e.description,
      tags: e.tags ?? [],
      featured: Boolean(e.featured),
      tier: 'free',
      href: `/effect/${e.id}`,
    })
  }

  for (const b of BLOCK_INDEX) {
    hits.push({
      id: b.id,
      level: 'block',
      name: b.name,
      category: b.category,
      description: b.description,
      tags: b.tags,
      featured: Boolean(b.featured),
      tier: tierOf(b),
      href: `/block/${b.id}`,
    })
  }

  for (const p of PAGE_INDEX) {
    hits.push({
      id: p.id,
      level: 'page',
      name: p.name,
      category: p.category,
      description: p.description,
      tags: p.tags,
      featured: Boolean(p.featured),
      tier: tierOf(p),
      href: `/page/${p.id}`,
    })
  }

  for (const t of TEMPLATE_INDEX) {
    hits.push({
      id: t.id,
      level: 'template',
      name: t.name,
      category: t.category,
      description: t.description,
      tags: t.tags,
      featured: Boolean(t.featured),
      tier: tierOf(t),
      href: `/template/${t.id}`,
    })
  }

  return hits
}

export const BROWSE_INDEX: BrowseHit[] = flatten()

/** Totals per level, for the rail's counts. Computed once. */
export const LEVEL_TOTALS: Record<ArtifactLevel, number> = ARTIFACT_LEVELS.reduce(
  (acc, level) => {
    acc[level] = BROWSE_INDEX.filter((h) => h.level === level).length
    return acc
  },
  {} as Record<ArtifactLevel, number>,
)

export const BROWSE_TOTAL = BROWSE_INDEX.length

/* ------------------------------------------------------------------ *
 *  Ranking
 * ------------------------------------------------------------------ */

/**
 * Hand-authored tiers outrank generated ones at equal textual relevance.
 *
 * "pricing" matches a pricing block, a pricing page and ~30 effects whose
 * description happens to contain the word. The block and the page are what
 * the word means to someone browsing a component catalog.
 */
const LEVEL_BONUS: Record<ArtifactLevel, number> = {
  template: 12,
  page: 10,
  block: 8,
  effect: 0,
}

/**
 * Score one hit against a lowercased query, or 0 for no match.
 *
 * Fields are checked in descending authority and the best single field
 * wins, rather than summing — summing lets a description that repeats the
 * query three times outrank an exact name match, which is never right.
 */
function score(hit: BrowseHit, q: string): number {
  const name = hit.name.toLowerCase()

  let base = 0
  if (name === q) base = 100
  else if (name.startsWith(q)) base = 80
  else if (name.includes(q)) base = 60
  else if (hit.id.includes(q)) base = 55
  else if (hit.category.toLowerCase().includes(q)) base = 40
  else if (hit.tags.some((t) => t.toLowerCase().includes(q))) base = 30
  else if (hit.description.toLowerCase().includes(q)) base = 15
  else return 0

  return base + LEVEL_BONUS[hit.level] + (hit.featured ? 3 : 0)
}

export interface BrowseQuery {
  /** Free text. Empty or absent returns everything, featured first. */
  q?: string
  /** Restrict to one rung. Absent means all four. */
  level?: ArtifactLevel
  /** Restrict to one category name, within the chosen level. */
  category?: string
}

export interface BrowseResult {
  hits: BrowseHit[]
  /** Matches per level *before* the level filter — this drives the rail. */
  countsByLevel: Record<ArtifactLevel, number>
  total: number
}

/**
 * Run a query.
 *
 * `countsByLevel` deliberately ignores `level`: the rail has to be able to
 * say "Blocks (3)" while you are looking at Effects, which is the whole
 * reason a unified surface beats four separate ones. It does respect `q`
 * and `category`, because a count that ignores the query would send someone
 * to an empty tab.
 */
export function searchArtifacts({ q, level, category }: BrowseQuery): BrowseResult {
  const needle = q?.trim().toLowerCase() ?? ''

  const matched: Array<{ hit: BrowseHit; rank: number }> = []
  for (const hit of BROWSE_INDEX) {
    if (category && hit.category !== category) continue

    if (!needle) {
      // No query: everything, featured and higher tiers first.
      matched.push({ hit, rank: LEVEL_BONUS[hit.level] + (hit.featured ? 3 : 0) })
      continue
    }

    const s = score(hit, needle)
    if (s > 0) matched.push({ hit, rank: s })
  }

  const countsByLevel = ARTIFACT_LEVELS.reduce(
    (acc, l) => {
      acc[l] = 0
      return acc
    },
    {} as Record<ArtifactLevel, number>,
  )
  for (const { hit } of matched) countsByLevel[hit.level] += 1

  const filtered = level ? matched.filter((m) => m.hit.level === level) : matched

  // Stable within a rank: catalog order, which is curated. `sort` is not
  // guaranteed stable across engines for large arrays in older runtimes,
  // so ties fall back to the index the hit came in at.
  const ordered = filtered
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => b.rank - a.rank || a.i - b.i)
    .map((m) => m.hit)

  return { hits: ordered, countsByLevel, total: filtered.length }
}

/** Distinct categories present at a level, in first-seen (catalog) order. */
export function categoriesAtLevel(level: ArtifactLevel): string[] {
  const seen = new Set<string>()
  for (const hit of BROWSE_INDEX) {
    if (hit.level === level) seen.add(hit.category)
  }
  return [...seen]
}

/** Narrow an untrusted `?level=` value to a real one. */
export function parseLevel(value: string | undefined): ArtifactLevel | undefined {
  return ARTIFACT_LEVELS.find((l) => l === value)
}
