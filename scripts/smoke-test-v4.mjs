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

// Feature 4: AI search
await page.waitForTimeout(1500)
const aiToggle = page.locator('button[aria-label="Enable AI search"]').first()
await aiToggle.click()
await page.waitForTimeout(400)
const disableBtn = page.locator('button[aria-label="Disable AI search"]').first()
console.log(`✓ Feature 4 (AI mode toggleable): ${(await disableBtn.count()) > 0 ? 'YES' : 'NO'}`)
// Use placeholder-based selector
const inputEl = page.locator('input[placeholder*="Describe"]').first()
const placeholder = await inputEl.getAttribute('placeholder')
console.log(`✓ Feature 4 (AI placeholder): ${placeholder}`)
await inputEl.fill('button that pulses')
console.log('  ... waiting for AI response (up to 20s)')
await page.waitForTimeout(18000)
const bannerVisible = await page.locator('text=AI-ranked results').isVisible().catch(() => false)
const loadingVisible = await page.locator('text=Asking the AI').isVisible().catch(() => false)
console.log(`✓ Feature 4 (AI banner shown): ${bannerVisible || loadingVisible ? 'YES' : 'NO'}`)
// Count rendered effect cards
const cards = await page.locator('a[href^="/effect/"]').count()
console.log(`✓ Feature 4 (effect links on page): ${cards}`)

// Feature 2: ZIP button
await disableBtn.click()
await page.waitForTimeout(300)
await page.locator('button[aria-label="Add to bundle"]').first().click()
await page.waitForTimeout(500)
await page.locator('button[aria-label^="Open bundle"]').first().click()
await page.waitForTimeout(1200)
const zipExists = await page.locator('button:has-text("Download ZIP")').count()
console.log(`✓ Feature 2 (ZIP download button): ${zipExists > 0 ? 'PRESENT' : 'MISSING'}`)

await browser.close()
console.log('✓ Done')
