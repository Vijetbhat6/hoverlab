/**
 * Running an intent hub's saved query against the catalog.
 *
 * `hubs/catalog.ts` is declarative and data-only; this is the half that
 * touches `BROWSE_INDEX`. Keeping them apart is what lets
 * `scripts/check-hubs.mts` import the catalog, run the same resolver the
 * page uses, and fail the build on a hub that has gone thin — the check and
 * the page cannot disagree about what a hub contains, because they call the
 * same function.
 *
 * Everything here is pure and memoized at module scope. A full prerender
 * asks for all 80 hubs plus the index page, and each hub's related list is
 * derived from every other hub's result set; without the caches that is a
 * few million comparisons per build for data that never changes within one.
 */

import { BROWSE_INDEX, type BrowseHit } from '@/lib/browse'
import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'
import { HUBS, HUB_GROUPS, getHub, type HubFilter, type IntentHub } from '@/lib/hubs/catalog'

/* ------------------------------------------------------------------ *
 *  Matching
 * ------------------------------------------------------------------ */

/**
 * The searchable text of each hit, lowercased once.
 *
 * Parallel to `BROWSE_INDEX` rather than a Map: the index is a frozen
 * module-level array, so position is a stable key and an array lookup beats
 * hashing a hit object ~1,600 times per filter.
 */
const HAYSTACK: string[] = BROWSE_INDEX.map((hit) =>
  `${hit.name} ${hit.id} ${hit.category} ${hit.description} ${hit.tags.join(' ')}`.toLowerCase(),
)

/** Lowercased categories, likewise precomputed. */
const CATEGORY_LC: string[] = BROWSE_INDEX.map((hit) => hit.category.toLowerCase())

/** Lowercased tag sets, likewise. */
const TAGS_LC: string[][] = BROWSE_INDEX.map((hit) => hit.tags.map((t) => t.toLowerCase()))

/**
 * Score one indexed hit against a filter. Zero means "not a match".
 *
 * Axes are ANDed and values within an axis are ORed — see `HubFilter`. The
 * score exists so the grid opens on the artifacts the phrase most obviously
 * names: a "gradient buttons" hub should lead with something called
 * "Gradient Button", not with a button whose description happens to end in
 * "…over a gradient".
 */
function scoreAt(i: number, filter: HubFilter): number {
  const hit = BROWSE_INDEX[i]
  const hay = HAYSTACK[i]

  if (filter.levels && !filter.levels.includes(hit.level)) return 0

  if (filter.categories) {
    const wanted = filter.categories.some((c) => c.toLowerCase() === CATEGORY_LC[i])
    if (!wanted) return 0
  }

  if (filter.tags) {
    const wanted = filter.tags.some((t) => TAGS_LC[i].includes(t.toLowerCase()))
    if (!wanted) return 0
  }

  // Applied last and unconditionally: an exclusion outranks every reason a
  // hit had to be here.
  if (filter.exclude?.some((term) => hay.includes(term.toLowerCase()))) return 0

  let score = 10

  if (filter.match) {
    const name = hit.name.toLowerCase()
    let best = 0
    for (const raw of filter.match) {
      const term = raw.toLowerCase()
      if (name.includes(term)) best = Math.max(best, 60)
      else if (hit.id.includes(term)) best = Math.max(best, 50)
      else if (TAGS_LC[i].includes(term)) best = Math.max(best, 40)
      else if (CATEGORY_LC[i].includes(term)) best = Math.max(best, 30)
      else if (hay.includes(term)) best = Math.max(best, 15)
    }
    if (best === 0) return 0
    score = best
  }

  // Hand-authored artifacts are the better first impression at equal
  // relevance, and `featured` is the flag that marks them.
  return score + (hit.featured ? 5 : 0)
}

/** Every hit a filter reaches, best first. Exported for the check script. */
export function runFilter(filter: HubFilter): BrowseHit[] {
  const scored: Array<{ i: number; score: number }> = []
  for (let i = 0; i < BROWSE_INDEX.length; i++) {
    const score = scoreAt(i, filter)
    if (score > 0) scored.push({ i, score })
  }
  // Catalog order breaks ties — it is curated, and `sort` stability is not
  // guaranteed across engines for arrays this size.
  scored.sort((a, b) => b.score - a.score || a.i - b.i)
  return scored.map((s) => BROWSE_INDEX[s.i])
}

/* ------------------------------------------------------------------ *
 *  Resolution
 * ------------------------------------------------------------------ */

/** How many of the lead level's matches the main grid shows. */
export const LEAD_LIMIT = 24

/** How many of each other level's matches appear in the rails below it. */
export const RAIL_LIMIT = 6

export interface HubGroup {
  level: ArtifactLevel
  /** Capped for display. */
  items: BrowseHit[]
  /** The uncapped count at this level. */
  total: number
}

export interface ResolvedHub {
  hub: IntentHub
  /** The lead level first, then every other level that matched. */
  groups: HubGroup[]
  /** Uncapped total across every level. */
  total: number
  countsByLevel: Record<ArtifactLevel, number>
  /** Every match, uncapped — the check script counts these. */
  all: BrowseHit[]
}

const RESOLVED = new Map<string, ResolvedHub>()

/**
 * Run a hub's filter and bucket the results for rendering.
 *
 * The lead level goes first and gets the big grid even when another level
 * matched more — see the note on `IntentHub.lead`. Everything else follows
 * in ladder order, assembly-first, which is the order `/browse` settled on
 * for the same reason: a search for "pricing" means the section before it
 * means forty pricing-coloured buttons.
 */
export function resolveHub(hub: IntentHub): ResolvedHub {
  const cached = RESOLVED.get(hub.slug)
  if (cached) return cached

  const all = runFilter(hub.filter)

  const countsByLevel = ARTIFACT_LEVELS.reduce(
    (acc, level) => {
      acc[level] = 0
      return acc
    },
    {} as Record<ArtifactLevel, number>,
  )
  for (const hit of all) countsByLevel[hit.level] += 1

  const order: ArtifactLevel[] = [
    hub.lead,
    ...[...ARTIFACT_LEVELS].reverse().filter((l) => l !== hub.lead),
  ]

  const groups: HubGroup[] = order
    .filter((level) => countsByLevel[level] > 0)
    .map((level) => ({
      level,
      items: all
        .filter((hit) => hit.level === level)
        .slice(0, level === hub.lead ? LEAD_LIMIT : RAIL_LIMIT),
      total: countsByLevel[level],
    }))

  const resolved: ResolvedHub = { hub, groups, total: all.length, countsByLevel, all }
  RESOLVED.set(hub.slug, resolved)
  return resolved
}

/** Resolve by slug, or undefined when there is no such hub. */
export function resolveHubSlug(slug: string): ResolvedHub | undefined {
  const hub = getHub(slug)
  return hub ? resolveHub(hub) : undefined
}

/* ------------------------------------------------------------------ *
 *  Cross-links
 * ------------------------------------------------------------------ */

/**
 * Keys of everything a hub matched, for overlap comparisons.
 *
 * `level:id` rather than `id`: ids are only unique within a level, and a
 * block and an effect can legitimately share one.
 */
const KEYS = new Map<string, Set<string>>()

function keysFor(hub: IntentHub): Set<string> {
  let keys = KEYS.get(hub.slug)
  if (!keys) {
    keys = new Set(resolveHub(hub).all.map((hit) => `${hit.level}:${hit.id}`))
    KEYS.set(hub.slug, keys)
  }
  return keys
}

/**
 * How much two hubs overlap, as a share of the smaller one.
 *
 * Deliberately not Jaccard. "Flip cards" is a small subset of "3D card
 * effects", and Jaccard scores that pair low precisely because one side is
 * large — which is backwards for a related-links rail, where "almost
 * everything on this page is also on that one" is the strongest possible
 * reason to link. The duplicate gate in `check-hubs` deliberately uses
 * Jaccard instead, for the same reason: a subset is a link, not a copy.
 */
export function overlap(a: IntentHub, b: IntentHub): number {
  const ka = keysFor(a)
  const kb = keysFor(b)
  const smaller = ka.size <= kb.size ? ka : kb
  const larger = ka.size <= kb.size ? kb : ka
  if (smaller.size === 0) return 0
  let shared = 0
  for (const key of smaller) if (larger.has(key)) shared += 1
  return shared / smaller.size
}

const RELATED = new Map<string, IntentHub[]>()

/**
 * Hubs worth linking from this one: the hand-picked ones first, then
 * whatever else genuinely overlaps.
 *
 * Hand-picked entries lead because an editor's reason for a link ("people
 * looking at flip cards want 3D transforms") beats a measured one, and
 * because they are the links that survive a catalog change. The derived
 * tail exists so a new hub is reachable from its neighbours without anyone
 * editing seventy `related` arrays — the cross-links stay dense as the set
 * grows, which is the entire point of publishing a network of these rather
 * than a list.
 */
export function relatedHubs(hub: IntentHub, limit = 6): IntentHub[] {
  const cached = RELATED.get(hub.slug)
  if (cached) return cached.slice(0, limit)

  const picked: IntentHub[] = []
  const seen = new Set<string>([hub.slug])

  for (const slug of hub.related ?? []) {
    const sibling = getHub(slug)
    // A bad slug is a build failure in `check-hubs`, not a runtime throw —
    // a typo in an editorial link should not take a page down.
    if (sibling && !seen.has(sibling.slug)) {
      picked.push(sibling)
      seen.add(sibling.slug)
    }
  }

  const byOverlap = HUBS.filter((other) => !seen.has(other.slug))
    .map((other) => ({ other, score: overlap(hub, other) }))
    .filter((entry) => entry.score > 0.08)
    .sort((a, b) => b.score - a.score)

  for (const { other } of byOverlap) {
    if (picked.length >= 8) break
    picked.push(other)
    seen.add(other.slug)
  }

  /*
   * Last resort: neighbours from the same band of /ui.
   *
   * Measured overlap runs out fast, and that is not a flaw in the metric —
   * most of these hubs filter on a single category, and two categories
   * share no artifacts by construction. Left there, 43 of 80 pages shipped
   * with two or three links out and two pages had no inbound link at all,
   * which is a set of orphans wearing a cross-link rail.
   *
   * So the fill walks the hub's own group starting just after it and wraps.
   * Starting at the hub's own position rather than at the top is what keeps
   * this from pointing all eighty pages at the same first three: each hub
   * links the ones after it, so inbound links spread evenly around the
   * group instead of piling onto whatever happens to be listed first.
   */
  const group = HUB_GROUPS.find((g) => g.hubs.some((h) => h.slug === hub.slug))
  if (group && picked.length < limit) {
    const start = group.hubs.findIndex((h) => h.slug === hub.slug)
    for (let step = 1; step <= group.hubs.length && picked.length < limit; step++) {
      const sibling = group.hubs[(start + step) % group.hubs.length]
      if (!seen.has(sibling.slug)) {
        picked.push(sibling)
        seen.add(sibling.slug)
      }
    }
  }

  RELATED.set(hub.slug, picked)
  return picked.slice(0, limit)
}

/* ------------------------------------------------------------------ *
 *  Generated FAQ
 * ------------------------------------------------------------------ */

export interface HubFaqEntry {
  q: string
  a: string
}

/**
 * The hand-written questions, plus two computed from what actually matched.
 *
 * The computed pair is the reason this function exists rather than the page
 * reading `hub.faq` directly. Both answers are built from this hub's own
 * numbers and its own first artifact, so they are genuinely different
 * strings on every page — a shared boilerplate answer repeated seventy-eight
 * times is exactly the signal that gets a set of generated pages classed as
 * thin, and it would also be less useful, because the install command
 * differs per tier.
 */
export function hubFaq(resolved: ResolvedHub): HubFaqEntry[] {
  const { hub, total, countsByLevel } = resolved
  const lead = resolved.groups[0]
  const first = lead?.items[0]

  const paid = resolved.all.filter((hit) => hit.tier === 'pro').length
  const free = total - paid

  const licence =
    paid === 0
      ? `All ${total.toLocaleString('en-US')} are free to copy and use in your own projects, including commercial ones. A Pro licence exists for redistribution — shipping them inside a product other people buy — and the full terms are on the licence page.`
      : `${free.toLocaleString('en-US')} of the ${total.toLocaleString('en-US')} are free to copy and use commercially; ${paid.toLocaleString('en-US')} need a Pro licence, and each one says so on its own page before you spend any time on it.`

  const install =
    first && first.level !== 'effect'
      ? `Install it with the CLI: \`npx hoverlab add ${first.id}\` writes the component and its dependencies into your project. Every artifact here also has a copy button for the raw source, and an "Open in sandbox" link if you would rather try it first.`
      : `Copy the CSS and the markup from the artifact's page — there is nothing to install, no runtime and no build step. The CLI (\`npx hoverlab add\`) is there for the component tiers above these, where a file gets written rather than pasted.`

  const generated: HubFaqEntry[] = [
    {
      q: `Are these ${hub.title.toLowerCase()} free to use?`,
      a: licence,
    },
    {
      q: 'How do I add one to my project?',
      a: install,
    },
  ]

  // A hub that reaches several rungs gets a third computed answer, because
  // "why is a template on a page about pricing tables" is a real question
  // and the honest answer is specific to how this hub matched.
  const spread = ARTIFACT_LEVELS.filter((l) => countsByLevel[l] > 0)
  if (spread.length > 1) {
    generated.push({
      q: 'Why does this page mix components and whole pages?',
      a: `Because the phrase does. The same search covers ${spread
        .map((l) => `${countsByLevel[l].toLocaleString('en-US')} ${LEVEL_WORD[l](countsByLevel[l])}`)
        .join(', ')
        .replace(/, ([^,]*)$/, ' and $1')} — one of them is the right size for what you are building, and which one depends on how much of the screen you still have to write.`,
    })
  }

  return [...hub.faq, ...generated]
}

/** Singular/plural nouns for the spread sentence above. */
const LEVEL_WORD: Record<ArtifactLevel, (n: number) => string> = {
  effect: (n) => (n === 1 ? 'CSS effect' : 'CSS effects'),
  primitive: (n) => (n === 1 ? 'primitive' : 'primitives'),
  block: (n) => (n === 1 ? 'section block' : 'section blocks'),
  page: (n) => (n === 1 ? 'composed page' : 'composed pages'),
  template: (n) => (n === 1 ? 'template' : 'templates'),
}
