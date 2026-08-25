/**
 * Static WCAG 2.1 AA audit over the block and page catalogs.
 *
 *   npm run audit:a11y            # report, exit 1 on any finding
 *   npm run audit:a11y -- --json  # write the per-artifact report
 *
 * WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT
 *
 * This produces evidence. It does not produce a conformance claim, and the
 * distinction is the reason this file is written the way it is.
 *
 * A WCAG conformance statement — "this component conforms to WCAG 2.1 Level
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
import { dirname, join } from 'node:path'
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

interface SourceFile {
  path: string
  lang: string
  source: string
}

/** One thing the audit looked for, and the SC it maps to. */
interface Rule {
  id: string
  /** WCAG success criterion, e.g. "1.1.1". */
  sc: string
  level: 'A' | 'AA'
  name: string
  /**
   * Whether tripping this rule means the criterion is failed, or only that
   * the pattern is worth a human's attention.
   *
   * The distinction is load-bearing, not decorative. `aria-expanded` with no
   * `aria-controls` is the ARIA authoring practice and it is NOT a 4.1.2
   * failure — `aria-expanded` already conveys the state, `aria-controls` is
   * optional in the spec, and NVDA and VoiceOver largely ignore it anyway.
   * Reporting it as a failure would put eight untrue failures into a
   * document whose entire value is being true.
   *
   * Only `violation` fails the build. An advisory is a queue for a human.
   */
  severity: 'violation' | 'advisory'
  /** Returns one message per finding in this file. */
  check: (source: string) => string[]
}

/** Success criteria this audit does not and cannot evaluate. */
export const UNCHECKED: { sc: string; name: string; why: string }[] = [
  {
    sc: '1.4.3 / 1.4.11',
    name: 'Contrast (minimum, non-text)',
    why: 'Artifacts are styled with CSS variables the consuming project supplies. Whether a block passes depends on a palette we do not control.',
  },
  {
    sc: '1.3.2',
    name: 'Meaningful sequence',
    why: 'Needs rendered reading order, not source order.',
  },
  { sc: '2.4.3', name: 'Focus order', why: 'Needs a rendered tab sequence.' },
  { sc: '1.4.10', name: 'Reflow', why: 'Needs a viewport at 320 CSS pixels.' },
  {
    sc: '2.5.3',
    name: 'Label in name',
    why: 'Needs the rendered visible label to compare against the accessible name.',
  },
  {
    sc: '3.2.3 / 3.2.4',
    name: 'Consistent navigation and identification',
    why: 'A property of the whole consuming site, not of one artifact.',
  },
]

/** Strip comments so a rule cannot fire on prose about the rule. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
}

/**
 * Remove markup that is being encoded into a string, not rendered.
 *
 * A block with no network access that needs a sample image inlines one as
 * `data:image/svg+xml,` + `encodeURIComponent(\`<svg …>\`)`. That `<svg>`
 * is never an element: it is the src of an `<img>` that carries its own
 * `alt`, and the alt is where its accessible name correctly lives. Scanning
 * it as markup reports a missing `aria-hidden` on a tag that does not exist
 * in the DOM, and a false violation in an accessibility report is worse
 * than a missed one — it teaches the reader to skim the list.
 *
 * Scoped to `encodeURIComponent(...)` rather than to template literals in
 * general. A backtick string is normally a className and harmless either
 * way, but `dangerouslySetInnerHTML={{ __html: \`<svg …>\` }}` really does
 * render, and that one must stay visible to the audit.
 */
function stripEncodedMarkup(source: string): string {
  return source.replace(/encodeURIComponent\s*\(\s*`[^`]*`/g, ' ')
}

/** True when a tag's attribute text carries an accessible name. */
function hasAccessibleName(tag: string): boolean {
  return (
    /\baria-label\s*=/.test(tag) ||
    /\baria-labelledby\s*=/.test(tag) ||
    /\btitle\s*=/.test(tag)
  )
}

/**
 * Opening tags of one element type, as raw text.
 *
 * Scanned with a brace- and quote-aware walk rather than matched with
 * `<tag[^>]*>`, and the difference is not pedantry — it is the difference
 * between a report that is true and one that is not.
 *
 * JSX attribute values routinely contain `>`:
 *
 *   <input ref={(el) => { refs.current[i] = el }} aria-label="Digit 1" />
 *
 * A `[^>]*` scanner stops at the `>` inside the arrow, so the tag text it
 * hands a rule ends before `aria-label` — and the rule reports an unlabelled
 * input that is, in fact, labelled. That false finding is exactly the kind
 * of thing that makes a conformance claim wrong, which is why this is
 * written out properly rather than left as a regex with a comment
 * apologising for itself.
 *
 * Not a full JSX parser and does not need to be: it tracks brace depth and
 * string literals, which covers every form an attribute value takes in this
 * catalog. A tag it cannot resolve is dropped rather than guessed at.
 */
export function openingTags(source: string, tagName: string): string[] {
  const out: string[] = []
  const open = new RegExp(`<${tagName}(?=[\\s/>])`, 'g')

  for (const match of source.matchAll(open)) {
    const start = match.index!
    let depth = 0
    let quote: string | null = null

    for (let i = start; i < source.length; i++) {
      const ch = source[i]!

      if (quote) {
        if (ch === '\\') i++
        else if (ch === quote) quote = null
        continue
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) {
        out.push(source.slice(start, i + 1))
        break
      }
    }
  }

  return out
}

/** Every opening tag in a source, for rules that are not element-specific. */
function allTags(source: string): string[] {
  const names = new Set(
    [...source.matchAll(/<([a-zA-Z][\w.]*)(?=[\s/>])/g)].map((m) => m[1]!),
  )
  return [...names].flatMap((name) => openingTags(source, name))
}

const RULES: Rule[] = [
  {
    id: 'img-alt',
    sc: '1.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Non-text content',
    check: (source) =>
      openingTags(source, 'img')
        .filter((tag) => !/\balt\s*=/.test(tag))
        .map((tag) => `<img> with no alt: ${tag.slice(0, 80)}`),
  },
  {
    id: 'svg-hidden-or-labelled',
    sc: '1.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Decorative graphics hidden from assistive tech',
    check: (source) =>
      openingTags(source, 'svg')
        .filter((tag) => !/\baria-hidden/.test(tag) && !hasAccessibleName(tag) && !/\brole\s*=/.test(tag))
        .map((tag) => `<svg> neither aria-hidden nor named: ${tag.slice(0, 80)}`),
  },
  {
    id: 'switch-checked',
    sc: '4.1.2',
    level: 'A',
    severity: 'violation',
    name: 'Name, role, value',
    check: (source) =>
      allTags(source)
        .filter((tag) => /\brole\s*=\s*["'](switch|checkbox|radio)["']/.test(tag))
        .filter((tag) => !/\baria-checked/.test(tag))
        /*
          A native checkbox or radio exposes its state through the `checked`
          IDL property, which the accessibility tree reads directly — ARIA in
          HTML explicitly allows `<input type="checkbox" role="switch">` and
          requiring an `aria-checked` alongside it would be redundant at
          best and, if it ever disagreed with `checked`, wrong.

          Only a non-native element pretending to be a switch has to say so
          itself. Getting this wrong reported two correct components as
          failures, which is the whole reason severities exist below.
        */
        .filter((tag) => !/^<input\b/.test(tag) || !/\btype\s*=\s*["'](checkbox|radio)["']/.test(tag))
        .map((tag) => {
          const role = /role\s*=\s*["'](\w+)["']/.exec(tag)?.[1] ?? 'switch'
          return `role="${role}" with no aria-checked: ${tag.slice(0, 80)}`
        }),
  },
  {
    id: 'expanded-controls',
    sc: '4.1.2',
    level: 'A',
    severity: 'advisory',
    name: 'Disclosure state exposed',
    check: (source) =>
      allTags(source)
        .filter((tag) => /\baria-expanded/.test(tag))
        // An `id` on the trigger does not satisfy this. aria-controls points
        // AT the disclosed region; an id merely identifies the button. An
        // earlier draft accepted either and so passed every real violation.
        .filter((tag) => !/\baria-controls/.test(tag))
        .map((tag) => `aria-expanded with no aria-controls: ${tag.slice(0, 80)}`),
  },
  {
    id: 'click-handler-on-non-interactive',
    sc: '2.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Keyboard',
    check: (source) =>
      ['div', 'span', 'li', 'td', 'tr', 'p'].flatMap((name) =>
        openingTags(source, name)
          .filter((tag) => /\bonClick/.test(tag))
          /*
            An `aria-hidden` element is not in the accessibility tree, so it
            carries no keyboard obligation of its own — the modal-backdrop
            pattern, where clicking dismisses and Escape is the keyboard
            route. The dismissal still has to be reachable some other way,
            which is a thing this audit cannot see; the report says so.
          */
          .filter((tag) => !/\baria-hidden/.test(tag))
          .filter((tag) => !(/\brole\s*=/.test(tag) && /\bonKeyDown|\btabIndex/.test(tag)))
          .map(
            (tag) =>
              `<${name}> with onClick but no role + tabIndex + key handler: ${tag.slice(0, 80)}`,
          ),
      ),
  },
  {
    id: 'positive-tabindex',
    sc: '2.4.3',
    level: 'A',
    severity: 'violation',
    name: 'No positive tabindex',
    check: (source) =>
      [...source.matchAll(/tabIndex\s*=\s*\{?\s*([1-9]\d*)/g)].map(
        (m) => `tabIndex={${m[1]}} overrides document order`,
      ),
  },
  {
    id: 'table-headers',
    sc: '1.3.1',
    level: 'A',
    severity: 'violation',
    name: 'Info and relationships',
    check: (source) => {
      if (!/<table[\s>]/.test(source)) return []
      const findings: string[] = []
      if (!/<th[\s>]/.test(source)) findings.push('<table> with no <th> header cells')
      else if (!/<th[^>]*\bscope\s*=/.test(source)) {
        findings.push('<th> cells with no scope attribute')
      }
      return findings
    },
  },
  {
    id: 'input-labelled',
    sc: '3.3.2',
    level: 'A',
    severity: 'violation',
    name: 'Labels or instructions',
    check: (source) => {
      const labelled = /<label[\s>]/.test(source)
      return openingTags(source, 'input')
        .filter((tag) => !/\btype\s*=\s*["'](hidden|submit|button)["']/.test(tag))
        .filter((tag) => !hasAccessibleName(tag) && !/\bid\s*=/.test(tag) && !labelled)
        .map((tag) => `<input> with no label, id or aria-label: ${tag.slice(0, 80)}`)
    },
  },
  /*
    There is deliberately no `autoFocus` rule.

    An earlier draft flagged it as 3.2.1 On Focus, which it is not: 3.2.1 is
    about a change of context triggered BY focus, and moving initial focus
    into a dialog is not merely permitted, it is what users of that dialog
    need. The rule reported the command palette, the two-factor form and the
    password-reset form — three components doing the right thing.

    Recorded here rather than silently dropped, because the failure mode it
    demonstrates is the one this whole file is written against: a rule that
    is nearly right produces confident, specific, wrong findings, and a
    conformance report is worth exactly what its least accurate rule is
    worth.
  */
]

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
  }

  console.log(
    `audit-a11y: ${blockReports.length} blocks and ${pageReports.length} pages ` +
      `against ${RULES.length} statically ` +
      `decidable criteria — ${violations.length} violation` +
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

main()
