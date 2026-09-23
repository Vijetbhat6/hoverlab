/**
 * Everything that touches a browser: finding the driver, launching, loading a
 * page, running the measuring function inside it.
 *
 * PLAYWRIGHT IS NOT A DEPENDENCY OF THIS PACKAGE
 *
 * `hoverlab` is a one-round-trip `npx` install, and Playwright is a
 * hundred-megabyte browser download. Forcing that on everyone who runs
 * `hoverlab add btn-gradient` would be the wrong trade, so `package.json`
 * stays dependency-free and this file loads the driver lazily, from the
 * PROJECT the command is run in.
 *
 * "From the project" matters more than it looks. Under `npx`, this file
 * lives in a cache directory, and a bare `import('playwright')` resolves
 * relative to that cache, never to the user's `node_modules`. So the driver
 * is resolved from the working directory first and only then by bare name.
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { measurePage } from './measure.mjs'

/** A problem with the environment, not with the page: missing driver, no browser. Exit code 2. */
export class AuditSetupError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuditSetupError'
  }
}

export const INSTALL_HINT =
  'hoverlab audit-url needs Playwright: run `npm i -D playwright && npx playwright install chromium`, then retry.'

function resolveFrom(dir, specifier) {
  try {
    return createRequire(path.join(dir, 'noop.js')).resolve(specifier)
  } catch {
    return null
  }
}

/**
 * Find Playwright's `chromium`. `playwright` first, then `playwright-core`,
 * each from the project and then by bare name.
 *
 * @param {{ cwd?: string, load?: (specifier: string) => Promise<any> }} [options]
 */
export async function loadPlaywright({ cwd = process.cwd(), load = (specifier) => import(specifier) } = {}) {
  for (const name of ['playwright', 'playwright-core']) {
    const resolved = resolveFrom(cwd, name)
    for (const specifier of resolved ? [pathToFileURL(resolved).href, name] : [name]) {
      try {
        const mod = await load(specifier)
        const chromium = mod.chromium ?? mod.default?.chromium
        if (chromium) return { chromium, name }
      } catch {
        // Not installed here; try the next place.
      }
    }
  }
  throw new AuditSetupError(INSTALL_HINT)
}

/**
 * Launch headless Chromium, falling back to an installed Chrome or Edge when
 * Playwright's own download is absent. A machine that can run the site's own
 * browser tests has one of those, and it saves a 150 MB download.
 */
export async function launchBrowser(chromium, env = process.env) {
  const attempts = []
  if (env.HOVERLAB_CHROME_PATH) attempts.push({ executablePath: env.HOVERLAB_CHROME_PATH })
  attempts.push({}, { channel: 'chrome' }, { channel: 'msedge' })

  let first
  for (const extra of attempts) {
    try {
      return await chromium.launch({ headless: true, ...extra })
    } catch (error) {
      first ??= error
    }
  }
  const reason = String(first?.message ?? first).split('\n')[0]
  throw new AuditSetupError(
    `hoverlab audit-url could not start a browser: run \`npx playwright install chromium\` (${reason})`,
  )
}

/** The direction switch, run before any script on the page. Re-asserted so a framework cannot quietly undo it. */
function forceRtl() {
  const apply = () => {
    const root = document.documentElement
    if (root && root.getAttribute('dir') !== 'rtl') root.setAttribute('dir', 'rtl')
  }
  apply()
  document.addEventListener('DOMContentLoaded', apply)
  new MutationObserver(apply).observe(document, { attributes: true, attributeFilter: ['dir'], subtree: true })
}

/** axe-core's source, if it can be found from the project or from here. */
export function findAxeSource(cwd = process.cwd()) {
  const candidates = [resolveFrom(cwd, 'axe-core'), resolveFrom(path.dirname(fileURLToPath(import.meta.url)), 'axe-core')]
  for (const resolved of candidates) {
    if (!resolved) continue
    try {
      const min = path.join(path.dirname(resolved), 'axe.min.js')
      return readFileSync(min, 'utf8')
    } catch {
      try {
        return createRequire(import.meta.url)(resolved).source ?? null
      } catch {
        // fall through to the next candidate
      }
    }
  }
  return null
}

async function runAxe(page, source) {
  try {
    await page.addScriptTag({ content: source })
    return await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: 'rule', values: ['color-contrast'] },
        resultTypes: ['violations', 'incomplete'],
      })
      const els = window.__hlAuditEls || []
      const nodes = []
      for (const violation of result.violations) {
        for (const node of violation.nodes) {
          const target = Array.isArray(node.target) ? node.target : [node.target]
          let index = -1
          if (target.length === 1 && typeof target[0] === 'string') {
            try {
              const el = document.querySelector(target[0])
              index = el ? els.indexOf(el) : -1
            } catch {
              index = -1
            }
          }
          const data = (node.any && node.any[0] && node.any[0].data) || {}
          nodes.push({
            index,
            target: target.map(String).join(' '),
            ratio: data.contrastRatio ?? null,
            fg: data.fgColor ?? null,
            bg: data.bgColor ?? null,
            size: data.fontSize ?? null,
          })
        }
      }
      // "Incomplete" is axe saying it could not decide (an overlapping or
      // translucent backdrop, usually); worth knowing when the built-in pass did decide.
      const undecided = []
      for (const item of result.incomplete) {
        for (const node of item.nodes) {
          const first = Array.isArray(node.target) ? node.target : [node.target]
          if (first.length === 1 && typeof first[0] === 'string') {
            try {
              const el = document.querySelector(first[0])
              const at = el ? els.indexOf(el) : -1
              if (at >= 0) undecided.push(at)
            } catch {
              // an unusable selector is simply not mapped
            }
          }
        }
      }
      return { ran: true, version: window.axe.version, nodes, undecided }
    })
  } catch (error) {
    return { ran: false, reason: String(error?.message ?? error).split('\n')[0], nodes: [] }
  }
}

/**
 * Load one URL in a fresh context and measure it.
 *
 * A fresh context per pass, so cookies, storage and the injected direction
 * never leak between the left-to-right and right-to-left measurements.
 *
 * @param {import('playwright').Browser} browser
 * @param {string} url
 * @param {{ viewport: {width: number, height: number}, dark: boolean, rtl: boolean, wait: number, timeout: number, axeSource?: string | null, maxElements?: number }} options
 */
export async function capturePage(browser, url, options) {
  const context = await browser.newContext({
    viewport: options.viewport,
    colorScheme: options.dark ? 'dark' : 'light',
    // Entrance animations otherwise leave text at opacity 0 or mid-transform when it is measured.
    reducedMotion: 'reduce',
    // The audit injects scripts; a strict Content-Security-Policy is the site's business, not a reason to fail.
    bypassCSP: true,
    deviceScaleFactor: 1,
  })
  try {
    if (options.rtl) await context.addInitScript(forceRtl)
    const page = await context.newPage()
    const response = await page.goto(url, { waitUntil: 'load', timeout: options.timeout })
    // A dev server holds sockets open forever, so "idle" is a courtesy, not a requirement.
    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {})
    await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true)).catch(() => {})
    if (options.wait > 0) await page.waitForTimeout(options.wait)

    const finalUrl = page.url()
    const measured = await page.evaluate(measurePage, { maxElements: options.maxElements ?? 6000 })
    const axe = options.axeSource ? await runAxe(page, options.axeSource) : null
    return { finalUrl, status: response ? response.status() : 0, ...measured, axe }
  } finally {
    await context.close()
  }
}
