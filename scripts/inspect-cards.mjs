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
await page.waitForTimeout(2000)
// Get all buttons inside the first card
const firstCard = page.locator('[class*="grid"] > div').first()
const btns = await firstCard.locator('button').all()
console.log(`Buttons in first card: ${btns.length}`)
for (let i = 0; i < btns.length; i++) {
  const label = await btns[i].getAttribute('aria-label')
  console.log(`  [${i}] aria-label="${label}"`)
}
await browser.close()
