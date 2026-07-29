import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))
const stamp = Date.now()
await page.goto(`${BASE}/signup`)
await page.fill('#auth-name', 'Test')
await page.fill('#auth-email', `test+${stamp}@hoverlab.dev`)
await page.fill('#auth-password', 'testpass123')
await page.click('button[type="submit"]')
await page.waitForURL('**/library', { timeout: 15000 })
console.log('✓ Signed up + redirected to /library')

// Feature 1: Recently viewed
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1500)
await page.goto(`${BASE}/library`)
await page.waitForTimeout(1500)
const railVisible = await page.locator('section[aria-label="Recently viewed effects"]').isVisible().catch(() => false)
console.log(`✓ Feature 1 (Recently viewed rail): ${railVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

// Feature 4: AI search toggle
const aiToggle = page.locator('button[aria-label="Enable AI search"]').first()
const aiToggleExists = await aiToggle.count()
console.log(`✓ Feature 4 (AI search toggle button): ${aiToggleExists > 0 ? 'PRESENT' : 'MISSING'}`)
if (aiToggleExists > 0) {
  await aiToggle.click()
  await page.waitForTimeout(300)
  const placeholder = await page.inputValue('input[placeholder*="Describe what you want"]')
  console.log(`✓ Feature 4 (AI mode placeholder): ${placeholder ? 'SET' : 'NOT SET'}`)
  // Type a query and wait for AI response
  await page.fill('input[placeholder*="Describe what you want"]', 'button that pulses')
  await page.waitForTimeout(5000) // wait for debounce + LLM round-trip
  const bannerVisible = await page.locator('text=AI-ranked results').isVisible().catch(() => false)
  const loadingVisible = await page.locator('text=Asking the AI').isVisible().catch(() => false)
  console.log(`✓ Feature 4 (AI banner shown): ${bannerVisible || loadingVisible ? 'YES' : 'NO'}`)
}

// Feature 2: ZIP button in bundle drawer
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1500)
const addBundleBtn = page.locator('button[aria-label="Add to bundle"]').first()
if (await addBundleBtn.count() > 0) {
  await addBundleBtn.click()
  await page.waitForTimeout(500)
}
// Open bundle drawer via header button (aria-label starts with "Open bundle")
const openBundleBtn = page.locator('button[aria-label^="Open bundle"]').first()
if (await openBundleBtn.count() > 0) {
  await openBundleBtn.click()
  await page.waitForTimeout(1000)
  const zipBtn = page.locator('button:has-text("Download ZIP")')
  const zipBtnExists = await zipBtn.count()
  console.log(`✓ Feature 2 (ZIP download button): ${zipBtnExists > 0 ? 'PRESENT' : 'MISSING'}`)
}

// Feature 3: OG meta tags
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1000)
const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null)
const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content').catch(() => null)
console.log(`✓ Feature 3 (OG title meta): ${ogTitle ?? 'MISSING'}`)
console.log(`✓ Feature 3 (Twitter card meta): ${twitterCard ?? 'MISSING'}`)

console.log(`\n--- Page errors (${errors.length}):`)
for (const e of errors.slice(0, 5)) console.log(`  ${e}`)
await browser.close()
console.log('\n✓ Smoke test complete')
