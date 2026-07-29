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
await page.waitForTimeout(2500)

// Add first card to bundle
const addBtn = page.locator('button[aria-label="Add to bundle"]').first()
await addBtn.click()
console.log('✓ Added effect to bundle')
await page.waitForTimeout(800)

// Open bundle drawer
const openBundle = page.locator('button[aria-label^="Open bundle"]').first()
await openBundle.click()
console.log('✓ Opened bundle drawer')
await page.waitForTimeout(1500)

// Check for ZIP button
const zipBtn = page.locator('button:has-text("Download ZIP")')
const zipExists = await zipBtn.count()
console.log(`✓ Feature 2 (ZIP download button): ${zipExists > 0 ? 'PRESENT' : 'MISSING'}`)

if (zipExists > 0) {
  // Click it and verify it produces a download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    zipBtn.click(),
  ])
  const fname = download.suggestedFilename()
  console.log(`✓ Feature 2 (ZIP download triggered): ${fname}`)
}

await browser.close()
console.log('✓ Done')
