import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))

// Sign up a fresh user
const stamp = Date.now()
await page.goto(`${BASE}/signup`)
await page.fill('#auth-name', 'Test')
await page.fill('#auth-email', `test+${stamp}@hoverlab.dev`)
await page.fill('#auth-password', 'testpass123')
await page.click('button[type="submit"]')
await page.waitForURL('**/library', { timeout: 10000 })
console.log('✓ Signed up + redirected to /library')

// Feature 1: Recently viewed — visit an effect, go back to library, check rail
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1500) // let recordView fire
await page.goto(`${BASE}/library`)
await page.waitForTimeout(1000)
const railVisible = await page.locator('section[aria-label="Recently viewed effects"]').isVisible().catch(() => false)
console.log(`✓ Feature 1 (Recently viewed rail): ${railVisible ? 'VISIBLE' : 'NOT VISIBLE'}`)

// Feature 4: AI search toggle — click the sparkles button inside search input
const aiToggle = page.locator('button[aria-label="Enable AI search (natural language)"]')
const aiToggleExists = await aiToggle.count()
console.log(`✓ Feature 4 (AI search toggle button): ${aiToggleExists > 0 ? 'PRESENT' : 'MISSING'}`)
if (aiToggleExists > 0) {
  await aiToggle.click()
  await page.waitForTimeout(300)
  const pressed = await page.locator('button[aria-pressed="true"]').filter({ hasText: '' }).count()
  const placeholder = await page.inputValue('input[placeholder*="Describe what you want"]')
  console.log(`✓ Feature 4 (AI mode placeholder): ${placeholder ? 'SET' : 'NOT SET'}`)
}

// Feature 2: ZIP download button in bundle drawer
// First add an effect to bundle, then open drawer
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1000)
// Click the bundle toggle button (the + / package icon)
const bundleBtn = page.locator('button[aria-label="Add to bundle"]').first()
if (await bundleBtn.count() > 0) {
  await bundleBtn.click()
  await page.waitForTimeout(500)
}
// Open bundle drawer via the header button
const openBundleBtn = page.locator('button:has-text("Bundle")').first()
if (await openBundleBtn.count() > 0) {
  await openBundleBtn.click()
  await page.waitForTimeout(800)
  const zipBtn = page.locator('button:has-text("Download ZIP")')
  const zipBtnExists = await zipBtn.count()
  console.log(`✓ Feature 2 (ZIP download button): ${zipBtnExists > 0 ? 'PRESENT' : 'MISSING'}`)
} else {
  console.log('✓ Feature 2: could not find bundle open button (skipping)')
}

// Feature 3: OG image — already verified via curl, but check the meta tag is present
await page.goto(`${BASE}/effect/btn-gradient`)
await page.waitForTimeout(1000)
const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null)
const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content').catch(() => null)
console.log(`✓ Feature 3 (OG title meta): ${ogTitle ?? 'MISSING'}`)
console.log(`✓ Feature 3 (Twitter card meta): ${twitterCard ?? 'MISSING'}`)

console.log(`\n--- Console errors (${errors.length}):`)
for (const e of errors.slice(0, 10)) console.log(`  ${e}`)
console.log(errors.length > 10 ? `  ... and ${errors.length - 10} more` : '')

await browser.close()
console.log('\n✓ Smoke test complete')
