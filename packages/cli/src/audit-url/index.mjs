/**
 * `hoverlab audit-url`: the design-drift audit for a DEPLOYED page.
 *
 * `hoverlab review` reads source diffs, and everything it can say stops where
 * a rendered value begins: a colour that only becomes a contrast ratio once
 * the background is resolved, a spacing that is only "13px" after the cascade
 * has run, a layout that only breaks when the direction flips. This module
 * loads the real page in a real browser and answers those.
 *
 * SHAPE
 *
 *   browser.mjs    load the page, run measure.mjs inside it (the only impure file)
 *   measure.mjs    the one in-page function: records, no interpretation
 *   contrast.mjs   WCAG contrast from the records
 *   tokens.mjs     infer the site's own scale, report drift from it
 *   rtl-audit.mjs  compare the left-to-right and right-to-left measurements
 *   suggest.mjs    static finding-to-catalog table
 *   report.mjs     terminal, markdown and JSON renderings, and the score
 *
 * `runAudit` is the orchestration and is the only function the command needs.
 * Its findings are deterministic in order and content for a given page state:
 * no timestamps, no random ids, no network beyond the page itself.
 */

import { formatRatio } from './color.mjs'
import { analyzeContrast } from './contrast.mjs'
import { AuditSetupError, capturePage, findAxeSource, launchBrowser, loadPlaywright } from './browser.mjs'
import { hasBox, inFixedSubtree, isHiddenSubtree, quote, selectorFor } from './dom.mjs'
import { analyzeRtl } from './rtl-audit.mjs'
import { describeTarget, suggestionsFor } from './suggest.mjs'
import { collectUsage, emptyUsage, inferTokens, mergeUsage } from './tokens.mjs'

export { AuditSetupError }

/** Most extra paths `--pages` will take. Every path is a page load, two with `--dir rtl`. */
export const MAX_EXTRA_PAGES = 10

export const VIEWPORT_PRESETS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
}

/** What this audit cannot see, stated with every report so a clean run is not read as full coverage. */
export const NOT_CHECKED = [
  'text over background images, gradients or a sibling element (the colour underneath is not one value)',
  'placeholder text, pseudo-elements and text inside SVG',
  'hover, focus, active and disabled states, and anything behind a click or a login',
  'content below the fold that only loads on scroll',
  'bidirectional text order and real Arabic or Hebrew copy (the direction is swapped, the language is not)',
  'pages other than the ones named',
]

/** An error about the URL or arguments, not the environment. Exit code 2 as well. */
export class AuditInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuditInputError'
  }
}

/** `390x844`, or `mobile` / `tablet` / `desktop`. */
export function parseViewport(value) {
  if (value === undefined || value === true) return { ...VIEWPORT_PRESETS.desktop }
  const text = String(value).toLowerCase().trim()
  if (VIEWPORT_PRESETS[text]) return { ...VIEWPORT_PRESETS[text] }
  const match = /^(\d{3,4})\s*[x×]\s*(\d{3,4})$/.exec(text)
  if (!match) {
    throw new AuditInputError(
      `Unrecognised --viewport "${value}". Use WIDTHxHEIGHT (390x844) or one of: ${Object.keys(VIEWPORT_PRESETS).join(', ')}.`,
    )
  }
  const width = Number(match[1])
  const height = Number(match[2])
  if (width < 240 || width > 3840 || height < 240 || height > 3840) {
    throw new AuditInputError('--viewport must be between 240 and 3840 pixels on each side.')
  }
  return { width, height }
}

/** Only http and https are audited. `file:` and `javascript:` are not sites. */
export function parseTarget(value) {
  const text = String(value).trim()
  // A bare host like `localhost:3000/pricing` is what people type, and
  // `new URL` would read its "localhost:" as a scheme. Only an explicit
  // `scheme://`, or one of the well-known non-web schemes, is left alone.
  const explicit = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) || /^(javascript|data|mailto|about|blob|file):/i.test(text)
  let url
  try {
    url = new URL(explicit ? text : `http://${text}`)
  } catch {
    throw new AuditInputError(`"${value}" is not a URL. Try: hoverlab audit-url https://example.com`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AuditInputError(`Only http and https URLs can be audited, got ${url.protocol}`)
  }
  url.hash = ''
  return url
}

/**
 * Turn `--pages a,b,c` into same-origin URLs.
 *
 * Same-origin only, and that is a safety property and not a convenience:
 * the flag takes text from a command line that is often assembled by a
 * script, and this is a tool that loads what it is given. It will not be
 * pointed at a different host through it.
 *
 * @returns {{ urls: URL[], skipped: { input: string, reason: string }[] }}
 */
export function resolvePages(base, list) {
  const urls = []
  const skipped = []
  const seen = new Set([base.href])
  const inputs = String(list ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const input of inputs) {
    let url
    try {
      url = new URL(input, base.origin)
    } catch {
      skipped.push({ input, reason: 'not a path or URL' })
      continue
    }
    if (url.origin !== base.origin) {
      skipped.push({ input, reason: `different origin (${url.origin}); only ${base.origin} is audited` })
      continue
    }
    url.hash = ''
    if (seen.has(url.href)) continue
    if (urls.length >= MAX_EXTRA_PAGES) {
      skipped.push({ input, reason: `over the limit of ${MAX_EXTRA_PAGES} extra pages` })
      continue
    }
    seen.add(url.href)
    urls.push(url)
  }
  return { urls, skipped }
}

const pathOf = (url) => `${url.pathname}${url.search}` || '/'

/* ── findings ─────────────────────────────────────────────────────────── */

export const RULE_ORDER = [
  'page-overflow',
  'contrast',
  'contrast-axe',
  'rtl-page-scroll',
  'rtl-overflow',
  'rtl-clipped-text',
  'rtl-clipped',
  'rtl-not-mirrored',
  'rtl-icon-not-mirrored',
  'rtl-text-align',
  'spacing-off-grid',
  'radius-drift',
  'type-drift',
  'color-near-duplicate',
  'grey-sprawl',
  'shadow-drift',
]

/** Violations first, then by rule, then by how many, then by key, so two runs order identically. */
export function sortFindings(findings) {
  const rank = (rule) => {
    const at = RULE_ORDER.indexOf(rule)
    return at === -1 ? RULE_ORDER.length : at
  }
  return [...findings].sort(
    (a, b) =>
      (a.severity === 'violation' ? 0 : 1) - (b.severity === 'violation' ? 0 : 1) ||
      rank(a.rule) - rank(b.rule) ||
      b.count - a.count ||
      String(a.key).localeCompare(String(b.key)),
  )
}

/**
 * A 0-100 score, from the findings and nothing else.
 *
 * Each violation costs 10, capped at 70 in total; each advisory costs 2,
 * capped at 20. The caps are the point: a page with forty near-duplicate
 * greys and no violation should read as "untidy", not as "broken", and a
 * page with a real contrast failure should never score above 90 because the
 * rest of it is tidy. It is a summary for a glance, not a measurement, and
 * the formula is printed in the JSON so nobody has to reverse-engineer it.
 */
export function scoreFindings(findings) {
  const violations = findings.filter((f) => f.severity === 'violation').length
  const advisories = findings.length - violations
  const penalty = Math.min(70, violations * 10) + Math.min(20, advisories * 2)
  return {
    score: 100 - penalty,
    violations,
    advisories,
    formula: 'score = 100 - min(70, 10 x violations) - min(20, 2 x advisories)',
  }
}

/** A page that scrolls sideways at this viewport, with the elements that cause it. */
function analyzeOverflow(elements, page, where) {
  if (page.scrollW <= page.clientW + 1) return []
  const culprits = []
  for (const record of elements) {
    if (record.tag === 'html' || record.tag === 'body') continue
    if (!hasBox(record, 4) || isHiddenSubtree(elements, record.i) || inFixedSubtree(elements, record.i)) continue
    if (!(record.text > 0 || ['img', 'svg', 'video', 'canvas', 'input', 'button', 'select', 'textarea'].includes(record.tag))) continue
    // Not clipped by a scroller or an overflow:hidden ancestor.
    let clipped = false
    for (let j = record.p; j >= 0; j = elements[j].p) {
      const a = elements[j]
      if (a.tag !== 'html' && a.tag !== 'body' && a.ox !== 'visible') {
        clipped = true
        break
      }
    }
    if (clipped) continue
    const over = record.r[0] + record.r[2] - page.clientW
    if (over > 1) culprits.push({ record, over: Math.round(over) })
  }
  culprits.sort((a, b) => b.over - a.over || a.record.i - b.record.i)
  return [
    {
      rule: 'page-overflow',
      family: 'layout',
      severity: 'violation',
      key: `page-overflow:${where.page}`,
      message:
        `The page scrolls sideways at ${page.clientW}px wide: content is ${page.scrollW}px. ` +
        (culprits.length
          ? `${culprits.length} visible ${culprits.length === 1 ? 'element reaches' : 'elements reach'} past the right edge, by up to ${culprits[0].over}px.`
          : 'No single visible text or media element accounts for it; look for an oversized decorative box.'),
      count: Math.max(1, culprits.length),
      examples: (culprits.length ? culprits.slice(0, 4) : [{ record: elements[0], over: page.scrollW - page.clientW }]).map(
        ({ record, over }) => ({
          page: where.page,
          selector: record.i === 0 ? 'document' : selectorFor(elements, record.i) + quote(record),
          detail: `${over}px past the viewport`,
        }),
      ),
      data: { scrollWidth: page.scrollW, clientWidth: page.clientW },
    },
  ]
}

/**
 * Run the audit.
 *
 * @param {object} options
 * @param {string} options.url
 * @param {{ width: number, height: number }} [options.viewport]
 * @param {boolean} [options.rtl]      also measure with dir=rtl
 * @param {boolean} [options.dark]     emulate prefers-color-scheme: dark
 * @param {string} [options.pages]     comma-separated extra same-origin paths
 * @param {number} [options.wait]      settle time after load, ms
 * @param {number} [options.timeout]   navigation timeout, ms
 * @param {boolean} [options.axe]      merge axe-core's contrast results when it can be found
 * @param {string} [options.cwd]
 * @param {{ chromium: any }} [deps]   injected driver, for tests
 */
export async function runAudit(options, deps = {}) {
  const base = parseTarget(options.url)
  const viewport = options.viewport ?? { ...VIEWPORT_PRESETS.desktop }
  const rtl = options.rtl === true
  const dark = options.dark === true
  const wait = options.wait ?? 400
  const timeout = options.timeout ?? 30000
  const cwd = options.cwd ?? process.cwd()
  const { urls: extra, skipped } = resolvePages(base, options.pages)
  const targets = [base, ...extra]

  const playwright = deps.chromium ? { chromium: deps.chromium } : await loadPlaywright({ cwd })
  const axeSource = options.axe === false ? null : findAxeSource(cwd)
  const browser = await launchBrowser(playwright.chromium)

  const usage = emptyUsage()
  const contrastGroups = new Map()
  const findings = []
  const pages = []
  const skips = { image: 0, svg: 0, disabled: 0, invisible: 0, transparent: 0 }
  const axeSummary = { ran: axeSource !== null, version: null, confirmed: 0, additional: 0, undecided: 0, reason: axeSource ? undefined : 'not installed (optional)' }
  const axeExtra = []
  let measuredText = 0
  let rtlCompared = 0

  try {
    for (const [order, url] of targets.entries()) {
      const where = { page: pathOf(url) }
      const entry = { path: where.page, url: url.href, status: 0, title: '', elements: 0, truncated: false }
      pages.push(entry)

      try {
        const ltr = await capturePage(browser, url.href, { viewport, dark, rtl: false, wait, timeout, axeSource })
        entry.status = ltr.status
        if (new URL(ltr.finalUrl).origin !== base.origin) {
          throw new AuditInputError(`redirected to a different origin (${new URL(ltr.finalUrl).origin}); not audited`)
        }
        if (ltr.status >= 400) throw new AuditInputError(`the server answered ${ltr.status}`)
        entry.title = ltr.page.title
        entry.elements = ltr.elements.length
        entry.truncated = ltr.page.truncated

        // contrast
        const contrast = analyzeContrast(ltr.elements, ltr.page, where)
        measuredText += contrast.measured
        for (const key of Object.keys(skips)) skips[key] += contrast.skipped[key]
        for (const group of contrast.groups.values()) {
          const into = contrastGroups.get(group.key)
          if (!into) contrastGroups.set(group.key, group)
          else {
            into.count += group.count
            for (const example of group.examples) if (into.examples.length < 5) into.examples.push(example)
          }
        }

        // axe, merged: nodes the built-in pass did not already flag
        if (ltr.axe) {
          if (ltr.axe.ran) {
            axeSummary.version = ltr.axe.version
            for (const at of ltr.axe.undecided ?? []) if (contrast.flagged.has(at)) axeSummary.undecided++
            for (const node of ltr.axe.nodes) {
              if (node.index >= 0 && contrast.flagged.has(node.index)) axeSummary.confirmed++
              else {
                axeSummary.additional++
                if (axeExtra.length < 5) {
                  axeExtra.push({
                    page: where.page,
                    selector: node.index >= 0 ? selectorFor(ltr.elements, node.index) + quote(ltr.elements[node.index]) : node.target,
                    detail: node.ratio ? `${node.ratio}:1 (${node.fg} on ${node.bg}, ${node.size})` : 'below threshold',
                  })
                }
              }
            }
          } else {
            axeSummary.ran = false
            axeSummary.reason = ltr.axe.reason
          }
        }

        // tokens and layout
        mergeUsage(usage, collectUsage(ltr.elements, where))
        findings.push(...analyzeOverflow(ltr.elements, ltr.page, where))

        // RTL
        if (rtl) {
          const flipped = await capturePage(browser, url.href, { viewport, dark, rtl: true, wait, timeout, axeSource: null })
          const result = analyzeRtl(ltr, flipped, where)
          rtlCompared += result.compared
          findings.push(...result.findings)
        }
      } catch (error) {
        entry.error = String(error?.message ?? error).split('\n')[0]
        // The page the user actually asked for failing is a failed audit; an extra path failing is a note.
        if (order === 0) {
          const wrapped = error instanceof AuditInputError ? error : new AuditSetupError(`Could not audit ${url.href}: ${entry.error}`)
          throw wrapped
        }
      }
    }
  } finally {
    await browser.close().catch(() => {})
  }

  // Contrast groups become findings.
  for (const group of contrastGroups.values()) {
    findings.push({
      rule: 'contrast',
      family: 'contrast',
      severity: 'violation',
      sc: '1.4.3',
      key: `contrast:${group.key}`,
      message:
        `${group.count} text ${group.count === 1 ? 'element' : 'elements'} ${group.fg} on ${group.bg} = ${formatRatio(group.ratio)}, ` +
        `needs ${group.needed}:1${group.large ? ' (large text)' : ''}.`,
      count: group.count,
      examples: group.examples.slice(0, 3),
      data: { fg: group.fg, bg: group.bg, ratio: Number(group.ratio.toFixed(3)), required: group.needed, large: group.large },
    })
  }
  if (axeSummary.additional > 0) {
    findings.push({
      rule: 'contrast-axe',
      family: 'contrast',
      severity: 'violation',
      sc: '1.4.3',
      key: 'contrast-axe',
      message:
        `axe-core reports ${axeSummary.additional} more low-contrast text ${axeSummary.additional === 1 ? 'node' : 'nodes'} than the built-in measurement found ` +
        `(it resolves some backgrounds the built-in pass skips as unknowable).`,
      count: axeSummary.additional,
      examples: axeExtra.slice(0, 3),
      data: { axeVersion: axeSummary.version },
    })
  }

  // Tokens.
  const tokens = inferTokens(usage)
  findings.push(...tokens.findings)

  const withSuggestions = sortFindings(findings).map((finding) => ({
    ...finding,
    suggestions: suggestionsFor(finding.rule).map((target) => ({ ...target, ref: describeTarget(target) })),
  }))
  const score = scoreFindings(withSuggestions)

  return {
    schema: 1,
    target: base.href,
    options: {
      viewport,
      dir: rtl ? 'rtl' : 'ltr',
      dark,
      pages: extra.map(pathOf),
      axe: axeSummary.ran,
    },
    pages,
    skippedPages: skipped,
    findings: withSuggestions,
    summary: score,
    scales: tokens.scales,
    coverage: {
      textMeasured: measuredText,
      textSkipped: skips,
      elements: usage.elements,
      rtlElementsCompared: rtl ? rtlCompared : null,
      fractionalSpacingIgnored: usage.fractional,
      axe: axeSummary,
      notChecked: NOT_CHECKED,
    },
  }
}
