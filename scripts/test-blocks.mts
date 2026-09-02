/**
 * Render every block in a real browser and interact with it.
 *
 * ── WHAT THIS COVERS THAT NOTHING ELSE DID ──────────────────────────────
 *
 * The catalog had four checks and a blind spot between them.
 * `build-block-markup.mts` server-renders all 210, so a block that throws
 * during render already fails the build. `audit-a11y` reads source text.
 * `audit-block-motion` reads class names. `shot-blocks.mts` takes pictures,
 * which a human then has to look at.
 *
 * None of them run a block's *client* code. A crash in a `useEffect`, a
 * handler that throws on the first click, a hydration mismatch — all of it
 * is invisible to a server render and to a static scan, and the last of
 * those has already shipped twice in this repo.
 *
 * So this hydrates each block, asserts it produced something, clicks its
 * first interactive control, and fails on any console error or page error
 * at any point. Nobody in this category ships tested components; this is
 * the mechanism behind being able to say we do.
 *
 * ── WHY IT IS NOT IN `npm test` ─────────────────────────────────────────
 *
 * It needs a running dev server and a browser, and it takes minutes. The
 * unit suite is meant to be run on every save. This is the pass you run
 * after a block wave, next to `shot-blocks.mts`:
 *
 *     npm run test:blocks                 every block
 *     npm run test:blocks -- hero-split   just these
 *     BASE=http://localhost:3007 npm run test:blocks
 *
 * ── ON THE CLICK ────────────────────────────────────────────────────────
 *
 * One click, on the first enabled control, and then a re-check for errors.
 * Not a full interaction sweep: this is a smoke test, and a script that
 * tried to drive every control of 210 unfamiliar components would spend its
 * life failing on its own assumptions rather than on real defects.
 */

import { chromium, type ConsoleMessage } from 'playwright'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'

const BASE = process.env.BASE ?? 'http://localhost:3007'
const ONLY = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))

const ids = ONLY.length > 0 ? ONLY : BLOCK_CATALOG.map((block) => block.id)

/**
 * Console noise that is not the block's fault.
 *
 * Kept deliberately short. Every entry here is a hole in the check, so a
 * pattern earns its place by being demonstrably external — a dev-server
 * artifact or a browser policy — and never by being merely common.
 */
const IGNORED = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
  // Next's dev overlay fetches source maps that do not exist for inline code.
  /Failed to load resource.*\.map\b/i,
]

function isRealError(message: string): boolean {
  return !IGNORED.some((pattern) => pattern.test(message))
}

interface Failure {
  id: string
  reason: string
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await context.addInitScript(() => {
  try {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('hoverlab:ladder-tour-seen', '1')
  } catch {
    /* private mode — the defaults are fine */
  }
})

const failures: Failure[] = []
let clicked = 0
let checked = 0

const page = await context.newPage()

const errors: string[] = []
page.on('console', (message: ConsoleMessage) => {
  if (message.type() === 'error' && isRealError(message.text())) errors.push(message.text())
})
page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`))

for (const id of ids) {
  errors.length = 0
  checked++

  let response
  try {
    response = await page.goto(`${BASE}/preview/block/${id}`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    })
  } catch (error) {
    failures.push({ id, reason: `navigation failed: ${(error as Error).message}` })
    continue
  }

  if (!response || response.status() !== 200) {
    failures.push({ id, reason: `HTTP ${response?.status() ?? 'no response'}` })
    continue
  }

  // Did it actually render? A block that hydrates to nothing is a pass by
  // every other check in this repo.
  const rendered = await page.evaluate(() => {
    const main = document.querySelector('main')
    return {
      elements: main ? main.querySelectorAll('*').length : 0,
      text: (main?.textContent ?? '').trim().length,
    }
  })

  if (rendered.elements < 5) {
    failures.push({ id, reason: `rendered only ${rendered.elements} elements` })
    continue
  }

  /*
   * The interaction. Buttons and summaries only — following a link
   * navigates away from the block under test, and typing into a field
   * would need to know what the field wants.
   *
   * CANDIDATES IN ORDER, NOT STRICTLY THE FIRST. The first version clicked
   * `.first()` and failed on `modal-unsaved-changes`, whose dialog opens by
   * default so that the trigger behind its overlay is — correctly —
   * unclickable. "The first control is covered" is a normal state for a
   * block that is about a covering thing. "Nothing at all can be clicked"
   * is not, and that is what this now reports.
   */
  /*
   * `:visible`, because a hidden control is not a defect.
   *
   * `navbar-simple` and `docs-layout` each have exactly one button and it
   * is the mobile menu toggle, marked `lg:hidden`. At the 1280px viewport
   * this runs at, both are correctly `display: none` — and the first
   * version of this script reported both as failures for behaving exactly
   * as designed.
   *
   * Submit buttons are excluded for a different reason: they navigate.
   * `not-found-404` ships a search form pointing at `/search`, which is
   * correct for a 404 page and which the first version of this script
   * submitted — landing on a real 404 and blaming the block for it.
   */
  const controls = page.locator(
    'main button:not([disabled]):not([type="submit"]):visible, main summary:visible',
  )
  const candidates = Math.min(await controls.count(), 5)

  if (candidates > 0) {
    let interacted = false
    for (let index = 0; index < candidates; index++) {
      try {
        await controls.nth(index).click({ timeout: 3_000 })
        interacted = true
        break
      } catch {
        // Covered, off-screen, or animating. Try the next one.
      }
    }

    if (interacted) {
      await page.waitForTimeout(250)
      clicked++
    } else {
      failures.push({ id, reason: `none of the first ${candidates} controls could be clicked` })
    }
  }

  if (errors.length > 0) {
    failures.push({ id, reason: `console: ${errors.slice(0, 2).join(' | ')}` })
  }
}

await browser.close()

console.log(
  `test-blocks: ${checked} blocks rendered and hydrated, ${clicked} interacted with.`,
)

if (failures.length === 0) {
  console.log('test-blocks: no render errors, no console errors.')
  process.exit(0)
}

console.error(`\ntest-blocks: ${failures.length} FAILED\n`)
for (const failure of failures) {
  console.error(`  ${failure.id}`)
  console.error(`    ${failure.reason}`)
}
process.exit(1)
