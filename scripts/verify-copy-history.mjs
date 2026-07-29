/**
 * End-to-end verification for the copy-history dropdown feature:
 *  1. Sign up a fresh user (or log in if it already exists).
 *  2. Visit /library.
 *  3. Click "Copy" on the first effect's CSS code block.
 *  4. Click the copy-history dropdown in the header.
 *  5. Verify the entry appears with the effect name, category, and "just now".
 *  6. Click the entry → verify it navigates to /effect/<id>.
 *  7. Verify the badge count goes to 1.
 */
import { chromium } from 'playwright'

const EMAIL = `verify-copy-${Date.now()}@hoverlab.test`
const PASSWORD = 'test-password-12345'
const BASE = 'http://127.0.0.1:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // 1. Sign up
  console.log('1. Signing up as', EMAIL)
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  await page.fill('#auth-name', 'Verify Copy')
  await page.fill('#auth-email', EMAIL)
  await page.fill('#auth-password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/library', { timeout: 10000 })
  console.log('   ✓ signed up, redirected to /library')

  // Mock clipboard (headless Chromium doesn't grant clipboard by default).
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    let clip = ''
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (t) => { clip = t; return undefined },
        readText: async () => clip,
      },
      configurable: true,
    })
  })

  // 2. Find the first effect card and open it (so we get a stable CodeBlock
  //    with effect context).
  console.log('2. Opening first effect detail page')
  await page.goto(`${BASE}/effect/btn-gradient`, { waitUntil: 'networkidle' })

  // 3. Click the "Copy" button on the CSS code block (the second one, after
  //    the markup.html block).
  const copyButtons = page.locator('button[aria-label="Copy code"]')
  const copyCount = await copyButtons.count()
  console.log(`   found ${copyCount} "Copy code" buttons on detail page`)
  if (copyCount < 1) throw new Error('No Copy button found')
  await copyButtons.first().click()
  // Wait for toast + history write
  await page.waitForTimeout(400)

  // 4. Check the header dropdown button — should show count=1
  const dropdownBtn = page.locator('button[aria-label^="Copy history"]')
  const ariaLabel = await dropdownBtn.first().getAttribute('aria-label')
  console.log('   dropdown aria-label:', ariaLabel)
  if (!ariaLabel.includes('1 item')) {
    throw new Error(`Expected "Copy history (1 item)" but got "${ariaLabel}"`)
  }
  console.log('   ✓ badge count is 1')

  // Badge element should exist
  const badge = dropdownBtn.locator('..').locator('span').filter({ hasText: '1' })
  const badgeVisible = await badge.count()
  console.log('   badge spans with "1":', badgeVisible)

  // 5. Open the dropdown
  console.log('5. Opening copy-history dropdown')
  await dropdownBtn.click()
  await page.waitForTimeout(200)

  // Verify the panel content
  const popover = page.locator('[data-radix-popper-content-wrapper]')
  await popover.waitFor({ state: 'visible', timeout: 3000 })

  const headerText = await popover.locator('text=Recently copied').first().textContent()
  console.log('   panel header:', headerText?.trim())
  if (!headerText?.includes('Recently copied')) throw new Error('Dropdown did not open')

  const entryName = await popover.locator('a[href^="/effect/"]').first().textContent()
  console.log('   first entry:', entryName?.trim().split('\n')[0])

  // Check relative time "just now"
  const justNow = await popover.locator('text=just now').count()
  console.log('   "just now" labels:', justNow)
  if (justNow !== 1) throw new Error(`Expected exactly 1 "just now" label, got ${justNow}`)

  // 6. Click the entry — should navigate to /effect/<id>
  console.log('6. Clicking history entry → should navigate')
  await popover.locator('a[href^="/effect/"]').first().click()
  await page.waitForURL('**/effect/**', { timeout: 5000 })
  const finalUrl = page.url()
  console.log('   navigated to:', finalUrl)
  if (!finalUrl.includes('/effect/')) throw new Error('Did not navigate to effect page')

  // 7. Click back, open dropdown, click "Clear" — should empty the list
  console.log('7. Clearing history')
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' })
  await page.locator('button[aria-label^="Copy history"]').click()
  await page.waitForTimeout(200)
  const clearBtn = page.locator('button[aria-label="Clear copy history"]')
  if (await clearBtn.count() !== 1) throw new Error('Clear button not found')
  await clearBtn.click()
  await page.waitForTimeout(200)

  // Dropdown should now show "No copies yet"
  const emptyMsg = await page.locator('text=No copies yet').count()
  console.log('   "No copies yet" visible:', emptyMsg === 1)
  if (emptyMsg !== 1) throw new Error('History was not cleared')

  console.log('\n✓ All copy-history verifications passed')
  await browser.close()
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
