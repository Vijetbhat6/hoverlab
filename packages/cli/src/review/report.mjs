/**
 * Rendering findings for the three places they get read.
 *
 * A TERMINAL, where someone is about to change the code. Grouped by file,
 * ordered by line, violations before advisories, with the fix indented
 * under the finding. The fix is the part people act on, so it is never
 * behind a flag.
 *
 * A CI LOG, where nobody is reading at all until something fails. The
 * GitHub format emits workflow commands, which the runner turns into
 * annotations on the diff itself — the finding appears on the line, in the
 * pull request, where the person who wrote it will see it.
 *
 * A MACHINE, via `--json`. The shape is the `Finding` typedef unchanged
 * plus the coverage block, because a consumer that gets passes without the
 * list of what was never checked will report the passes as coverage.
 */

import { coverage, UNCHECKED } from './index.mjs'

const SEVERITY_ORDER = { violation: 0, advisory: 1 }

/** Group findings by file, each group sorted the way a reader wants them. */
export function group(findings) {
  const byFile = new Map()
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, [])
    byFile.get(finding.file).push(finding)
  }

  for (const list of byFile.values()) {
    list.sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        (a.line ?? 0) - (b.line ?? 0),
    )
  }

  return [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b))
}

/** Wrap prose to a width, indented, so a fix does not run off the terminal. */
export function wrap(text, width, indent) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  for (const word of words) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)

  return lines.map((l) => indent + l).join('\n')
}

/**
 * Wrap with a hanging indent, so a continuation is visibly not a new
 * finding.
 *
 * The colour codes in `head` are zero-width on screen but not in
 * `String.length`, so the wrap is measured against the plain text and the
 * decorated head is put back afterwards. Measuring the escaped string
 * instead makes the first line of every coloured finding wrap short by
 * about nine characters, which looks like ragged output rather than the
 * bug it is.
 */
function wrapHanging(head, plainHead, body, width, indent) {
  const wrapped = wrap(body, width - plainHead.length - indent.length, '')
  const [first, ...rest] = wrapped.split('\n')
  const continuation = ' '.repeat(indent.length + plainHead.length)
  return [indent + head + first, ...rest.map((l) => continuation + l)].join('\n')
}

/**
 * The human report.
 *
 * @param {object[]} findings
 * @param {{ bold: Function, dim: Function, green: Function, yellow: Function, width?: number }} style
 */
export function renderTerminal(findings, style) {
  const { bold, dim, green, yellow } = style
  const width = Math.min(style.width ?? 80, 100)
  const lines = []

  for (const [file, list] of group(findings)) {
    lines.push('')
    lines.push(bold(file))

    for (const finding of list) {
      const at = finding.line === undefined ? '' : `:${finding.line}`
      const glyph = finding.severity === 'violation' ? '✗' : '·'
      const head = `${finding.severity === 'violation' ? yellow(glyph) : dim(glyph)}${dim(at)} `
      const body = finding.sc ? `${finding.message} (${finding.sc})` : finding.message

      lines.push(wrapHanging(head, `${glyph}${at} `, body, width, '  '))
      if (finding.fix) {
        lines.push(dim(wrap(finding.fix, width - 6, '      ')))
      }
    }
  }

  const violations = findings.filter((f) => f.severity === 'violation').length
  const advisories = findings.length - violations
  const seen = coverage()

  lines.push('')
  if (findings.length === 0) {
    lines.push(green('No design defects found.'))
  } else {
    lines.push(
      `${violations === 0 ? green('0 violations') : yellow(`${violations} violation${violations === 1 ? '' : 's'}`)}` +
        `, ${advisories} advisor${advisories === 1 ? 'y' : 'ies'}.` +
        dim(' Advisories are questions, not defects — they never fail a run.'),
    )
  }

  /*
    The coverage line is not decoration and it is not a boast. A report that
    lists what passed and stays silent about what was never looked at reads
    as full coverage, and that silence is the thing that misleads. So every
    run says how much of the standard this method can reach, and points at
    the list of what it cannot.
  */
  lines.push(
    dim(
      wrap(
        `Checked against ${seen.rules} rules over ${seen.criteria} ${seen.standard} criteria ` +
          `decidable from source. ${seen.unchecked} criteria are NOT evaluated here — ` +
          `contrast, focus order, reflow and reading order depend on the page you place ` +
          `this in, and are yours to verify in situ. This is evidence, not a claim of ` +
          `conformance; --json lists what was never looked at.`,
        width,
        '',
      ),
    ),
  )

  return lines.join('\n')
}

/**
 * GitHub Actions workflow commands.
 *
 * `::error` and `::warning` with a file and line are turned into
 * annotations on the changed lines of a pull request, which is the whole
 * point: the finding lands next to the code that caused it rather than in a
 * log nobody opens. Newlines have to be escaped as `%0A` or the runner
 * truncates the message at the first one, which silently drops every fix.
 */
export function renderGitHub(findings) {
  const escape = (text) =>
    text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')

  return findings
    .map((finding) => {
      const level = finding.severity === 'violation' ? 'error' : 'warning'
      const line = finding.line === undefined ? '' : `,line=${finding.line}`
      const title = `hoverlab/${finding.family}: ${finding.rule}`
      const body = finding.fix ? `${finding.message}\n\n${finding.fix}` : finding.message
      return `::${level} file=${finding.file}${line},title=${escape(title)}::${escape(body)}`
    })
    .join('\n')
}

/** The machine shape, carrying its own limits. */
export function renderJson(findings) {
  return JSON.stringify(
    {
      findings,
      summary: {
        violations: findings.filter((f) => f.severity === 'violation').length,
        advisories: findings.filter((f) => f.severity === 'advisory').length,
      },
      coverage: coverage(),
      unchecked: UNCHECKED,
    },
    null,
    2,
  )
}
