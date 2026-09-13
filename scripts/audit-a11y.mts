/**
 * Static WCAG 2.2 AA audit over the block and page catalogs.
 *
 *   npm run audit:a11y            # report, exit 1 on any violation
 *   npm run audit:a11y -- --json  # write the per-artifact report and the
 *                                 # draft conformance statement
 *
 * WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT
 *
 * This produces evidence. It does not produce a conformance claim, and the
 * distinction is the reason this file is written the way it is.
 *
 * A WCAG conformance statement — "this component conforms to WCAG 2.2 Level
 * AA" — is a legal instrument. Under the European Accessibility Act,
 * enforceable since June 2025 against anyone selling into the EU, a
 * published accessibility statement is a representation a buyer is entitled
 * to rely on, and an incorrect one transfers their exposure to us. Today we
 * make no such claim and therefore carry no such exposure. Publishing this
 * report as a conformance statement would create liability that does not
 * currently exist, and it would do it on the strength of a regex pass.
 *
 * So: `PUBLISHABLE` below is false, and the report is internal until a
 * lawyer has read both the claim text and the list of what the audit cannot
 * see. That review is part of the work, not a formality after it.
 *
 * WHAT CHANGED, AND WHAT IS STILL IN THE WAY
 *
 * "Pending legal review" was doing two jobs, and only one of them was
 * legal. The audit was eight rules over six criteria against WCAG 2.1 — too
 * thin to support the claim even if a lawyer had approved the wording that
 * morning, and pointed at a standard version EN 301 549 v4.1.1 has since
 * superseded. Both of those were engineering problems wearing a legal
 * problem's coat, and both are now fixed: eighteen rules over ten criteria
 * against 2.2, including two of the six A/AA criteria 2.2 added.
 *
 * What is genuinely left is genuinely a lawyer's: read `CLAIM` below, read
 * `UNCHECKED`, and decide whether the first is defensible given the second.
 * `--json` writes that pairing out as a single document so the review is a
 * document review and not an archaeology exercise. Nothing here should flip
 * `PUBLISHABLE` on its own.
 *
 * WHAT IT CHECKS
 *
 * Only criteria decidable from source text. The catalog's artifact IS its
 * source — that is what a visitor pastes into a project — so reading the
 * exact bytes we ship is the right unit, the same argument audit-block-
 * motion.mts makes for reading generated-block-sources.json rather than
 * screenshotting the site.
 *
 * WHAT IT CANNOT CHECK, AND WHY THAT MATTERS MORE THAN WHAT IT CAN
 *
 * A large share of AA is not decidable without rendering, without colour
 * resolution, or without a human:
 *
 *   1.4.3 / 1.4.11  contrast — needs computed colour, and every artifact is
 *                   styled with tokens the consuming project overrides.
 *                   Whether a block passes depends on the palette it lands
 *                   in, which we do not control and cannot audit.
 *   1.3.2           meaningful sequence — needs rendered order.
 *   2.4.3           focus order — needs a rendered tab sequence.
 *   1.4.10          reflow — needs a viewport.
 *   2.5.3           label in name — needs the visible string, not the markup.
 *   3.2.x           consistency across a whole site, which is the consuming
 *                   project's property and not ours to assert.
 *
 * `UNCHECKED` is exported into the report for exactly this reason. Any
 * document built from this data has to carry that list, because a report
 * that lists twelve passes and stays silent about what it never looked at
 * reads as full coverage. That silence is the liability.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const LIB = join(HERE, '..', 'src', 'lib')

/**
 * Whether the report may be rendered as a public conformance statement.
 *
 * Flip this only alongside legal sign-off on the claim wording. It is a
 * constant rather than an env var on purpose: an environment variable is
 * something a deploy can set by accident, and this is not a thing that
 * should ever be true because of a misconfigured pipeline.
 */
export const PUBLISHABLE = false

/**
 * The rules themselves now live in `packages/cli/src/review`.
 *
 * They were written here, against this catalog, and they ran here on every
 * build for months. What moved them is that they turned out to be the
 * product: the same eighteen checks pointed at somebody else's diff are
 * `hoverlab review`, and the reason no other catalog vendor can copy it is
 * that these rules are the residue of having run them over 250 blocks and
 * thrown away the ones that were only nearly right.
 *
 * The direction of the dependency is deliberate. The CLI package is
 * dependency-free and published on its own, so it cannot import from this
 * repo; this repo can import from it. That leaves one set of rules rather
 * than two that drift, and it is what keeps a sentence in CLAIM below true —
 * "the method is reproducible" survives only while there is one
 * implementation of it.
 *
 * `src/lib/a11y-rules.test.ts` imports `RULES` from this file and is the
 * proof the move was faithful: every case in it is a mistake this audit
 * actually made on the real catalog.
 */
import type { Rule } from '../packages/cli/src/review/a11y.mjs'
import { RULES, STANDARD, UNCHECKED } from '../packages/cli/src/review/a11y.mjs'
import { stripComments, stripEncodedMarkup } from '../packages/cli/src/review/jsx.mjs'

export { RULES, STANDARD, UNCHECKED }

interface SourceFile {
  path: string
  lang: string
  source: string
}

interface Finding {
  rule: string
  sc: string
  level: string
  severity: Rule['severity']
  file: string
  message: string
}

interface ArtifactReport {
  id: string
  kind: 'block' | 'page'
  /** Rule ids this artifact tripped nothing on. */
  passed: string[]
  findings: Finding[]
}

function auditArtifacts(
  entries: Record<string, SourceFile[]>,
  kind: 'block' | 'page',
): ArtifactReport[] {
  return Object.entries(entries).map(([id, files]) => {
    const findings: Finding[] = []
    const tripped = new Set<string>()

    for (const file of files) {
      if (!/tsx?$/.test(file.lang) && !/\.tsx?$/.test(file.path)) continue
      const source = stripEncodedMarkup(stripComments(file.source))
      for (const rule of RULES) {
        for (const message of rule.check(source)) {
          tripped.add(rule.id)
          findings.push({
            rule: rule.id,
            sc: rule.sc,
            level: rule.level,
            severity: rule.severity,
            file: file.path,
            message,
          })
        }
      }
    }

    return {
      id,
      kind,
      passed: RULES.filter((r) => !tripped.has(r.id)).map((r) => r.id),
      findings,
    }
  })
}

/**
 * The wording a lawyer has to approve, and the file that exists so they can.
 *
 * WHY THE CLAIM TEXT LIVES IN CODE
 *
 * Because it has to be reviewed against the audit, and the audit changes.
 * A claim in a Google Doc gets approved once, against a state of the world
 * nobody recorded, and then the coverage moves underneath it — a rule is
 * relaxed, a criterion is moved to UNCHECKED, a block ships with a
 * violation — and the approved sentence quietly stops being true. Here it
 * sits three screens from the rules it describes, and `--json` renders it
 * next to the current numbers, so what gets signed off is a claim *and* the
 * evidence it rests on, in one document, at one moment.
 *
 * WHAT THE WORDING IS DOING
 *
 * Every clause is load-bearing and most of them are limits:
 *
 *   "each artifact's source" — the unit. Not the site, not a rendered page,
 *   not the consuming project. What we ship is text someone pastes, and
 *   that is the only thing we can speak for.
 *
 *   "the thirteen criteria listed" — not "WCAG 2.2 AA". A partial claim
 *   stated as partial is defensible. The same evidence stated as a full
 *   conformance claim is a misrepresentation, and the gap between the two
 *   is one word.
 *
 *   "does not evaluate" — the UNCHECKED list is inside the claim rather
 *   than beside it, because a limit in a footnote is a limit a buyer's
 *   procurement team will not read and a regulator will not credit.
 *
 *   "in the palette and layout you place it in" — contrast and reflow are
 *   properties of the integration, not of the component, and this is the
 *   sentence that stops a buyer reading our result as their result.
 */
const CLAIM = {
  headline: (n: number, criteria: number) =>
    `Every one of the ${n} components in this catalog is checked, on every build, ` +
    `against ${criteria} WCAG ${STANDARD.wcag} Level ${STANDARD.level} success criteria ` +
    `that can be decided from source.`,
  body: [
    `This is a statement about each artifact's source — the exact text you copy — and not about a rendered page, a website, or the product you paste it into.`,
    `It covers the ${STANDARD.wcag} criteria listed below and no others. It is not a claim of conformance to WCAG ${STANDARD.wcag} Level ${STANDARD.level}, which requires evaluating criteria this method cannot reach.`,
    `The criteria it does not evaluate are listed in full, with the reason each one is out of reach. Contrast, focus order, reflow and reading order depend on the palette and layout you place a component in, and are yours to verify in situ.`,
    `The method is a static analysis of source text and is reproducible: \`npm run audit:a11y\` in the published repository returns the same result.`,
  ],
  /** What a reviewer must decide, spelled out so the ask is bounded. */
  reviewQuestions: [
    'Is the headline defensible as a statement of fact, given the "not a conformance claim" sentence that follows it?',
    'Does listing the unevaluated criteria in full discharge the duty not to mislead, or does the headline need the limitation inline?',
    'Under the EAA, does a partial, reproducible, per-artifact result create any representation beyond its own terms?',
    'Is "checked on every build" safe given that a build can be run with the check skipped?',
  ],
}

/**
 * Render the claim, the evidence and the limits as one reviewable document.
 *
 * Markdown rather than a route, and unpublished rather than gated, because
 * this is not for a visitor. It is the thing you attach to an email asking
 * a lawyer four specific questions, and the value of it is that it cannot
 * be read without the UNCHECKED list — they are in the same file, and the
 * file is regenerated from the same data the site renders.
 */
function renderClaimDraft(reports: ArtifactReport[]): string {
  const all = reports.flatMap((r) => r.findings)
  const violations = all.filter((f) => f.severity === 'violation')
  const advisories = all.filter((f) => f.severity === 'advisory')
  const criteria = [...new Set(RULES.map((r) => r.sc))].sort()

  const lines: string[] = []
  const w = (...text: string[]) => lines.push(...text)

  w(
    '# Accessibility conformance claim — DRAFT, NOT PUBLISHED',
    '',
    '> Generated by `scripts/audit-a11y.mts --json`. Do not edit by hand: the next',
    "> build overwrites it. To change the wording, change `CLAIM` in that file — which",
    '> is deliberate, so a claim and the audit behind it can never drift apart.',
    '',
    `**Status:** \`PUBLISHABLE = ${PUBLISHABLE}\`. Nothing in this document is on the`,
    'public site. `/accessibility` renders the evidence only; the conformance section',
    'there is behind the same flag.',
    '',
    `**Standard:** WCAG ${STANDARD.wcag} Level ${STANDARD.level}, as referenced by`,
    `EN 301 549 ${STANDARD.en301549}, which is the harmonised standard the European`,
    'Accessibility Act is met by conforming to.',
    '',
    '---',
    '',
    '## The proposed claim',
    '',
    `> ${CLAIM.headline(reports.length, criteria.length)}`,
    '',
    ...CLAIM.body.map((paragraph) => `> ${paragraph}\n>`),
    '',
    '## What the claim rests on',
    '',
    `- **${reports.length} artifacts** — ${reports.filter((r) => r.kind === 'block').length} blocks, ${reports.filter((r) => r.kind === 'page').length} pages.`,
    `- **${RULES.length} rules** over **${criteria.length} success criteria**: ${criteria.join(', ')}.`,
    `- **${violations.length} violations** and **${advisories.length} advisories** at the time of writing.`,
    '',
    '| Rule | SC | Level | Severity | Name |',
    '| --- | --- | --- | --- | --- |',
    ...RULES.map(
      (rule) => `| \`${rule.id}\` | ${rule.sc} | ${rule.level} | ${rule.severity} | ${rule.name} |`,
    ),
    '',
    '## What the claim does NOT cover',
    '',
    'These criteria are not evaluated. A reviewer should read this list before the',
    'claim above, not after it.',
    '',
    '| SC | Criterion | Why it is out of reach |',
    '| --- | --- | --- |',
    ...UNCHECKED.map((item) => `| ${item.sc} | ${item.name} | ${item.why} |`),
    '',
    ...(criteria.some((sc) => UNCHECKED.some((item) => item.sc.split(' / ').includes(sc)))
      ? [
          '**A criterion can appear in both tables, and 2.4.3 does.** `positive-tabindex`',
          'decides one part of Focus Order — a positive `tabindex` fails it, always,',
          'from source. The rest of Focus Order needs a rendered tab sequence. The',
          'honest reading is "one failure mode ruled out", not "criterion met", and a',
          'reviewer should treat the row in the second table as the governing one.',
          '',
        ]
      : []),
  )

  if (advisories.length > 0) {
    w(
      '## Open advisories',
      '',
      'Not failures. Patterns where the criterion has an exception this method',
      'cannot evaluate, so a person decides. Listed because a claim that mentions',
      'only the clean result is not the whole result.',
      '',
      ...advisories.map((f) => `- \`${f.file}\` — ${f.sc} ${f.rule}: ${f.message}`),
      '',
    )
  }

  if (violations.length > 0) {
    w(
      '## Open violations — the claim cannot be made while these stand',
      '',
      ...violations.map((f) => `- \`${f.file}\` — ${f.sc} ${f.rule}: ${f.message}`),
      '',
    )
  }

  w(
    '## What the review is being asked to decide',
    '',
    ...CLAIM.reviewQuestions.map((question, i) => `${i + 1}. ${question}`),
    '',
    'If the answer to all four is yes, `PUBLISHABLE` in `scripts/audit-a11y.mts`',
    'becomes `true` and `/accessibility` renders the claim alongside the evidence',
    'it already shows. If any answer is no, the wording changes here and this',
    'document regenerates.',
    '',
  )

  return lines.join('\n')
}

function main(): void {
  const blockSources = JSON.parse(
    readFileSync(join(LIB, 'blocks', 'generated-block-sources.json'), 'utf8'),
  ) as Record<string, SourceFile[]>

  /*
    Pages are audited too, and the reason they were not is worth stating
    rather than quietly fixing: `auditArtifacts` always took a `kind`, and
    the report type always had 'page' in it, but nothing ever passed one.
    The result read as full catalog coverage while twenty-one routes had
    never been looked at.

    Read what a page's own file trips, and nothing more. A page imports its
    blocks — `@/components/{id}` — so the bytes here are assembly: layout,
    headings, the odd inline control. The blocks it pulls in are audited on
    their own rows, which is the right place for them; a page inheriting its
    blocks' findings would double-count every one of them and make the
    catalog look worse the more a page reuses.

    The honest reading of a clean page row is therefore "the assembly adds no
    finding", not "this route is accessible". A reader of the report needs
    both rows to see the whole picture, which is why `kind` is on every
    artifact rather than implied by which file it came from.
  */
  const pageSources = JSON.parse(
    readFileSync(join(LIB, 'pages', 'generated-page-sources.json'), 'utf8'),
  ) as Record<string, SourceFile[]>

  const blockReports = auditArtifacts(blockSources, 'block')
  const pageReports = auditArtifacts(pageSources, 'page')
  const reports = [...blockReports, ...pageReports]
  const all = reports.flatMap((r) => r.findings)
  const violations = all.filter((f) => f.severity === 'violation')
  const advisories = all.filter((f) => f.severity === 'advisory')

  if (process.argv.includes('--json')) {
    const out = {
      /*
        No timestamp, deliberately. `new Date()` here would rewrite the file
        on every build and make the report look freshly audited when nothing
        had changed — and "when was this last checked" is precisely the
        question a reader of an accessibility report is entitled to a true
        answer to. Git already knows; the caller can stamp it if it needs to
        be in the document.
      */
      publishable: PUBLISHABLE,
      standard: STANDARD,
      rules: RULES.map((r) => ({
        id: r.id,
        sc: r.sc,
        level: r.level,
        name: r.name,
        severity: r.severity,
      })),
      unchecked: UNCHECKED,
      artifacts: reports,
    }
    const path = join(LIB, 'generated-a11y-report.json')
    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
    console.log(`audit-a11y: wrote ${path}`)

    /*
      The draft claim goes to the repository root, not into `src/lib`.

      It is not code and nothing imports it. It is a document for a person
      who is not going to go looking in a lib directory, and the whole point
      of generating it is to make the remaining step easy to actually take.
    */
    const draft = join(HERE, '..', 'ACCESSIBILITY-CLAIM.draft.md')
    writeFileSync(draft, `${renderClaimDraft(reports)}`, 'utf8')
    console.log(`audit-a11y: wrote ${draft}`)
  }

  /*
    Rules and criteria are counted separately because they are not the same
    number and the difference is the interesting one. Four rules map to
    4.1.2 alone. A line reading "18 criteria" when the audit decides 13 of
    them would be inflating coverage by 38% through a plural, in the one
    document where that is the whole point.
  */
  const criteria = new Set(RULES.map((r) => r.sc)).size

  console.log(
    `audit-a11y: ${blockReports.length} blocks and ${pageReports.length} pages ` +
      `against ${RULES.length} rules over ${criteria} statically decidable ` +
      `WCAG ${STANDARD.wcag} ${STANDARD.level} criteria — ${violations.length} violation` +
      `${violations.length === 1 ? '' : 's'}, ` +
      `${advisories.length} ${advisories.length === 1 ? 'advisory' : 'advisories'}.`,
  )
  console.log(
    `audit-a11y: ${UNCHECKED.length} success criteria are NOT evaluated here. ` +
      `This is evidence, not a conformance claim (PUBLISHABLE=${PUBLISHABLE}).`,
  )

  for (const label of ['violation', 'advisory'] as const) {
    const group = reports.filter((r) => r.findings.some((f) => f.severity === label))
    if (!group.length) continue
    console.log(`\n${label === 'violation' ? 'VIOLATIONS' : 'ADVISORIES'}`)
    for (const report of group) {
      console.log(`  ${report.id}`)
      for (const finding of report.findings.filter((f) => f.severity === label)) {
        console.log(`    ${finding.sc} ${finding.rule} — ${finding.message}`)
      }
    }
  }

  // Advisories do not fail a build. A queue for a human is not a defect,
  // and a check that cries wolf on best-practice nits gets switched off.
  if (violations.length > 0) process.exitCode = 1
}

/*
  Run only when this file IS the command, not when it is imported.

  The rules below are the load-bearing part of a document that may one day
  be a legal representation, and until now none of them had a test — because
  importing this module ran the whole audit over the real catalog and wrote
  two files as a side effect. A rule you cannot exercise on a three-line
  fixture is a rule whose false positives are found by shipping them, which
  is how `control-has-name` came to report two correctly-labelled buttons.

  `process.argv[1]` is the script path as invoked; resolving both sides
  handles the Windows drive-letter casing that makes a raw string compare
  fail here and pass in CI.
*/
const invokedDirectly =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)).toLowerCase() ===
    resolve(process.argv[1]).toLowerCase()

if (invokedDirectly) main()
