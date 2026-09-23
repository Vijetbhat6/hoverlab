/**
 * Rendering an audit report for the three places it gets read.
 *
 * A TERMINAL: findings grouped by severity, each with what was measured,
 * where, and what to reach for; the inferred scale beside them, so the drift
 * findings can be judged against what the site actually does; and a score
 * line at the bottom.
 *
 * A PULL-REQUEST COMMENT (`--format markdown`): the same content behind its
 * own hidden marker, deterministic byte for byte, so a poster can find and
 * edit it in place.
 *
 * A MACHINE (`--json`): the report object itself, with the coverage block
 * and the list of what was never looked at, because a list of findings that
 * says nothing about coverage reads as full coverage.
 */

import { escapeMarkdown, wrap } from '../review/report.mjs'
import { describeTarget } from './suggest.mjs'

/** The first line of every markdown report. Not the review comment's marker, so the two never overwrite each other. */
export const AUDIT_MARKER = '<!-- hoverlab-audit-url -->'

/** Findings shown per rule before "and N more". The JSON always has all of them. */
const PER_RULE = 6

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const px = (n) => `${Number(n.toFixed(2))}px`

function fixLines(finding) {
  return finding.suggestions.map((target) => ({
    text: target.ref ?? describeTarget(target),
    why: target.why,
  }))
}

/** What the run looked at, in one sentence. */
function scopeLine(report) {
  const { viewport, dir, dark } = report.options
  const parts = [
    `${viewport.width}x${viewport.height}`,
    dark ? 'dark' : 'light',
    dir === 'rtl' ? 'left-to-right and right-to-left' : 'left-to-right',
  ]
  return parts.join(' · ')
}

function scaleLines(scales) {
  const lines = []
  const s = scales.spacing
  if (s) {
    lines.push(
      s.grid
        ? `spacing  ${s.grid}px grid (${Math.round(s.share * 100)}% of ${s.total} values${s.share < 0.8 ? `, ${Math.round(s.halfStepShare * 100)}% on the 2px half-grid` : ''})${s.steps.length ? `; steps ${s.steps.join(' ')}` : ''}`
        : `spacing  none inferred (${s.reason})`,
    )
  }
  if (scales.radius) {
    lines.push(
      scales.radius.values.length
        ? `radius   ${scales.radius.values.map(px).join(' ')} dominate`
        : `radius   none inferred (${scales.radius.reason ?? 'no dominant values'})`,
    )
  }
  if (scales.font) {
    lines.push(
      scales.font.values.length
        ? `type     ${scales.font.values.map(px).join(' ')} dominate`
        : `type     none inferred (${scales.font.reason ?? 'no dominant values'})`,
    )
  }
  if (scales.color) {
    lines.push(
      `colour   ${scales.color.distinct} distinct (${scales.color.greys} greys, ${scales.color.translucent} translucent); most used ` +
        scales.color.top.slice(0, 5).map((c) => `${c.hex} x${c.count}`).join(', '),
    )
  }
  if (scales.shadow) lines.push(`shadow   ${scales.shadow.distinct === 0 ? 'none used' : `${scales.shadow.distinct} distinct`}`)
  return lines
}

function coverageSentence(report) {
  const c = report.coverage
  const skipped = c.textSkipped
  const skippedTotal = Object.values(skipped).reduce((n, v) => n + v, 0)
  const axe = c.axe.ran
    ? `axe-core ${c.axe.version ?? ''} merged (${c.axe.confirmed} confirmed, ${c.axe.additional} additional, ${c.axe.undecided} flagged here that axe could not decide).`
    : `axe-core not used: ${c.axe.reason ?? 'not installed (optional)'}.`
  return (
    `Measured ${c.elements} elements and the contrast of ${c.textMeasured} text ${c.textMeasured === 1 ? 'node' : 'nodes'}` +
    `${skippedTotal ? ` (${skippedTotal} skipped: ${skipped.image} over images or gradients, ${skipped.disabled} disabled, ${skipped.invisible + skipped.transparent + skipped.svg} hidden or not painted with a colour)` : ''}. ` +
    (c.rtlElementsCompared !== null ? `${c.rtlElementsCompared} elements compared between the two directions. ` : '') +
    axe
  )
}

/**
 * The human report.
 *
 * @param {object} report
 * @param {{ bold: Function, dim: Function, green: Function, yellow: Function, cyan?: Function, width?: number }} style
 */
export function renderTerminal(report, style) {
  const { bold, dim, green, yellow } = style
  const width = Math.min(style.width ?? 80, 100)
  const lines = []
  const many = report.pages.length > 1

  lines.push(bold('Hoverlab URL audit'))
  lines.push(`${report.target}  ${dim(scopeLine(report))}`)
  for (const page of report.pages) {
    lines.push(
      dim(
        `  ${page.path}  ${page.error ? `not audited: ${page.error}` : `${page.elements} elements${page.truncated ? ' (truncated)' : ''}${page.title ? `  "${page.title.slice(0, 50)}"` : ''}`}`,
      ),
    )
  }
  for (const skip of report.skippedPages) lines.push(dim(`  skipped ${skip.input}: ${skip.reason}`))

  const groups = [
    ['violation', 'Violations', yellow],
    ['advisory', 'Advisories', dim],
  ]

  for (const [severity, title, tint] of groups) {
    const list = report.findings.filter((f) => f.severity === severity)
    if (list.length === 0) continue
    lines.push('')
    lines.push(bold(`${title} (${list.length})`))

    let index = 0
    while (index < list.length) {
      const rule = list[index].rule
      const run = []
      while (index < list.length && list[index].rule === rule) run.push(list[index++])

      for (const finding of run.slice(0, PER_RULE)) {
        const glyph = severity === 'violation' ? '✗' : '·'
        const head = `${tint(glyph)} ${dim(finding.rule)} `
        const plainHead = `${glyph} ${finding.rule} `
        const body = finding.sc ? `${finding.message} (WCAG ${finding.sc})` : finding.message
        const wrapped = wrap(body, width - 4 - plainHead.length, '').split('\n')
        lines.push(`  ${head}${wrapped[0]}`)
        for (const rest of wrapped.slice(1)) lines.push(`  ${' '.repeat(plainHead.length)}${rest}`)
        for (const example of finding.examples.slice(0, 3)) {
          const where = many ? `  ${example.page}` : ''
          lines.push(dim(wrap(`e.g. ${example.selector}${example.detail ? ` [${example.detail}]` : ''}${where}`, width - 6, '      ')))
        }
      }
      if (run.length > PER_RULE) lines.push(dim(`      …and ${run.length - PER_RULE} more ${rule} (all of them are in --json)`))

      const fixes = fixLines(run[0])
      if (fixes.length) {
        lines.push(dim(wrap(`fix: ${fixes.map((f) => f.text).join('  ·  ')}`, width - 6, '      ')))
      }
    }
  }

  if (report.findings.length === 0) {
    lines.push('')
    lines.push(green('No contrast failures, drift or right-to-left breakage found on what was measured.'))
  }

  const scaleBlock = scaleLines(report.scales)
  if (scaleBlock.length) {
    lines.push('')
    lines.push(bold('Inferred from what the page renders'))
    for (const line of scaleBlock) lines.push(dim(`  ${line}`))
  }

  const { score, violations, advisories } = report.summary
  lines.push('')
  lines.push(
    `${bold(`Score ${score}/100`)}  ${violations === 0 ? green('0 violations') : yellow(plural(violations, 'violation'))}, ${plural(advisories, 'advisory', 'advisories')}.` +
      dim(' Advisories are for a person to judge and never fail a run.'),
  )
  lines.push(dim(wrap(coverageSentence(report), width, '')))
  lines.push(
    dim(
      wrap(
        `Not evaluated: ${report.coverage.notChecked.join('; ')}. This is evidence about one rendering, not a claim of conformance.`,
        width,
        '',
      ),
    ),
  )

  return lines.join('\n')
}

/** Markdown for a pull-request comment. */
export function renderMarkdown(report) {
  const violations = report.findings.filter((f) => f.severity === 'violation')
  const advisories = report.findings.filter((f) => f.severity !== 'violation')
  const lines = [AUDIT_MARKER, '## Hoverlab URL audit', '']
  lines.push(`\`${report.target}\` · ${scopeLine(report)} · ${plural(report.pages.length, 'page')}`, '')

  if (report.findings.length === 0) {
    lines.push('**No contrast failures, drift or right-to-left breakage found** on what was measured.')
  } else if (violations.length === 0) {
    lines.push(`**No violations.** ${plural(advisories.length, 'advisory', 'advisories')} for a human to judge; they never fail the check.`)
  } else {
    lines.push(
      `**${plural(violations.length, 'violation')}**` +
        (advisories.length ? ` and ${plural(advisories.length, 'advisory', 'advisories')}` : '') +
        '. Violations fail the check.',
    )
  }
  lines.push('', `**Score ${report.summary.score}/100**`)

  const list = (items) => {
    const out = []
    for (const finding of items) {
      out.push(`- **${finding.rule}**${finding.sc ? ` (WCAG ${finding.sc})` : ''} — ${escapeMarkdown(finding.message)}`)
      for (const example of finding.examples.slice(0, 2)) {
        out.push(`  - \`${example.selector.replace(/`/g, "'")}\` (${example.page})${example.detail ? ` — ${escapeMarkdown(example.detail)}` : ''}`)
      }
      const fixes = fixLines(finding)
      if (fixes.length) out.push(`  - Fix: ${fixes.map((f) => `\`${f.text}\``).join(', ')}`)
    }
    return out
  }

  if (violations.length) lines.push('', '### Violations', '', ...list(violations.slice(0, 30)))
  if (advisories.length) {
    lines.push(
      '',
      '<details>',
      `<summary>${plural(advisories.length, 'advisory', 'advisories')}</summary>`,
      '',
      ...list(advisories.slice(0, 30)),
      '',
      '</details>',
    )
  }

  const scaleBlock = scaleLines(report.scales)
  if (scaleBlock.length) {
    lines.push('', '<details>', '<summary>Inferred from what the page renders</summary>', '', ...scaleBlock.map((l) => `- ${escapeMarkdown(l)}`), '', '</details>')
  }

  lines.push('', `<sub>${escapeMarkdown(coverageSentence(report))} Not evaluated: ${escapeMarkdown(report.coverage.notChecked.join('; '))}. Runs on the runner; the page is loaded in a local browser and nothing is uploaded.</sub>`)
  return lines.join('\n')
}

/** The machine shape: the report itself. */
export function renderJson(report) {
  return JSON.stringify(report, null, 2)
}
