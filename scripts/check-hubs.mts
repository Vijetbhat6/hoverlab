/**
 * Fail the build when an intent hub has stopped being a real page.
 *
 *   npx tsx scripts/check-hubs.mts
 *
 * WHY THIS EXISTS
 *
 * /ui/<slug> is 80 landing pages generated from a list of saved queries,
 * and that shape has exactly one failure mode worth engineering against:
 * quietly becoming a doorway-page farm. Every way it can go wrong is
 * invisible at the point where it happens —
 *
 *   A category gets renamed in `block-types.ts`. The hub that filtered on
 *   the old name now matches nothing. The page still builds, still renders,
 *   still sits in the sitemap, and is an empty grid under a heading.
 *
 *   Two hubs drift until they resolve to the same set. Both still render.
 *   Now there are two URLs competing for one query with identical content,
 *   which is the thing that gets a *section* demoted rather than a page.
 *
 *   Somebody adds a hub with a one-line lede and no FAQ because the grid
 *   looked good. Nothing complains, and the editorial rule that makes these
 *   defensible ("each page carries something true only of it") is gone with
 *   no commit that obviously broke it.
 *
 * None of that is caught by tsc, eslint, the route resolving, or a human
 * reviewing a diff — the diff for all three is small and looks fine. So it
 * is caught here, at build time, against the real catalog.
 *
 * It runs the same `resolveHub` the page does, so the check and the page
 * cannot disagree about what a hub contains.
 */

import { HUBS, HUB_GROUPS, type IntentHub } from '../src/lib/hubs/catalog.ts'
import { relatedHubs, resolveHub } from '../src/lib/hubs/resolve.ts'
import { BROWSE_INDEX } from '../src/lib/browse.ts'
import { ARTIFACT_LEVELS } from '../src/lib/artifact-types.ts'

/* ------------------------------------------------------------------ *
 *  Thresholds
 * ------------------------------------------------------------------ */

/**
 * Fewest artifacts a hub may show in total.
 *
 * Six is a grid two rows deep at the narrow breakpoint. Below that the page
 * is a heading with a gap under it, and it would be better served as a
 * paragraph on a neighbouring hub.
 */
const MIN_TOTAL = 6

/** Fewest at the level the hub leads with — the main grid cannot be one card. */
const MIN_LEAD = 3

/** Shortest acceptable lede. Roughly two real sentences. */
const MIN_LEDE = 220

/** Hand-written FAQ entries required per hub, before the computed ones. */
const MIN_FAQ = 2

/**
 * Jaccard similarity above which two hubs are the same page twice.
 *
 * Jaccard, not share-of-the-smaller — subsets are legitimate and common
 * ("flip cards" sits inside "3D card effects", and linking them is the
 * point). What is not legitimate is two hubs whose results are mostly the
 * same in both directions.
 */
const MAX_SIMILARITY = 0.7

/** The range this section is meant to stay inside. */
const HUB_RANGE: [number, number] = [60, 80]

/* ------------------------------------------------------------------ *
 *  Checks
 * ------------------------------------------------------------------ */

const problems: string[] = []

/** Every category name any level actually uses, lowercased. */
const KNOWN_CATEGORIES = new Set(BROWSE_INDEX.map((hit) => hit.category.toLowerCase()))

const slugs = new Set<string>()
const titles = new Map<string, string>()
const ledes = new Map<string, string>()

for (const hub of HUBS) {
  const where = hub.slug

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(hub.slug)) {
    problems.push(`${where}: slug is not kebab-case, and it is a URL`)
  }
  if (slugs.has(hub.slug)) problems.push(`${where}: duplicate slug — one page shadows the other`)
  slugs.add(hub.slug)

  const titleKey = hub.title.trim().toLowerCase()
  const seenTitle = titles.get(titleKey)
  if (seenTitle) problems.push(`${where}: same <h1> as ${seenTitle}`)
  else titles.set(titleKey, hub.slug)

  const ledeKey = hub.lede.trim().toLowerCase()
  const seenLede = ledes.get(ledeKey)
  if (seenLede) problems.push(`${where}: same lede as ${seenLede}`)
  else ledes.set(ledeKey, hub.slug)

  if (hub.lede.length < MIN_LEDE) {
    problems.push(
      `${where}: lede is ${hub.lede.length} chars, needs ${MIN_LEDE} — the paragraph is what makes this page worth publishing`,
    )
  }

  if (hub.faq.length < MIN_FAQ) {
    problems.push(`${where}: ${hub.faq.length} hand-written FAQ entries, needs ${MIN_FAQ}`)
  }
  for (const entry of hub.faq) {
    if (!entry.q.trim() || !entry.a.trim()) problems.push(`${where}: empty FAQ entry`)
    if (!entry.q.trim().endsWith('?')) problems.push(`${where}: FAQ "${entry.q}" is not a question`)
  }

  /* -- The filter ------------------------------------------------- */

  const axes = [
    hub.filter.levels,
    hub.filter.categories,
    hub.filter.tags,
    hub.filter.match,
  ].filter(Boolean).length
  if (axes === 0) {
    problems.push(`${where}: filter has no axis — it matches the entire catalog`)
  }

  for (const category of hub.filter.categories ?? []) {
    if (!KNOWN_CATEGORIES.has(category.toLowerCase())) {
      problems.push(
        `${where}: filters on category "${category}", which no level has — renamed or mistyped`,
      )
    }
  }

  if (!ARTIFACT_LEVELS.includes(hub.lead)) {
    problems.push(`${where}: lead "${hub.lead}" is not a level`)
  }
  if (hub.filter.levels && !hub.filter.levels.includes(hub.lead)) {
    problems.push(`${where}: leads with "${hub.lead}" but the filter excludes that level`)
  }

  for (const slug of hub.related ?? []) {
    if (slug === hub.slug) problems.push(`${where}: related links to itself`)
    else if (!HUBS.some((other) => other.slug === slug)) {
      problems.push(`${where}: related "${slug}" is not a hub`)
    }
  }

  /* -- What it actually resolves to ------------------------------- */

  const resolved = resolveHub(hub)
  if (resolved.total < MIN_TOTAL) {
    problems.push(
      `${where}: matches ${resolved.total} artifacts, needs ${MIN_TOTAL} — broaden it or drop the page`,
    )
  }
  const leadCount = resolved.countsByLevel[hub.lead]
  if (leadCount < MIN_LEAD) {
    problems.push(
      `${where}: only ${leadCount} at the lead level (${hub.lead}), needs ${MIN_LEAD} — lead with the level it actually reaches`,
    )
  }
}

/* -- Near-duplicate pairs ------------------------------------------- */

const keys = new Map<string, Set<string>>(
  HUBS.map((hub) => [
    hub.slug,
    new Set(resolveHub(hub).all.map((hit) => `${hit.level}:${hit.id}`)),
  ]),
)

function similarity(a: IntentHub, b: IntentHub): number {
  const ka = keys.get(a.slug)!
  const kb = keys.get(b.slug)!
  let shared = 0
  for (const key of ka) if (kb.has(key)) shared += 1
  const union = ka.size + kb.size - shared
  return union === 0 ? 0 : shared / union
}

for (let i = 0; i < HUBS.length; i++) {
  for (let j = i + 1; j < HUBS.length; j++) {
    const score = similarity(HUBS[i], HUBS[j])
    if (score > MAX_SIMILARITY) {
      problems.push(
        `${HUBS[i].slug} and ${HUBS[j].slug}: ${(score * 100).toFixed(0)}% the same results — merge them or narrow one`,
      )
    }
  }
}

/* -- The link graph -------------------------------------------------- *
 *
 * Cross-links are half of why these pages exist, and they are the half
 * that fails silently: `relatedHubs` falls back through hand-picked →
 * measured overlap → group siblings, and if all three came up short the
 * page would still render, just with a two-item rail. It shipped that way
 * on 43 of 80 pages before the group fallback existed, with two hubs
 * nothing linked to at all. Both are cheap to assert. */

const MIN_RELATED = 4

const inbound = new Map(HUBS.map((hub) => [hub.slug, 0]))
for (const hub of HUBS) {
  const related = relatedHubs(hub)
  if (related.length < MIN_RELATED) {
    problems.push(`${hub.slug}: ${related.length} related links, needs ${MIN_RELATED}`)
  }
  for (const sibling of related) {
    inbound.set(sibling.slug, (inbound.get(sibling.slug) ?? 0) + 1)
  }
}
for (const [slug, count] of inbound) {
  if (count === 0) {
    problems.push(`${slug}: no other hub links to it — reachable only from /ui and the sitemap`)
  }
}

/* -- The set as a whole --------------------------------------------- */

const grouped = HUB_GROUPS.reduce((n, group) => n + group.hubs.length, 0)
if (grouped !== HUBS.length) {
  problems.push(
    `HUB_GROUPS covers ${grouped} hubs but HUBS has ${HUBS.length} — one would be unreachable from /ui`,
  )
}

if (HUBS.length < HUB_RANGE[0] || HUBS.length > HUB_RANGE[1]) {
  problems.push(
    `${HUBS.length} hubs, outside the intended ${HUB_RANGE[0]}–${HUB_RANGE[1]}. Fewer and the section does not cover the queries; more and they start overlapping.`,
  )
}

/* ------------------------------------------------------------------ *
 *  Report
 * ------------------------------------------------------------------ */

const artifacts = HUBS.reduce((n, hub) => n + resolveHub(hub).total, 0)
console.log(
  `check-hubs: ${HUBS.length} hubs across ${HUB_GROUPS.length} groups, ${artifacts.toLocaleString('en-US')} artifact slots filled`,
)

if (problems.length > 0) {
  console.error(`\ncheck-hubs: ${problems.length} problem(s)\n`)
  for (const problem of problems) console.error(`  ✗ ${problem}`)
  process.exit(1)
}
