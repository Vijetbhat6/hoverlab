import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('response', async (res) => {
  if (res.url().includes('/api/auth/')) {
    console.log(`RESPONSE ${res.status()} ${res.url()}`)
    if (res.status() >= 400) {
      try { console.log(`  body: ${(await res.body()).toString().slice(0, 200)}`) } catch {}
    }
  }
})
const stamp = Date.now()
await page.goto(`${BASE}/signup`)
await page.fill('#auth-name', 'Test')
await page.fill('#auth-email', `test+${stamp}@hoverlab.dev`)
await page.fill('#auth-password', 'testpass123')
await page.click('button[type="submit"]')
await page.waitForTimeout(8000)
console.log(`Final URL: ${page.url()}`)
await browser.close()
