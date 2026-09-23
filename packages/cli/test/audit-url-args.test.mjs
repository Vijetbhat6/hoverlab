/**
 * Argument handling, ordering, scoring, the driver loader and the report
 * renderers: everything around the engine that can be checked without a
 * browser.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { INSTALL_HINT, AuditSetupError, loadPlaywright } from '../src/audit-url/browser.mjs'
import {
  AuditInputError,
  MAX_EXTRA_PAGES,
  parseTarget,
  parseViewport,
  resolvePages,
  scoreFindings,
  sortFindings,
} from '../src/audit-url/index.mjs'
import { AUDIT_MARKER, renderJson, renderMarkdown, renderTerminal } from '../src/audit-url/report.mjs'

/* ── arguments ── */

test('viewports: WxH, presets, and refusal of nonsense', () => {
  assert.deepEqual(parseViewport(undefined), { width: 1280, height: 800 })
  assert.deepEqual(parseViewport('390x844'), { width: 390, height: 844 })
  assert.deepEqual(parseViewport('Mobile'), { width: 390, height: 844 })
  assert.deepEqual(parseViewport('tablet'), { width: 768, height: 1024 })
  assert.throws(() => parseViewport('wide'), AuditInputError)
  assert.throws(() => parseViewport('10x10'), AuditInputError)
  assert.throws(() => parseViewport('99999x800'), AuditInputError)
})

test('targets: http and https only, bare hosts accepted, fragments dropped', () => {
  assert.equal(parseTarget('https://example.com/pricing#plans').href, 'https://example.com/pricing')
  assert.equal(parseTarget('localhost:3000/pricing').href, 'http://localhost:3000/pricing')
  assert.equal(parseTarget('127.0.0.1:8080').origin, 'http://127.0.0.1:8080')
  for (const bad of ['file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com', 'data:text/html,hi']) {
    assert.throws(() => parseTarget(bad), AuditInputError, bad)
  }
})

test('--pages: same origin only, deduplicated, capped at ten', () => {
  const base = new URL('http://a.test/start')
  const list = ['/one', '/one', 'https://evil.test/x', 'http://a.test/two#frag', 'http://a.test/start']
  for (let i = 0; i < 12; i++) list.push(`/p${i}`)
  const { urls, skipped } = resolvePages(base, list.join(','))

  assert.equal(urls.length, MAX_EXTRA_PAGES)
  assert.deepEqual(urls.slice(0, 2).map((u) => u.pathname), ['/one', '/two'])
  assert.ok(urls.every((u) => u.origin === base.origin))
  assert.ok(!urls.some((u) => u.href === base.href), 'the base page is not audited twice')
  assert.ok(skipped.some((s) => s.input === 'https://evil.test/x' && /different origin/.test(s.reason)))
  assert.equal(skipped.filter((s) => /over the limit/.test(s.reason)).length, 12 + 2 - MAX_EXTRA_PAGES)
  assert.deepEqual(resolvePages(base, undefined), { urls: [], skipped: [] })
})

/* ── the driver ── */

test('a missing driver is one clear line naming the install command', async () => {
  const load = async () => {
    throw new Error("Cannot find package 'playwright'")
  }
  await assert.rejects(loadPlaywright({ cwd: process.cwd(), load }), (error) => {
    assert.ok(error instanceof AuditSetupError)
    assert.equal(error.message, INSTALL_HINT)
    assert.ok(!error.message.includes('\n'), 'one line')
    assert.match(error.message, /npm i -D playwright/)
    assert.match(error.message, /npx playwright install chromium/)
    return true
  })
})

test('the loader accepts either package shape and prefers playwright over playwright-core', async () => {
  const seen = []
  const load = async (specifier) => {
    seen.push(specifier)
    if (/playwright-core/.test(specifier)) return { chromium: { from: 'core' } }
    if (/playwright/.test(specifier)) return { default: { chromium: { from: 'playwright' } } }
    throw new Error('unexpected')
  }
  const found = await loadPlaywright({ cwd: process.cwd(), load })
  assert.deepEqual(found.chromium, { from: 'playwright' })
  assert.equal(found.name, 'playwright')
})

/* ── ordering and score ── */

const finding = (rule, severity, count, key = rule) => ({ rule, severity, count, key, family: 'x', message: rule, examples: [], suggestions: [] })

test('findings order is violations first, then rule order, then count, whatever order they arrive in', () => {
  const input = [
    finding('spacing-off-grid', 'advisory', 1, 'spacing:13'),
    finding('rtl-overflow', 'violation', 2),
    finding('spacing-off-grid', 'advisory', 5, 'spacing:7'),
    finding('contrast', 'violation', 1),
    finding('type-drift', 'advisory', 1),
  ]
  const expected = ['contrast', 'rtl-overflow', 'spacing-off-grid:7', 'spacing-off-grid:13', 'type-drift']
  const label = (f) => (f.rule === 'spacing-off-grid' ? `${f.rule}:${f.key.split(':')[1]}` : f.rule)
  assert.deepEqual(sortFindings(input).map(label), expected)
  assert.deepEqual(sortFindings([...input].reverse()).map(label), expected)
  assert.deepEqual(sortFindings(input).map(label), sortFindings(sortFindings(input)).map(label))
})

test('score: 100 when clean, and capped so tidiness cannot hide a violation or noise fake breakage', () => {
  assert.equal(scoreFindings([]).score, 100)
  assert.equal(scoreFindings([finding('a', 'violation', 1), finding('b', 'violation', 1), ...Array(3).fill(finding('c', 'advisory', 1))]).score, 74)
  const noisy = scoreFindings(Array.from({ length: 40 }, () => finding('c', 'advisory', 1)))
  assert.equal(noisy.score, 80, 'advisories alone cost at most 20')
  assert.equal(noisy.violations, 0)
  const broken = scoreFindings(Array.from({ length: 20 }, () => finding('a', 'violation', 1)))
  assert.equal(broken.score, 30, 'violations cost at most 70')
})

/* ── rendering ── */

const report = {
  schema: 1,
  target: 'http://site.test/pricing',
  options: { viewport: { width: 1280, height: 800 }, dir: 'rtl', dark: false, pages: [], axe: false },
  pages: [{ path: '/pricing', url: 'http://site.test/pricing', status: 200, title: 'Pricing', elements: 120, truncated: false }],
  skippedPages: [],
  findings: [
    {
      ...finding('contrast', 'violation', 3),
      sc: '1.4.3',
      message: '3 text elements #999999 on #ffffff = 2.84:1, needs 4.5:1.',
      examples: [{ page: '/pricing', selector: 'p.muted "Words"', detail: '16px, 2.84:1' }],
      suggestions: [{ kind: 'tool', id: 'contrast', why: 'check a pair', ref: 'https://x.test/tools/contrast' }],
    },
    {
      ...finding('spacing-off-grid', 'advisory', 1, 'spacing:13'),
      message: 'Spacing of 13px is off the 4px grid <b>here</b>.',
      examples: [{ page: '/pricing', selector: 'article.card.odd', detail: 'padding: 13px' }],
      suggestions: [{ kind: 'tool', id: 'spacing', why: 'pick steps', ref: 'https://x.test/tools/spacing' }],
    },
  ],
  summary: { score: 88, violations: 1, advisories: 1, formula: 'f' },
  scales: {
    spacing: { grid: 4, share: 0.99, halfStepShare: 1, total: 80, steps: [4, 8] },
    radius: { values: [8], total: 30 },
    font: { values: [16], total: 40 },
    color: { distinct: 5, translucent: 0, greys: 4, top: [{ hex: '#222222', count: 9 }] },
    shadow: { distinct: 0, total: 0, top: [] },
  },
  coverage: {
    textMeasured: 40,
    textSkipped: { image: 1, svg: 0, disabled: 0, invisible: 0, transparent: 0 },
    elements: 120,
    rtlElementsCompared: 118,
    fractionalSpacingIgnored: 0,
    axe: { ran: false, reason: 'not installed (optional)' },
    notChecked: ['hover states', 'pages other than the ones named'],
  },
}

const plain = { bold: (s) => s, dim: (s) => s, green: (s) => s, yellow: (s) => s, cyan: (s) => s, width: 80 }

test('terminal report: violations before advisories, a score line, and the coverage caveat', () => {
  const text = renderTerminal(report, plain)
  assert.ok(text.indexOf('Violations (1)') < text.indexOf('Advisories (1)'))
  assert.match(text, /Score 88\/100/)
  assert.match(text, /WCAG\s+1\.4\.3/)
  assert.match(text, /fix: https:\/\/x\.test\/tools\/contrast/)
  assert.match(text, /Not evaluated: hover states/)
  assert.match(text, /4px grid/)
  assert.ok(text.split('\n').every((line) => line.length <= 110), 'no runaway lines')
})

test('markdown: its own marker on the first line, stable bytes, markup escaped', () => {
  const a = renderMarkdown(report)
  assert.equal(a.split('\n')[0], AUDIT_MARKER)
  assert.notEqual(AUDIT_MARKER, '<!-- hoverlab-review -->', 'must not collide with the review comment')
  assert.equal(a, renderMarkdown(structuredClone(report)))
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(a), 'no date')
  assert.ok(!a.includes('<b>here</b>'), 'raw markup from a finding must be escaped')
  assert.match(a, /### Violations/)
  assert.match(a, /<details>/)
})

test('markdown: a clean report says so', () => {
  const clean = { ...report, findings: [], summary: { score: 100, violations: 0, advisories: 0, formula: 'f' } }
  assert.match(renderMarkdown(clean), /No contrast failures/)
  assert.match(renderTerminal(clean, plain), /No contrast failures/)
})

test('json: the report itself, coverage and all', () => {
  const parsed = JSON.parse(renderJson(report))
  assert.equal(parsed.summary.score, 88)
  assert.deepEqual(parsed.coverage.notChecked, report.coverage.notChecked)
  assert.equal(parsed.findings[0].suggestions[0].ref, 'https://x.test/tools/contrast')
})
