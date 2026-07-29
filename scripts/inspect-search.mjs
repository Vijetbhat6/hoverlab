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
// Find all buttons in the search area
const searchArea = page.locator('.relative.flex-1').first()
const buttons = await searchArea.locator('button').all()
console.log(`Buttons in search area: ${buttons.length}`)
for (let i = 0; i < buttons.length; i++) {
  const label = await buttons[i].getAttribute('aria-label')
  const pressed = await buttons[i].getAttribute('aria-pressed')
  const text = (await buttons[i].textContent()).trim().slice(0, 40)
  console.log(`  [${i}] aria-label="${label}" pressed="${pressed}" text="${text}"`)
}
// Also find the bundle button in the header
const headerBtns = await page.locator('header button').all()
console.log(`\nHeader buttons: ${headerBtns.length}`)
for (let i = 0; i < headerBtns.length; i++) {
  const label = await headerBtns[i].getAttribute('aria-label')
  const text = (await headerBtns[i].textContent()).trim().slice(0, 40)
  console.log(`  [${i}] aria-label="${label}" text="${text}"`)
}
await browser.close()
