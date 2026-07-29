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

// Enable AI mode
await page.locator('button[aria-label="Enable AI search"]').first().click()
await page.waitForTimeout(400)
const input = page.locator('input[placeholder*="Describe"]').first()
await input.fill('button that pulses')
console.log('  ... waiting for AI response (up to 25s)')
await page.waitForTimeout(22000)
const bannerText = await page.locator('text=AI-ranked results').textContent().catch(() => null)
console.log(`✓ Feature 4 (AI banner): ${bannerText?.trim() ?? 'NOT SHOWN'}`)
// Count effect cards rendered
const cards = await page.locator('a[href^="/effect/"][class*="group"]').count()
console.log(`✓ Feature 4 (result cards): ${cards}`)
await browser.close()
console.log('✓ Done')
