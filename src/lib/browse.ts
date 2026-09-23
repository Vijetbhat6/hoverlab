/**
 * One search across every rung of the ladder.
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
 * Ranking is the shared engine in `@/lib/search/engine`: tokenised, weighted
 * by field (name over tags and category over description), tolerant of a
 * typo or two and expanded through a short curated synonym table. This
 * module's own contribution is the small bonus for featured and for the
 * higher tiers, which are hand-authored and far more likely to be what
 * someone means by a section-shaped word — someone typing "pricing" wants
 * the pricing *block* before the thirty effects whose description mentions
 * it. (This header used to say ranking here was deliberately *not* fuzzy.
 * That was true of substrings and it is why "buton" found nothing; the
 * false-positive risk it was guarding against is handled inside the engine
 * by never "correcting" a word that exists in the catalog.)
 */

import { EFFECT_INDEX } from '@/lib/effect-index'
import { PRIMITIVE_INDEX } from '@/lib/primitives/primitive-index'
import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import {
  createSearchIndex,
  search,
  type SearchDoc,
  type SearchHit,
  type SearchIndex,
  type SearchOptions,
} from '@/lib/search/engine'
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

  for (const p of PRIMITIVE_INDEX) {
    hits.push({
      id: p.id,
      level: 'primitive',
      name: p.name,
      category: p.category,
      description: p.description,
      tags: p.tags,
      featured: Boolean(p.featured),
      tier: tierOf(p),
      href: `/primitive/${p.id}`,
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
 *
 * On the engine's scale (a name-word match is worth ~4-10) these are
 * tiebreaks, not overrides. The previous scorer's numbers (12/10/8/4) were
 * sized against base scores of 15-100 and would have swamped the engine's;
 * they are the same ordering at a quarter of the size.
 */
const LEVEL_BONUS: Record<ArtifactLevel, number> = {
  template: 3,
  page: 2.5,
  block: 2,
  /*
   * Above effects and below blocks. A search for "button" should reach the
   * primitive before it reaches four hundred button effects, and a search
   * for "pricing" should still reach the pricing block first — a primitive
   * is hand-authored like a block, but it answers a smaller question.
   */
  primitive: 1,
  effect: 0,
}

/** Featured breaks ties inside a level. */
const FEATURED_BONUS = 0.75

/**
 * The searchable form of `BROWSE_INDEX`, built on the first query.
 *
 * The level's own name goes in as a tag, so "footer block" finds the footer
 * blocks rather than every effect mentioning a footer — which is what the
 * palette's old `keywords` string did by hand. Position `i` here is position
 * `i` in `BROWSE_INDEX`, and `SearchHit.index` is how a caller gets back to
 * it.
 */
let catalogIndex: SearchIndex<BrowseHit & SearchDoc> | null = null

function getCatalogIndex(): SearchIndex<BrowseHit & SearchDoc> {
  catalogIndex ??= createSearchIndex(
    BROWSE_INDEX.map((h) => ({
      ...h,
      tags: [...h.tags, h.level],
      boost: LEVEL_BONUS[h.level] + (h.featured ? FEATURED_BONUS : 0),
    })),
  )
  return catalogIndex
}

/**
 * Rank the whole catalog against free text.
 *
 * Shared by `/browse` and the command palette, which used to rank
 * differently on purpose (see the header). The palette keeps its own
 * subsequence matcher for actions, tools and categories — a few dozen short
 * labels, where "btgr" abbreviations are the point — but artifacts go
 * through this, so a typo lands on the same result in both places.
 */
export function searchCatalog(
  q: string,
  options?: SearchOptions<BrowseHit & SearchDoc>,
): SearchHit<BrowseHit & SearchDoc>[] {
  return search(getCatalogIndex(), q, options)
}

export interface BrowseQuery {
  /** Free text. Empty or absent returns everything, featured first. */
  q?: string
  /** Restrict to one rung. Absent means all five. */
  level?: ArtifactLevel
  /** Restrict to one category name, within the chosen level. */
  category?: string
  /**
   * Any further narrowing — framework, accessibility, colour. A predicate
   * rather than three more parameters, so the facet definitions can live
   * beside their data (`@/lib/search/facets`) without this module importing
   * the accessibility report or the colour table, which are server-only and
   * would otherwise ride along into the palette's chunk.
   */
  facet?: (hit: BrowseHit) => boolean
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
 * reason a unified surface beats four separate ones. It does respect `q`,
 * `category` and the facets, because a count that ignores the query would
 * send someone to an empty tab.
 */
export function searchArtifacts({ q, level, category, facet }: BrowseQuery): BrowseResult {
  const needle = q?.trim() ?? ''

  const matched: BrowseHit[] = []
  if (needle) {
    // The engine returns its own ranked order; nothing below re-sorts it.
    for (const { index } of searchCatalog(needle)) {
      const hit = BROWSE_INDEX[index]!
      if (category && hit.category !== category) continue
      if (facet && !facet(hit)) continue
      matched.push(hit)
    }
  } else {
    // No query: everything, featured and higher tiers first, then catalog
    // order — which is curated, and which a stable sort preserves.
    const ranked: Array<{ hit: BrowseHit; rank: number; i: number }> = []
    BROWSE_INDEX.forEach((hit, i) => {
      if (category && hit.category !== category) return
      if (facet && !facet(hit)) return
      ranked.push({ hit, rank: LEVEL_BONUS[hit.level] + (hit.featured ? FEATURED_BONUS : 0), i })
    })
    ranked.sort((a, b) => b.rank - a.rank || a.i - b.i)
    for (const r of ranked) matched.push(r.hit)
  }

  const countsByLevel = ARTIFACT_LEVELS.reduce(
    (acc, l) => {
      acc[l] = 0
      return acc
    },
    {} as Record<ArtifactLevel, number>,
  )
  for (const hit of matched) countsByLevel[hit.level] += 1

  const filtered = level ? matched.filter((h) => h.level === level) : matched
  return { hits: filtered, countsByLevel, total: filtered.length }
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
