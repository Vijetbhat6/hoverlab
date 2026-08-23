/**
 * Drives the real sign-in flow in a browser, against Firebase Auth.
 *
 * Three cases, because each has broken in its own way:
 *
 *  1. signup  — create a fresh account, land signed in.
 *  2. clean   — sign out, sign back in with the same credentials.
 *  3. stale   — the browser holds a session cookie that no longer verifies
 *               (a different Firebase project, a revoked session, a deleted
 *               account). proxy.ts sees a cookie and treats the visitor as
 *               signed in, so /login used to bounce to /library forever while
 *               the header still offered "Sign in". /api/auth/me expires the
 *               dead cookie, which is what this case asserts.
 *
 * Each run creates a throwaway account and deletes it afterwards, so the
 * project does not accumulate test users.
 *
 * Usage:  node scripts/test-login-ui.mjs
 */

import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'

// Must be `localhost`, not 127.0.0.1: Next dev rejects unlisted origins via
// allowedDevOrigins, which blocks the client bundle and prevents hydration.
const BASE = process.env.BASE ?? 'http://localhost:3007'
const EMAIL = process.env.EMAIL ?? `uitest-${process.pid}@hoverlab.dev`
const PASSWORD = process.env.PASSWORD ?? 'testpassword123'

let failures = 0
const check = (name, pass, detail = '') => {
  if (!pass) failures++
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()

/** Fill the form on /login or /signup and submit it. */
async function submitAuthForm(page, { signup }) {
  await page.goto(`${BASE}${signup ? '/signup' : '/login'}`)
  await page.waitForLoadState('networkidle')
  // Clicking before React hydrates makes the browser submit natively, which
  // silently no-ops. Wait for the client bundle to attach first.
  await page.waitForTimeout(1500)
  if (signup) await page.fill('#auth-name', 'UI Test')
  await page.fill('#auth-email', EMAIL)
  await page.fill('#auth-password', PASSWORD)
  await page.click('button[type="submit"]')
  await page
    .waitForURL((u) => !/\/(login|signup)$/.test(u.pathname), { timeout: 45_000 })
    .catch(() => {})
  await page.waitForTimeout(1500)
}

async function signedIn(page) {
  return page
    .evaluate(() => fetch('/api/auth/me').then((r) => r.json()))
    .then((d) => Boolean(d.user))
    .catch(() => false)
}

async function banner(page) {
  const text = await page.locator('[data-slot="alert"]').allTextContents()
  return text.filter(Boolean).join(' | ') || '(none)'
}

/* ---------- 1. sign up ---------- */
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await submitAuthForm(page, { signup: true })
  check('signup creates an account and signs in', await signedIn(page))
  check('no error banner on signup', (await banner(page)) === '(none)', await banner(page))
  await ctx.close()
}

/* ---------- 2. clean sign-in ---------- */
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await submitAuthForm(page, { signup: false })
  check('signs in with those credentials', await signedIn(page))
  check('no error banner on sign-in', (await banner(page)) === '(none)', await banner(page))
  await ctx.close()
}

/* ---------- 3. stale cookie ---------- */
{
  const ctx = await browser.newContext()
  // A syntactically plausible cookie this project can never verify.
  await ctx.addCookies([
    {
      name: 'cssfx:session',
      value: 'stale.session.cookie-from-another-project',
      domain: 'localhost',
      path: '/',
    },
  ])
  const page = await ctx.newPage()

  // Enter the way a real user does — land on the app, then use the header's
  // "Sign in" button. Going straight to /login would skip the bounce.
  await page.goto(`${BASE}/library`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  await page.getByRole('link', { name: /sign in/i }).first().click()
  await page.waitForURL((u) => u.pathname === '/login', { timeout: 30_000 }).catch(() => {})

  const reachedForm = await page
    .locator('#auth-email')
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false)
  check('a stale cookie does not trap the user away from /login', reachedForm)

  if (reachedForm) {
    await page.fill('#auth-email', EMAIL)
    await page.fill('#auth-password', PASSWORD)
    await page.click('button[type="submit"]')
    await page
      .waitForURL((u) => u.pathname !== '/login', { timeout: 45_000 })
      .catch(() => {})
    await page.waitForTimeout(1500)
    check('signs in despite the stale cookie', await signedIn(page))
  }
  await ctx.close()
}

/* ---------- 4. wrong password still reported plainly ---------- */
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  await page.fill('#auth-email', EMAIL)
  await page.fill('#auth-password', 'definitely-the-wrong-password')
  await page.click('button[type="submit"]')
  await page.waitForSelector('[data-slot="alert"]', { timeout: 30_000 }).catch(() => {})
  const message = await banner(page)
  check(
    'a wrong password says so, rather than a generic failure',
    /invalid email or password/i.test(message),
    message,
  )
  await ctx.close()
}

await browser.close()

// Clean up the throwaway account so repeat runs do not accumulate users.
try {
  execFileSync(process.execPath, ['scripts/users.mjs', 'delete', EMAIL], {
    stdio: 'ignore',
  })
} catch {
  console.warn(`(could not delete the test account ${EMAIL} — remove it manually)`)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
