/**
 * Fail the build when a hand-written catalog count has drifted from the
 * catalog.
 *
 *   npx tsx scripts/check-claimed-counts.mts
 *   npx tsx scripts/check-claimed-counts.mts --fix
 *
 * WHY THIS EXISTS
 *
 * `skills/*` are the one place a number about this catalog is typed by hand
 * and then shipped as a distributed artifact. A SKILL.md is copied into
 * somebody else's repo by `npx hoverlab skill` and read by an agent as
 * fact — it is not re-fetched, and nothing about it recompiles when a block
 * wave lands. It said "121 React blocks" for sixty-two blocks, which is the
 * catalog undersold by a third to exactly the audience the skill exists to
 * reach.
 *
 * `src/lib/compare.ts` already solved this for the comparison page by
 * counting at build time, and says so in a comment. Skills cannot do that:
 * the file itself is the thing that travels. So the number stays typed and
 * this check makes typing it a decision that fails loudly rather than one
 * that rots quietly — the same shape as `check-registry` and
 * `check-catalog-focus`.
 *
 * --fix rewrites the numbers in place. Deliberately not the default: a
 * count changing inside a sentence that also makes a claim ("21 pages and 7
 * runnable Next.js templates") is worth a human glance, because the sentence
 * around it goes stale too.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EFFECTS } from '../src/lib/effects.ts'
import { BLOCK_INDEX } from '../src/lib/blocks/block-index.ts'
import { PAGE_INDEX } from '../src/lib/pages/page-index.ts'
/* template-index, not templates: the latter pulls in `server-only`. */
import { TEMPLATE_COUNT } from '../src/lib/templates/template-index.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const SKILLS = join(HERE, '..', 'skills')

/**
 * What each claim should say, and the pattern that finds it.
 *
 * The patterns are deliberately narrow — `(\d[\d,]*) React blocks` and not
 * a bare number near the word "blocks" — because a guard that fires on
 * prose nobody meant as a count is a guard people switch off.
 */
const CLAIMS: { label: string; pattern: RegExp; actual: number }[] = [
  { label: 'CSS effects', pattern: /(\d[\d,]*) CSS effects/g, actual: EFFECTS.length },
  { label: 'effects', pattern: /(\d[\d,]*) effects/g, actual: EFFECTS.length },
  { label: 'React blocks', pattern: /(\d[\d,]*) React blocks/g, actual: BLOCK_INDEX.length },
  { label: 'blocks', pattern: /(\d[\d,]*) blocks/g, actual: BLOCK_INDEX.length },
  { label: 'pages', pattern: /(\d[\d,]*) pages/g, actual: PAGE_INDEX.length },
  {
    label: 'templates',
    pattern: /(\d[\d,]*) runnable Next\.js templates/g,
    actual: TEMPLATE_COUNT,
  },
]

const fix = process.argv.includes('--fix')
const problems: string[] = []
let checked = 0
let rewritten = 0

for (const entry of readdirSync(SKILLS, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const file = join(SKILLS, entry.name, 'SKILL.md')
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  let next = text
  for (const claim of CLAIMS) {
    for (const match of text.matchAll(claim.pattern)) {
      checked += 1
      const claimed = Number(match[1].replace(/,/g, ''))
      if (claimed === claim.actual) continue
      /* More specific patterns run first; skip what one of them already owns. */
      if (claim.label === 'effects' && /CSS effects/.test(match[0])) continue
      if (claim.label === 'blocks' && /React blocks/.test(match[0])) continue
      if (fix) {
        next = next.split(match[0]).join(`${claim.actual} ${claim.label}`)
        rewritten += 1
      } else {
        problems.push(
          `  skills/${entry.name}/SKILL.md claims "${match[0]}" — the catalog has ${claim.actual}.`,
        )
      }
    }
  }
  if (fix && next !== text) writeFileSync(file, next)
}

if (fix) {
  console.log(`check-claimed-counts: rewrote ${rewritten} of ${checked} claims.`)
  process.exit(0)
}

console.log(`check-claimed-counts: ${checked} hand-written counts checked in skills/.`)

if (problems.length > 0) {
  console.error(
    '\ncheck-claimed-counts: a shipped skill is advertising a stale catalog.\n\n' +
      problems.join('\n') +
      '\n\nThese files are copied into other people’s repos and read as fact.\n' +
      'Run with --fix, then read the sentence around each number.\n',
  )
  process.exit(1)
}
