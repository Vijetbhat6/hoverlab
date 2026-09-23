/**
 * End to end: a real browser, a real HTTP server, the real CLI.
 *
 * `test-fixtures/audit-url/defects.html` has known defects planted in it and
 * `clean.html` is the same page with each one fixed. The claim being tested
 * is both halves: every planted defect is found, and the clean page produces
 * nothing at all, right-to-left included. A checker that reports on
 * everything would pass the first half on its own.
 *
 * Skipped, with the reason printed, when Playwright or a browser is not
 * available: the package has no dependencies by design, so a bare checkout
 * (or `npm publish` from CI) cannot be assumed to have either.
 */

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { launchBrowser, loadPlaywright } from '../src/audit-url/browser.mjs'
import { runAudit } from '../src/audit-url/index.mjs'
import { AUDIT_MARKER } from '../src/audit-url/report.mjs'

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURES = path.join(CLI, 'test-fixtures', 'audit-url')
const BIN = path.join(CLI, 'bin', 'hoverlab.mjs')

let server
let base
let unavailable = false

before(async () => {
  try {
    const { chromium } = await loadPlaywright({ cwd: CLI })
    const browser = await launchBrowser(chromium)
    await browser.close()
  } catch (error) {
    unavailable = `no browser for the end-to-end audit: ${String(error.message).split('\n')[0]}`
    return
  }
  server = http.createServer((req, res) => {
    const name = req.url === '/' ? 'clean.html' : path.basename(req.url.split('?')[0])
    try {
      const body = readFileSync(path.join(FIXTURES, name))
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(body)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => server?.close())

const e2e = (name, fn) => test(name, { timeout: 120_000 }, async (t) => {
  if (unavailable) return t.skip(unavailable)
  await fn(t)
})


/*
  The server lives in THIS process, so the CLI must be spawned asynchronously:
  spawnSync would block the event loop that answers its requests, and the
  audit would time out waiting for a page this very test is serving.
*/
function cli(args, cwd = CLI) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], { cwd })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('close', (status) => resolve({ status, stdout, stderr }))
  })
}

const byRule = (report, rule) => report.findings.filter((f) => f.rule === rule)
const audit = (file, extra = {}) => runAudit({ url: `${base}/${file}`, rtl: true, cwd: CLI, ...extra })

/** The report with the ephemeral port taken out, so two runs can be compared. */
const portless = (report) => JSON.stringify(report).split(base).join('BASE')

e2e('every planted defect is found', async () => {
  const report = await audit('defects.html')

  // 1. contrast
  const contrast = byRule(report, 'contrast')
  assert.equal(contrast.length, 1, 'exactly the one low-contrast paragraph; the #767676 control passes')
  assert.equal(contrast[0].data.fg, '#999999')
  assert.equal(contrast[0].data.bg, '#ffffff')
  assert.equal(contrast[0].severity, 'violation')
  assert.match(contrast[0].examples[0].selector, /p\.muted/)

  // 2, 3, 4. drift, each naming the planted value
  assert.equal(byRule(report, 'spacing-off-grid')[0]?.data.value, 13)
  assert.equal(byRule(report, 'radius-drift')[0]?.data.value, 7)
  assert.equal(byRule(report, 'type-drift')[0]?.data.value, 15)
  assert.equal(byRule(report, 'color-near-duplicate')[0]?.data.value, '#f6f6f7')
  assert.equal(report.scales.spacing.grid, 4)
  assert.deepEqual(report.scales.radius.values, [8])

  // 5. overflow that exists only in RTL
  const overflow = byRule(report, 'rtl-overflow')
  assert.equal(overflow.length, 1)
  assert.equal(overflow[0].data.side, 'left')
  assert.match(overflow[0].examples[0].selector, /pin/)
  assert.equal(byRule(report, 'rtl-page-scroll').length, 1)

  // 6. physical offset that did not mirror
  const stuck = byRule(report, 'rtl-not-mirrored')
  assert.equal(stuck.length, 1)
  assert.match(stuck[0].examples[0].selector, /button\.close/)
  assert.match(stuck[0].examples[0].detail, /left: 12px/)

  // 7. the un-flipped arrow, and only that one
  const icons = byRule(report, 'rtl-icon-not-mirrored')
  assert.deepEqual(icons.map((f) => f.data.icon), ['ArrowRight'])
  assert.equal(icons[0].count, 1)

  // No LTR page overflow was invented.
  assert.equal(byRule(report, 'page-overflow').length, 0)

  // Every finding carries suggestions that resolve to something.
  assert.ok(report.findings.every((f) => f.suggestions.length > 0 && f.suggestions.every((s) => s.ref)))
  assert.equal(report.summary.violations, 3, 'contrast, rtl-page-scroll, rtl-overflow')
  assert.ok(report.summary.score < 100)
})

e2e('the clean twin produces no findings at all, in either direction', async () => {
  const report = await audit('clean.html')
  assert.deepEqual(report.findings.map((f) => `${f.rule}: ${f.message}`), [])
  assert.equal(report.summary.score, 100)
  assert.ok(report.coverage.rtlElementsCompared > 40, 'the RTL pass really compared elements')
  assert.ok(report.coverage.textMeasured > 30, 'and contrast was really measured')
  assert.equal(report.scales.spacing.grid, 4)
})

e2e('without --dir rtl there are no rtl findings, but everything else still is', async () => {
  const report = await audit('defects.html', { rtl: false })
  assert.equal(report.findings.filter((f) => f.rule.startsWith('rtl-')).length, 0)
  assert.equal(report.coverage.rtlElementsCompared, null)
  assert.equal(byRule(report, 'contrast').length, 1)
  assert.equal(byRule(report, 'spacing-off-grid').length, 1)
})

e2e('--dark is honoured and a page with explicit backgrounds is unaffected', async () => {
  const report = await audit('clean.html', { dark: true })
  assert.equal(report.options.dark, true)
  assert.deepEqual(report.findings, [])
})

e2e('--pages audits extra same-origin pages, and refuses other origins', async () => {
  const report = await audit('clean.html', { pages: '/defects.html,https://evil.test/x,/defects.html' })
  assert.deepEqual(report.pages.map((p) => p.path), ['/clean.html', '/defects.html'])
  assert.equal(report.skippedPages.length, 1)
  assert.match(report.skippedPages[0].reason, /different origin/)
  const contrast = byRule(report, 'contrast')
  assert.equal(contrast.length, 1)
  assert.equal(contrast[0].examples[0].page, '/defects.html', 'the finding says which page it is on')
})

e2e('a missing extra page is a note, not a failed audit', async () => {
  const report = await audit('clean.html', { pages: '/nope.html' })
  assert.match(report.pages[1].error, /404/)
  assert.deepEqual(report.findings, [])
})

e2e('two runs of the same page are byte-identical', async () => {
  const a = await audit('defects.html')
  const b = await audit('defects.html')
  assert.equal(portless(a), portless(b))
})

e2e('the CLI: --json, exit code 1 on violations, 0 when clean', async () => {
  const run = (file, ...args) => cli(['audit-url', `${base}/${file}`, ...args])

  const bad = await run('defects.html', '--dir', 'rtl', '--json')
  assert.equal(bad.status, 1, bad.stderr)
  const parsed = JSON.parse(bad.stdout)
  assert.equal(parsed.summary.violations, 3)
  assert.equal(parsed.options.dir, 'rtl')

  const good = await run('clean.html', '--dir', 'rtl', '--json')
  assert.equal(good.status, 0, good.stderr)
  assert.equal(JSON.parse(good.stdout).findings.length, 0)

  const markdown = await run('defects.html', '--dir', 'rtl', '--format', 'markdown')
  assert.equal(markdown.stdout.split('\n')[0], AUDIT_MARKER)

  const terminal = await run('defects.html', '--viewport', 'mobile')
  assert.match(terminal.stdout, /Hoverlab URL audit/)
  assert.match(terminal.stdout, /Score \d+\/100/)
  assert.match(terminal.stdout, /390x844/)

  // --strict makes advisories fail too; the clean page has none, so it still passes.
  assert.equal((await run('clean.html', '--strict')).status, 0)
  const advisoriesOnly = await run('defects.html', '--strict')
  assert.equal(advisoriesOnly.status, 1)
})

e2e('the CLI: an unreachable URL and a bad argument exit 2 with a message on stderr', async () => {
  const dead = await cli(['audit-url', 'http://127.0.0.1:1/', '--timeout', '3000'])
  assert.equal(dead.status, 2)
  assert.match(dead.stderr, /Could not audit/)

  const bad = await cli(['audit-url', `${base}/clean.html`, '--dir', './src'])
  assert.equal(bad.status, 2)
  assert.match(bad.stderr, /rtl or ltr/)

  const none = await cli(['audit-url'])
  assert.equal(none.status, 2)
  assert.match(none.stderr, /Usage: hoverlab audit-url/)

  const scheme = await cli(['audit-url', 'file:///etc/hosts'])
  assert.equal(scheme.status, 2)
  assert.match(scheme.stderr, /Only http and https/)
})

/*
  This one needs no browser and does not use the shared server: it copies the
  CLI somewhere with no node_modules above it, which is the situation of
  someone running `npx hoverlab audit-url` in a project without Playwright.
*/
test('the CLI with no Playwright anywhere: one line, the install command, exit 2', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hoverlab-noplaywright-'))
  try {
    cpSync(CLI, dir, {
      recursive: true,
      filter: (source) => !/[\\/](node_modules|test|test-fixtures)([\\/]|$)/.test(path.relative(CLI, source)),
    })
    const result = spawnSync(process.execPath, [path.join(dir, 'bin', 'hoverlab.mjs'), 'audit-url', 'http://127.0.0.1:1/'], {
      cwd: dir,
      encoding: 'utf8',
    })
    assert.equal(result.status, 2)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr.trim().split('\n').length, 1, result.stderr)
    assert.match(result.stderr, /npm i -D playwright/)
    assert.match(result.stderr, /npx playwright install chromium/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
