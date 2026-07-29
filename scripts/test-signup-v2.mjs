import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const stamp = Date.now()
await page.goto(`${BASE}/signup`)
await page.waitForTimeout(1000)
// Fill using type instead of fill
await page.fill('#auth-name', 'Test User')
await page.fill('#auth-email', `test+${stamp}@hoverlab.dev`)
await page.fill('#auth-password', 'testpass123')
await page.waitForTimeout(300)
// Find the submit button by text
const submitBtn = page.locator('button[type="submit"]')
const btnText = (await submitBtn.textContent()).trim()
console.log(`Submit button text: "${btnText}"`)
// Click and wait for either URL change or response
await Promise.all([
  page.waitForResponse(res => res.url().includes('/api/auth/signup') || res.url().includes('/api/auth/login'), { timeout: 15000 }).then(r => console.log(`Got response: ${r.status()} ${r.url()}`)).catch(e => console.log(`No response: ${e.message}`)),
  submitBtn.click(),
])
await page.waitForTimeout(3000)
console.log(`Final URL: ${page.url()}`)
await browser.close()
