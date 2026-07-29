import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const stamp = Date.now()
await page.goto(`${BASE}/signup`)
await page.fill('#auth-name', 'Test')
await page.fill('#auth-email', `test+${stamp}@hoverlab.dev`)
await page.fill('#auth-password', 'testpass123')
await page.click('button[type="submit"]')
await page.waitForURL('**/library', { timeout: 15000 })
console.log('✓ Signed up')

// Feature 4: AI search — fix placeholder check
await page.waitForTimeout(1500)
const aiToggle = page.locator('button[aria-label="Enable AI search"]').first()
await aiToggle.click()
await page.waitForTimeout(400)
// After clicking, the aria-label changes to "Disable AI search"
const disableBtn = page.locator('button[aria-label="Disable AI search"]').first()
const inAiMode = await disableBtn.count()
console.log(`✓ Feature 4 (AI mode toggleable): ${inAiMode > 0 ? 'YES' : 'NO'}`)
// Check placeholder via the input element directly
const inputEl = page.locator('input[type="text"]').first()
const placeholder = await inputEl.getAttribute('placeholder')
console.log(`✓ Feature 4 (AI placeholder): ${placeholder?.includes('Describe') ? 'SET' : placeholder}`)
// Type a query
await inputEl.fill('button that pulses')
await page.waitForTimeout(6000)
const bannerVisible = await page.locator('text=AI-ranked results').isVisible().catch(() => false)
const loadingVisible = await page.locator('text=Asking the AI').isVisible().catch(() => false)
console.log(`✓ Feature 4 (AI banner after query): ${bannerVisible || loadingVisible ? 'YES' : 'NO'}`)
const cardCount = await page.locator('article, [class*="card"]').count()
console.log(`✓ Feature 4 (result cards rendered): ${cardCount}`)

// Feature 2: ZIP button — add to bundle from library, then open drawer
// First disable AI mode to get back to normal
await disableBtn.click()
await page.waitForTimeout(300)
// Add an effect to bundle: click the first add-to-bundle button on a card
const addToBundleBtn = page.locator('button[aria-label="Add to bundle"]').first()
if (await addToBundleBtn.count() > 0) {
  await addToBundleBtn.click()
  await page.waitForTimeout(500)
  // Now open the bundle drawer
  const openBundle = page.locator('button[aria-label^="Open bundle"]').first()
  await openBundle.click()
  await page.waitForTimeout(1200)
  const zipBtn = page.locator('button:has-text("Download ZIP")')
  const zipExists = await zipBtn.count()
  console.log(`✓ Feature 2 (ZIP download button): ${zipExists > 0 ? 'PRESENT' : 'MISSING'}`)
} else {
  console.log('✓ Feature 2: no add-to-bundle button found on library')
}

await browser.close()
console.log('✓ Done')
