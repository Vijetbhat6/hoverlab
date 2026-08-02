import { chromium } from 'playwright'

// Must be `localhost`, not 127.0.0.1: Next dev rejects unlisted origins via
// allowedDevOrigins, which blocks the client bundle and prevents hydration.
const BASE = process.env.BASE ?? 'http://localhost:3002'
const email = `uitest+${process.argv[2] ?? 'x'}@hoverlab.dev`

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`)
})

await page.goto(`${BASE}/signup`)
// Clicking before React hydrates makes the browser submit the form natively,
// which silently no-ops. Wait for the client bundle to attach first.
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1500)
await page.fill('#auth-name', 'UI Test')
await page.fill('#auth-email', email)
await page.fill('#auth-password', 'testpass123')
await page.click('button[type="submit"]')
// Wait for the post-signup redirect rather than a fixed sleep — on a cold dev
// server the destination route still has to compile, which can exceed 3s.
await page
  .waitForURL((u) => !u.pathname.startsWith('/signup'), { timeout: 30_000 })
  .catch(() => {})

console.log('email:      ', email)
console.log('final URL:  ', page.url())

// The inline <Alert variant="destructive"> in auth-form.tsx is the exact
// element that read "Sign up failed" in the bug report, so assert on its
// absence rather than on the URL alone.
const banner = await page.locator('[data-slot="alert"]').allTextContents()
console.log('error banner:', banner.filter(Boolean).join(' | ') || '(none)')
console.log('console errors:', errors.length ? errors.slice(0, 3).join(' | ') : '(none)')

await browser.close()
