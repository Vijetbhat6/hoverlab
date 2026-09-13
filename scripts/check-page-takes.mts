/**
 * Guards the `takeOf` pointer that pairs two takes of one page type.
 *
 * `takeOf` is deliberately one-directional — take 02 names take 01 and
 * take 01 says nothing — which removes the "edit two places" failure a
 * symmetric field would have, and replaces it with three cheaper ones
 * this script catches:
 *
 *   dangling   takeOf names an id the catalog does not have, usually a
 *              typo or a page renamed on one side of the pair only. The
 *              UI degrades quietly (no pair rail), so nothing on the site
 *              would ever look broken enough to notice.
 *   chained    take 02 pointing at another take. `takesOfPage` walks up
 *              exactly one level, so a chain silently drops a take out of
 *              its own group.
 *   self       a page naming itself, which renders "Take 1 of 1".
 *
 * Also warns — without failing — on a take whose category differs from
 * take 01's. Two takes of the same page type living in different
 * categories is not wrong by construction, but it is nearly always a
 * mis-set category rather than an intention.
 *
 * Run: npx tsx scripts/check-page-takes.mts
 */

import { PAGE_CATALOG } from '../src/lib/pages/catalog'

const byId = new Map(PAGE_CATALOG.map((p) => [p.id, p]))
const takes = PAGE_CATALOG.filter((p) => p.takeOf)

const problems: string[] = []
const warnings: string[] = []

for (const page of takes) {
  const originId = page.takeOf!

  if (originId === page.id) {
    problems.push(`${page.id}: takeOf names itself`)
    continue
  }

  const origin = byId.get(originId)
  if (!origin) {
    problems.push(`${page.id}: takeOf "${originId}" matches no page in the catalog`)
    continue
  }

  if (origin.takeOf) {
    problems.push(
      `${page.id}: takeOf "${originId}" is itself a take (of "${origin.takeOf}") — takes do not chain`,
    )
    continue
  }

  if (origin.category !== page.category) {
    warnings.push(
      `${page.id} is "${page.category}" but take 01 "${originId}" is "${origin.category}"`,
    )
  }
}

// A page type with three-plus takes is legal but worth surfacing: the
// pair UI says "Take 2 of 3" happily, and nobody has decided we want that.
const groups = new Map<string, number>()
for (const page of takes) {
  groups.set(page.takeOf!, (groups.get(page.takeOf!) ?? 0) + 1)
}
for (const [originId, n] of groups) {
  if (n > 1) warnings.push(`${originId} has ${n + 1} takes, not 2`)
}

console.log(
  `Page takes: ${groups.size} page type(s) with a second take, ${takes.length} take(s) total.`,
)

for (const w of warnings) console.log(`  warn  ${w}`)

if (problems.length > 0) {
  for (const p of problems) console.log(`  FAIL  ${p}`)
  console.log(
    `\n${problems.length} broken take pointer(s). See Page['takeOf'] in src/lib/pages/page-types.ts.`,
  )
  process.exit(1)
}

console.log('Every take resolves to a real, unchained take 01.')
