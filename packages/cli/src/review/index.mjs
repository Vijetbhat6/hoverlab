/**
 * The review engine: source text in, findings out.
 *
 * WHAT THIS IS
 *
 * Four rule families that were each written to answer a bug someone
 * actually shipped, run over a catalog of 250 components on every build for
 * months, and pointed here at somebody else's code instead.
 *
 *   a11y      18 WCAG 2.2 AA rules, over 10 criteria decidable from source
 *   rtl       physical spacing (fixable), directional glyphs, positions
 *   motion    infinite animation with no reduced-motion handling
 *   overflow  absolutely positioned boxes escaping a static scroller
 *
 * WHAT IT DELIBERATELY IS NOT
 *
 * It is not a linter for code style, and it is not a conformance checker.
 * Every rule here fails in the direction of silence: where a criterion
 * needs a rendered page, a resolved colour or a human's judgement, there is
 * either an advisory that asks a question or nothing at all. `UNCHECKED` in
 * `a11y.mjs` is exported so that any surface reporting a pass can report
 * the gap beside it — a list of passes that says nothing about what was
 * never looked at reads as full coverage, and that silence is worse than
 * publishing nothing.
 *
 * SEVERITY IS THE WHOLE CONTRACT
 *
 * `violation` means the rule is confident and the thing is broken; those
 * set the exit code. `advisory` means the pattern is worth a human's
 * attention and the rule cannot close the question itself — a 20px tap
 * target that might pass by the spacing exception, a drag that might have a
 * keyboard alternative the source cannot show, a glow that is lighting
 * rather than layout. Advisories never fail a run, because a reviewer that
 * blocks a merge on a question rather than a defect is a reviewer that gets
 * switched off, and then the violations go unread too.
 */

import { RULES, STANDARD, UNCHECKED } from './a11y.mjs'
import { lineAt, maskComments, maskEncodedMarkup } from './jsx.mjs'
import { reviewMotion } from './motion.mjs'
import { reviewOverflow } from './overflow.mjs'
import { fixSpacing, reviewRtl } from './rtl.mjs'

export { RULES, STANDARD, UNCHECKED }

/**
 * One defect, in the shape every surface renders.
 *
 * @typedef {object} Finding
 * @property {string} rule
 * @property {'a11y' | 'rtl' | 'motion' | 'overflow'} family
 * @property {string} [sc] WCAG success criterion, where one applies.
 * @property {'violation' | 'advisory'} severity
 * @property {string} file
 * @property {number} [line] 1-based, absent when it could not be resolved.
 * @property {string} message What is wrong.
 * @property {string} [fix] What to do about it, in prose a person can apply.
 */

/** Extensions worth reviewing. Anything else is skipped in silence. */
export const REVIEWABLE = /\.(tsx|jsx|mtsx|mjsx)$/

/**
 * The line an a11y finding sits on.
 *
 * The rules return messages rather than positions — that is the interface
 * they have had since they were a build gate, where the unit was an
 * artifact and a line number would have been noise. A reviewer reading a
 * diff needs one, so it is recovered here instead of changing eighteen
 * rules to thread positions they have no other use for.
 *
 * Most messages end in `: <tag …>`, the first 80 characters of the offending
 * tag, and that is a precise enough needle to find in the masked source.
 * When it is not found — a rule whose message is a sentence, a tag that was
 * truncated mid-attribute — the finding is reported without a line rather
 * than with a guessed one. A wrong line number in a PR comment is worse
 * than none: it sends the reader to innocent code and costs the whole
 * report its credibility.
 */
function locate(masked, message) {
  /*
    Two needles, most precise first.

    A message ending in `: <tag …>` carries the first 80 characters of the
    offending tag, which is as close to unique as this gets. Failing that,
    a message that merely mentions a tag — "<table> with no <th> header
    cells" — can still be placed by the first one it names. That second
    form is weaker: it finds the first `<table>` in the file rather than
    necessarily the offending one. It is still worth having, because a rule
    like that one fires at most once per file, so first and only are the
    same thing.
  */
  const suffix = message.lastIndexOf(': <')
  if (suffix !== -1) {
    const found = masked.indexOf(message.slice(suffix + 2))
    if (found !== -1) return lineAt(masked, found)
  }

  const mentioned = /<[a-zA-Z][\w.]*(?:\s[^<>]*)?\/?>/.exec(message)
  if (mentioned) {
    const found = masked.indexOf(mentioned[0])
    if (found !== -1) return lineAt(masked, found)
  }

  return undefined
}

/**
 * Review one file's source.
 *
 * @param {{ path: string, source: string }} file
 * @returns {Finding[]}
 */
export function reviewSource({ path, source }) {
  /*
    Comments are masked rather than stripped so that offsets survive and a
    finding can carry a line. Masking also stops a rule firing on prose
    about the rule, which is not hypothetical: a file explaining why it
    avoids `<table>` without `scope` contains the words that trip the table
    rule.
  */
  const masked = maskEncodedMarkup(maskComments(source))

  /** @type {Finding[]} */
  const findings = []

  for (const rule of RULES) {
    for (const message of rule.check(masked)) {
      findings.push({
        rule: rule.id,
        family: 'a11y',
        sc: rule.sc,
        severity: rule.severity,
        file: path,
        line: locate(masked, message),
        message,
        fix: undefined,
      })
    }
  }

  for (const finding of [...reviewRtl(source), ...reviewMotion(source), ...reviewOverflow(source)]) {
    findings.push({ ...finding, file: path })
  }

  return findings.sort((a, b) => (a.line ?? 0) - (b.line ?? 0))
}

/**
 * Review several files.
 *
 * @param {{ path: string, source: string }[]} files
 * @returns {Finding[]}
 */
export function reviewFiles(files) {
  return files.filter((f) => REVIEWABLE.test(f.path)).flatMap(reviewSource)
}

/**
 * Rewrite what can be rewritten without judgement.
 *
 * Only the physical→logical spacing codemod runs here, and the restraint is
 * the point. `pl-4` → `ps-4` has exactly one correct answer and no effect
 * left-to-right, so applying it unasked is safe. Everything else this
 * engine reports is either a judgement call — is that glow lighting or
 * layout? does that drag have a keyboard route? — or a fix with more than
 * one shape, like an infinite animation that wants stopping if it is
 * decorative and slowing if it is status. Guessing at those and writing the
 * guess into someone's working tree is how an automatic fixer earns a
 * reputation it never loses.
 *
 * @param {{ path: string, source: string }} file
 * @returns {{ source: string, rewrites: { from: string, to: string, line: number }[] }}
 */
export function fixSource({ path, source }) {
  if (!REVIEWABLE.test(path)) return { source, rewrites: [] }
  return fixSpacing(source)
}

/** Findings that should fail a run, as opposed to ones that ask a question. */
export function violations(findings) {
  return findings.filter((f) => f.severity === 'violation')
}

/**
 * A one-line summary of what was looked at, for a reporter to print.
 *
 * Deliberately states the coverage as a count of rules and criteria rather
 * than as a verdict. "Checked against 18 rules over 10 criteria" is a fact;
 * "accessible" is a claim this method cannot support.
 */
export function coverage() {
  const criteria = new Set(RULES.map((r) => r.sc))
  return {
    rules: RULES.length,
    criteria: criteria.size,
    standard: `WCAG ${STANDARD.wcag} Level ${STANDARD.level}`,
    unchecked: UNCHECKED.length,
  }
}
