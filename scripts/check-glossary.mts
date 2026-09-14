/**
 * Fail the build when the glossary stops being able to show what it defines.
 *
 *   npx tsx scripts/check-glossary.mts
 *
 * WHY THIS EXISTS
 *
 * /glossary's whole claim is the one in its lede: every definition comes with
 * the real thing under it and its code on a copy button. That claim is made
 * by prose and kept by sixty hand-written ids pointing into three catalogs
 * that are regenerated, renamed and reorganised constantly. It is precisely
 * the arrangement that rots without anybody touching the page.
 *
 * And it rots invisibly. `catalog.ts` is data-only, so a dead id is not a tsc
 * error. `resolveTerm` returns `undefined` for one, and the page — correctly,
 * because a half-rendered entry is worse — drops it. So the failure mode is
 * not a crash or a 404: it is a glossary that quietly shrinks, still renders,
 * still says sixty in its own heading, and is now a list of definitions with
 * nothing under some of them. Exactly the thing every other UI glossary on
 * the web already is, which is the only reason ours is worth publishing.
 *
 * The preview check is the one that actually caught something. An id can be
 * live in `BLOCK_CATALOG` and absent from `BLOCK_PREVIEWS` — the catalog is
 * data and the registry is a hand-maintained map of id to component, and they
 * are edited in separate files. `resolveTerm` is happy in that case, because
 * the metadata resolves; the entry renders with its name, its link and its
 * copy button, and a blank space where the illustration goes.
 *
 * So this imports the same registries the page renders through, and the check
 * and the page cannot disagree about what can be shown.
 *
 * Run: npm run check:glossary  (wired into prebuild)
 */

import { GLOSSARY, GLOSSARY_TERMS } from '../src/lib/glossary/catalog.ts'
import { EFFECT_INDEX } from '../src/lib/effect-index.ts'
import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PRIMITIVE_CATALOG } from '../src/lib/primitives/catalog.ts'
import { BLOCK_PREVIEWS } from '../src/lib/blocks/registry.tsx'
import { PRIMITIVE_PREVIEWS } from '../src/lib/primitives/registry.tsx'

/* ------------------------------------------------------------------ *
 *  Thresholds
 * ------------------------------------------------------------------ */

/**
 * The range this page is meant to stay inside.
 *
 * A floor because a glossary of thirty terms is a FAQ, and a ceiling because
 * past about eighty the A–Z index stops being scannable and the page should
 * split by discipline instead. The current sixty is a deliberate number, not
 * a coincidence of what was easy to write.
 */
const TERM_RANGE: [number, number] = [50, 80]

/**
 * Shortest acceptable definition.
 *
 * Low on purpose. The best entries on this page have the shortest
 * definitions — "A small looping animation shown while an operation of
 * unknown length is running" is eighty characters and is finished — so a
 * floor set at "one generous sentence" would push the good ones towards
 * padding. This is only here to catch a stub: a headword somebody added with
 * a fragment under it, meaning to come back.
 */
const MIN_DEFINITION = 70

/**
 * Shortest acceptable `inPractice`.
 *
 * Higher than the definition floor on purpose. This is the field that makes
 * the page worth reading, and the way it degrades is not by being deleted but
 * by becoming a second sentence of definition — which is short. Two hundred
 * characters is about the point where it has to contain an actual claim.
 */
const MIN_IN_PRACTICE = 200

/* ------------------------------------------------------------------ *
 *  Checks
 * ------------------------------------------------------------------ */

const problems: string[] = []

const effects = new Set(EFFECT_INDEX.map((e) => e.id))
const blocks = new Set(BLOCK_CATALOG.map((b) => b.id))
const primitives = new Set(PRIMITIVE_CATALOG.map((p) => p.id))
const slugs = new Set(GLOSSARY_TERMS.map((t) => t.slug))

/**
 * Every headword and synonym, lowercased, against the term that claimed it.
 *
 * Two entries claiming the same word is a real defect rather than a tidiness
 * rule: "pill" is a plausible `aka` for both a badge and a chip, and if both
 * declare it, a reader who searches the page for the word they know lands on
 * whichever happens to come first. One of the two has to give it up, and the
 * decision belongs in the catalog rather than in whoever reads it next.
 */
const headwords = new Map<string, string>()

/** Which term already claimed an artifact, so a clash can name both. */
const usedExamples = new Map<string, string>()

for (const group of GLOSSARY) {
  if (group.terms.length === 0) {
    problems.push(`${group.id}: group has no terms`)
  }

  for (const term of group.terms) {
    const where = `${group.id}/${term.slug}`

    /* --- the illustration resolves ------------------------------- */

    const { level, id } = term.example
    const known =
      level === 'effect' ? effects : level === 'block' ? blocks : primitives

    if (!known.has(id)) {
      problems.push(`${where}: example ${level} "${id}" is not in the catalog`)
    } else if (level === 'block' && !(id in BLOCK_PREVIEWS)) {
      // Catalog and registry are separate files. See the note at the top.
      problems.push(`${where}: block "${id}" exists but has no entry in BLOCK_PREVIEWS`)
    } else if (level === 'primitive' && !(id in PRIMITIVE_PREVIEWS)) {
      problems.push(
        `${where}: primitive "${id}" exists but has no entry in PRIMITIVE_PREVIEWS`,
      )
    }

    /*
     * One artifact per term. Two definitions illustrated by the same picture
     * read as an editorial shortcut whether or not it was one — and it is
     * always a copy-paste slip, because the catalog has 1,400 candidates.
     */
    const key = `${level}:${id}`
    const owner = usedExamples.get(key)
    if (owner) {
      problems.push(`${where}: example "${id}" is already illustrating "${owner}"`)
    } else {
      usedExamples.set(key, term.slug)
    }

    /* --- the prose is there -------------------------------------- */

    if (term.definition.length < MIN_DEFINITION) {
      problems.push(
        `${where}: definition is ${term.definition.length} chars, needs ${MIN_DEFINITION}`,
      )
    }
    if (term.inPractice.length < MIN_IN_PRACTICE) {
      problems.push(
        `${where}: inPractice is ${term.inPractice.length} chars, needs ${MIN_IN_PRACTICE}`,
      )
    }

    /* --- cross-references resolve -------------------------------- */

    for (const slug of term.see ?? []) {
      if (slug === term.slug) {
        problems.push(`${where}: sees itself`)
      } else if (!slugs.has(slug)) {
        problems.push(`${where}: sees "${slug}", which is not a term`)
      }
    }

    /* --- nothing collides in the index --------------------------- */

    for (const word of [term.term, ...(term.aka ?? [])]) {
      const lower = word.toLowerCase()
      const claimed = headwords.get(lower)
      if (claimed && claimed !== term.slug) {
        problems.push(`${where}: "${word}" is also claimed by "${claimed}"`)
      } else {
        headwords.set(lower, term.slug)
      }
    }
  }
}

/* --- slugs are fragments; a duplicate shadows an anchor ---------- */

const allSlugs = GLOSSARY_TERMS.map((t) => t.slug)
for (const slug of new Set(allSlugs)) {
  if (allSlugs.filter((s) => s === slug).length > 1) {
    problems.push(`duplicate slug "${slug}"`)
  }
}

/* --- group ids are fragments too --------------------------------- */

const groupIds = GLOSSARY.map((g) => g.id)
for (const id of new Set(groupIds)) {
  if (groupIds.filter((g) => g === id).length > 1) problems.push(`duplicate group id "${id}"`)
  if (slugs.has(id)) problems.push(`group id "${id}" collides with a term slug`)
}

/* --- the page stays the size it claims to be --------------------- */

const [min, max] = TERM_RANGE
if (GLOSSARY_TERMS.length < min || GLOSSARY_TERMS.length > max) {
  problems.push(
    `${GLOSSARY_TERMS.length} terms is outside the intended range ${min}–${max}`,
  )
}

/* ------------------------------------------------------------------ *
 *  Report
 * ------------------------------------------------------------------ */

const byLevel = GLOSSARY_TERMS.reduce<Record<string, number>>((acc, t) => {
  acc[t.example.level] = (acc[t.example.level] ?? 0) + 1
  return acc
}, {})

console.log(
  `check-glossary: ${GLOSSARY_TERMS.length} terms in ${GLOSSARY.length} groups ` +
    `(${Object.entries(byLevel)
      .map(([level, n]) => `${n} ${level}`)
      .join(', ')})`,
)

if (problems.length > 0) {
  console.error(`\ncheck-glossary: ${problems.length} problem(s)`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}

console.log('check-glossary: every term resolves to something it can show.')
