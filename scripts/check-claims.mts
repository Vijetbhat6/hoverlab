/**
 * Claims the site makes about its own popularity, and the components that
 * are one import away from making them again.
 *
 *     npx tsx scripts/check-claims.mts
 *
 * Wired into `prebuild`. Non-zero exit fails the build.
 *
 * ── WHY THIS IS A BUILD GATE AND NOT A LINT RULE ────────────────────────
 *
 * The landing page carried six testimonials attributed to named people in
 * named cities — "Maya Krishnan, Indie hacker, Berlin" — and, in two
 * places, "Join 1,200+ developers". None of the people existed and nothing
 * counted the developers. The audience for this product is developers, the
 * names were searchable, and one person searching one of them turns every
 * other number on the page into a maybe. Under the Unfair Commercial
 * Practices Directive as amended, a fabricated endorsement is not a
 * stylistic problem either.
 *
 * Both were taken off the rendered page. Neither was taken out of the tree:
 * `landing/testimonials.tsx` and `landing/bento-grid.tsx` sat there for a
 * fortnight afterwards, still exporting the fabrication, reachable by one
 * autocomplete from anyone who had not read the comment explaining why they
 * must not. That is the failure this file exists to make impossible — not
 * the original mistake, which a person caught, but the silent re-entry,
 * which a person would not.
 *
 * ── THE THREE RULES ─────────────────────────────────────────────────────
 *
 * 1. UNREACHABLE LANDING COMPONENTS. Every module under
 *    `components/landing/` must be imported from outside that directory.
 *    An orphan there is not merely dead code: it is dead *marketing copy*,
 *    which rots differently. Nobody reviews a section that does not render,
 *    so its claims stay frozen at whatever was true the day it was
 *    unrendered — and it keeps a public-facing export pointed at them.
 *
 * 2. COUNTED-AUDIENCE CLAIMS. "Join 1,200+ developers", "Trusted by 40
 *    teams", "used by 5,000 designers". A number attached to a *person*
 *    noun is a claim about adoption, and nothing in this repo counts
 *    adoption. Numbers attached to *catalog* nouns — 1,047 effects, 250
 *    blocks, 44 pages — are computed from the catalog at build time and are
 *    deliberately not matched.
 *
 * 3. UNSOURCED ENDORSEMENTS. A `<blockquote>` in site chrome must carry a
 *    `data-endorsement-source` attribute naming where the quote came from.
 *    This is an evidence requirement rather than a ban, which is the only
 *    version of the rule that survives the day a real customer says
 *    something nice: quoting them stays legal, inventing them does not, and
 *    the difference is one attribute a reviewer can check.
 *
 * ── WHAT IS DELIBERATELY OUT OF SCOPE ───────────────────────────────────
 *
 * `src/lib/blocks/sources` and `src/lib/pages/sources` are the catalog's
 * artifacts, not this site's marketing. `testimonial-grid` ships with six
 * quotes from people at Northwind, Contoso and Initech — the standard
 * fictional-company placeholders — because a testimonial block with no
 * testimonials in it is not a demo of anything. Those are sample data a
 * buyer replaces with their own, they are attributed to nobody real, and
 * scanning them would produce a wall of findings that teaches the reader to
 * pass `--force`. Site chrome only.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()

/** Site chrome — what a visitor to hoverlab.dev reads as our claims. */
const CHROME = ['src/app', 'src/components']

const LANDING = join(ROOT, 'src', 'components', 'landing')

interface Finding {
  file: string
  line: number
  rule: string
  message: string
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(path))
    else if (/\.tsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

/**
 * Strip comments before matching.
 *
 * Non-negotiable here, because the two comments that explain why the
 * invented testimonials were removed *quote them* — and a checker that
 * fires on the documentation of a fix, forcing the next person to delete
 * the explanation to get a green build, would actively destroy the reason
 * the rule exists.
 */
function stripComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, ' ')
}

/** Nouns that count people. A claim about these is a claim about adoption. */
const PEOPLE =
  'developers?|designers?|engineers?|teams?|companies|customers?|users?|founders?|makers?|builders?|agencies|studios?|startups?|businesses'

const AUDIENCE_CLAIMS: { id: string; pattern: RegExp; why: string }[] = [
  {
    id: 'joined-by',
    pattern: new RegExp(
      String.raw`\b(join(ed)?( by)?|loved by|trusted by|used by|powering|backed by|chosen by)\s+[\d,]+\s*\+?\s*(${PEOPLE})\b`,
      'gi',
    ),
    why: 'nothing in this repo counts sign-ups',
  },
  {
    id: 'people-verb',
    pattern: new RegExp(
      String.raw`\b[\d,]{2,}\s*\+?\s*(${PEOPLE})\s+(use|uses|trust|love|ship|build|choose|rely)\b`,
      'gi',
    ),
    why: 'nothing in this repo counts adoption',
  },
  {
    id: 'bare-plus',
    pattern: new RegExp(String.raw`\b\d[\d,]*\s*\+\s*(${PEOPLE})\b`, 'gi'),
    why: 'a "+" on a person count is an adoption claim with no source',
  },
]

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

/**
 * One opening tag as raw text, from the `<` at `start` to its own `>`.
 *
 * The naive `slice(start, start + N)` version of this passed a bare
 * `<blockquote>` because the *next* blockquote's `data-endorsement-source`
 * was inside the window — a checker that reports "sourced" for an unsourced
 * quote whenever a sourced one happens to follow it, which is worse than no
 * checker. Reading exactly one tag is the only version that cannot do that.
 *
 * Brace- and quote-aware because a JSX attribute value contains `>` more
 * often than not: `className={cn('a', x > 2 && 'b')}`. Same walk as
 * `openingTags` in audit-a11y.mts, and copied rather than imported because
 * that module runs its audit on load.
 */
function openingTag(source: string, start: number): string {
  let depth = 0
  let quote: string | null = null

  for (let i = start; i < source.length; i++) {
    const ch = source[i]!
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '>' && depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

function checkOrphanedLandingComponents(): Finding[] {
  const modules = readdirSync(LANDING)
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => name.replace(/\.tsx?$/, ''))

  const importers = CHROME.flatMap((dir) => walk(join(ROOT, dir))).filter(
    (path) => !path.startsWith(LANDING + sep),
  )

  const imported = new Set<string>()
  for (const path of importers) {
    const source = readFileSync(path, 'utf8')
    for (const match of source.matchAll(
      /['"](?:@\/components\/landing|\.\/landing|\.\.\/landing)\/([a-z0-9-]+)['"]/g,
    )) {
      imported.add(match[1]!)
    }
  }

  return modules
    .filter((name) => !imported.has(name))
    .map((name) => ({
      file: `src/components/landing/${name}.tsx`,
      line: 1,
      rule: 'unreachable-landing-component',
      message:
        'nothing outside components/landing imports this. Render it or delete it — ' +
        'an unrendered marketing section is copy nobody reviews and an export anyone can re-add',
    }))
}

function checkClaims(): Finding[] {
  const findings: Finding[] = []

  for (const dir of CHROME) {
    for (const path of walk(join(ROOT, dir))) {
      const raw = readFileSync(path, 'utf8')
      const source = stripComments(raw)
      const file = relative(ROOT, path).split(sep).join('/')

      for (const claim of AUDIENCE_CLAIMS) {
        for (const match of source.matchAll(claim.pattern)) {
          findings.push({
            file,
            line: lineOf(source, match.index!),
            rule: `audience-claim:${claim.id}`,
            message: `"${match[0].replace(/\s+/g, ' ').trim()}" — ${claim.why}`,
          })
        }
      }

      for (const match of source.matchAll(/<blockquote\b/g)) {
        if (/\bdata-endorsement-source\s*=/.test(openingTag(source, match.index!))) continue
        findings.push({
          file,
          line: lineOf(source, match.index!),
          rule: 'unsourced-endorsement',
          message:
            '<blockquote> in site chrome with no data-endorsement-source. ' +
            'Name where the quote came from, or do not publish it',
        })
      }
    }
  }

  return findings
}

const findings = [...checkOrphanedLandingComponents(), ...checkClaims()]

if (findings.length === 0) {
  console.log(
    'check-claims: no unreachable landing components, no uncounted audience claims, ' +
      'no unsourced endorsements.',
  )
  process.exit(0)
}

console.error(`check-claims: ${findings.length} finding${findings.length === 1 ? '' : 's'}.\n`)
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line}`)
  console.error(`    ${finding.rule} — ${finding.message}`)
}
console.error(
  '\nEvery one of these is a claim about other people that this repo cannot substantiate,\n' +
    'or a component positioned to make one. See the header for why that is a build failure.',
)
process.exitCode = 1
