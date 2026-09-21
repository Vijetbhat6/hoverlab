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

/** The first line of every markdown report; the sticky-comment poster finds its comment by it. */
export const MARKDOWN_MARKER = '<!-- hoverlab-review -->'

/** How many findings a comment lists before it stops and says so. */
const MARKDOWN_LIMITS = { violation: 40, advisory: 20 }

/**
 * Escape prose for GitHub-flavoured markdown.
 *
 * Findings quote source. A message ending `: <button class="…">` is raw
 * HTML to a markdown renderer, which swallows the tag and leaves a comment
 * that says "unnamed control:" and nothing after it — the one part that
 * tells the reader which control. So markup characters are escaped, and
 * backtick spans the rules already write are kept as code rather than
 * escaped into visible backticks.
 */
export function escapeMarkdown(text) {
  return String(text)
    .split(/(`[^`\n]+`)/)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/[\\<>&*_[\]|]/g, (char) =>
            char === '<' ? '&lt;' : char === '>' ? '&gt;' : char === '&' ? '&amp;' : `\\${char}`,
          ),
    )
    .join('')
}

/**
 * A finding's message, with the quoted tag put in a code span.
 *
 * The a11y rules end a message with `: <tag …>` — the first 80 characters
 * of the offending tag. That suffix is source, not prose, so it goes in
 * code; a code span also survives the class names inside it (`[&>svg]:size-4`,
 * `*:p-2`) that escaping would otherwise litter with backslashes.
 */
function messageMarkdown(message) {
  const suffix = message.lastIndexOf(': <')
  if (suffix === -1) return escapeMarkdown(message)
  const tag = message.slice(suffix + 2).replace(/`/g, "'")
  return `${escapeMarkdown(message.slice(0, suffix))}: \`${tag}\``
}

/**
 * The report as a pull-request comment.
 *
 * WHY ITS OWN RENDERER
 *
 * The terminal report is laid out for 80 columns and colour, and the
 * annotation format vanishes once a check is re-run. A pull request wants
 * something else: one comment, updated in place on every push, that says at
 * the top whether the change is safe to merge and lists what is wrong
 * underneath. It is also the only surface where the reader cannot re-run
 * anything, so it says what was reviewed and what was never looked at.
 *
 * THE MARKER
 *
 * The first line is a hidden HTML comment. It is how the poster finds its
 * own previous comment to edit rather than adding a new one per push, and
 * it is on the first line so that "starts with the marker" is a check a
 * human comment that merely quotes it will not pass.
 *
 * THERE IS NO TIMESTAMP AND NO COMMIT SHA
 *
 * Two runs over the same findings must produce the same bytes, so the
 * poster can see nothing changed and skip the write. A comment that
 * carried a sha would be edited on every push even when the review was
 * identical, which is noise the reader learns to ignore.
 *
 * @param {object[]} findings
 * @param {object} [options]
 * @param {string} [options.scope]     what was reviewed, in words
 * @param {number} [options.fileCount] files that were read
 * @param {string} [options.blobBase]  `https://github.com/o/r/blob/<sha>`; makes locations links
 */
export function renderMarkdown(findings, options = {}) {
  const { scope = 'this change', fileCount, blobBase } = options
  const violations = findings.filter((f) => f.severity === 'violation')
  const advisories = findings.filter((f) => f.severity !== 'violation')
  const seen = coverage()
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

  const lines = [MARKDOWN_MARKER, '## Hoverlab design review', '']

  const reviewed =
    fileCount === undefined ? '' : ` (${plural(fileCount, 'file', 'files')} read)`

  if (findings.length === 0) {
    lines.push(
      fileCount === 0
        ? `Nothing to review in ${scope}: no component files changed.`
        : `**No design defects found** in ${scope}${reviewed}.`,
    )
  } else if (violations.length === 0) {
    lines.push(
      `**No violations.** ${plural(advisories.length, 'advisory', 'advisories')} ` +
        `for a human to look at in ${scope}${reviewed} — questions, not defects, and they never fail the check.`,
    )
  } else {
    lines.push(
      `**${plural(violations.length, 'violation', 'violations')}**` +
        (advisories.length ? ` and ${plural(advisories.length, 'advisory', 'advisories')}` : '') +
        ` in ${scope}${reviewed}. Violations fail the check.`,
    )
  }

  const location = (finding) => {
    const at = finding.line === undefined ? finding.file : `${finding.file}:${finding.line}`
    if (!blobBase) return `\`${at}\``
    const anchor = finding.line === undefined ? '' : `#L${finding.line}`
    return `[\`${at}\`](${blobBase}/${finding.file.split('/').map(encodeURIComponent).join('/')}${anchor})`
  }

  const list = (items, limit) => {
    const out = []
    for (const [, inFile] of group(items.slice(0, limit))) {
      for (const finding of inFile) {
        out.push(
          `- ${location(finding)} · **${finding.rule}**` +
            `${finding.sc ? ` (WCAG ${finding.sc})` : ''} — ${messageMarkdown(finding.message)}`,
        )
        if (finding.fix) out.push(`  - Fix: ${escapeMarkdown(finding.fix)}`)
      }
    }
    if (items.length > limit) {
      out.push(
        `- …and ${items.length - limit} more. Run \`npx hoverlab review\` locally for the full list.`,
      )
    }
    return out
  }

  if (violations.length) {
    lines.push('', '### Violations', '', ...list(violations, MARKDOWN_LIMITS.violation))
  }

  if (advisories.length) {
    lines.push(
      '',
      '<details>',
      `<summary>${plural(advisories.length, 'advisory', 'advisories')} — questions the rules cannot close from source</summary>`,
      '',
      ...list(advisories, MARKDOWN_LIMITS.advisory),
      '',
      '</details>',
    )
  }

  lines.push(
    '',
    `<sub>Checked against ${seen.rules} rules over ${seen.criteria} ${seen.standard} criteria ` +
      `decidable from source. ${seen.unchecked} criteria are not evaluated here — contrast, focus order, ` +
      `reflow and reading order depend on the page the component sits in. This is evidence, not a ` +
      `claim of conformance. Runs on the runner; nothing is uploaded.</sub>`,
  )

  return lines.join('\n')
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
