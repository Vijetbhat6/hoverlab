/**
 * Drives the real sign-in flow in a browser.
 *
 * Two cases, because the failure that prompted this script only appears in
 * the second one:
 *
 *  1. clean   — no cookies, straight sign-in from /login.
 *  2. stale   — the browser holds a cryptographically valid session cookie
 *               whose user row no longer exists (dev DB reset, deleted
 *               account). proxy.ts trusts the signature, so it used to bounce
 *               /login → /library forever while the header still said
 *               "Sign in". /api/auth/me now expires the dead cookie, which is
 *               what this case asserts.
 *
 * Usage:  node scripts/test-login-ui.mjs
 *         EMAIL=... PASSWORD=... node scripts/test-login-ui.mjs
 */

import { chromium } from 'playwright'
import { SignJWT } from 'jose'
import { readFileSync } from 'node:fs'

// Must be `localhost`, not 127.0.0.1: Next dev rejects unlisted origins via
// allowedDevOrigins, which blocks the client bundle and prevents hydration.
const BASE = process.env.BASE ?? 'http://localhost:3002'
const EMAIL = process.env.EMAIL ?? 'logintest@hoverlab.dev'
const PASSWORD = process.env.PASSWORD ?? 'testpassword123'

// Provision the account the run signs in with, so the script works against a
// freshly reset database. Idempotent: a 409 means it already exists, which is
// the steady state on every run after the first.
{
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Login Test' }),
  })
  if (!res.ok && res.status !== 409) {
    console.error(`could not provision ${EMAIL}: ${res.status}`)
    process.exit(1)
  }
}

/** Mint a session cookie for a user id that was never in the database. */
async function ghostToken() {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const secret = (env.match(/^AUTH_SECRET=(.*)$/m)?.[1] ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    sub: 'ghost-user-does-not-exist',
    email: 'ghost@example.com',
    name: null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(new TextEncoder().encode(secret))
}

const browser = await chromium.launch()
let failures = 0

for (const scenario of ['clean', 'stale']) {
  const ctx = await browser.newContext()

  if (scenario === 'stale') {
    await ctx.addCookies([
      {
        name: 'cssfx:session',
        value: await ghostToken(),
        domain: 'localhost',
        path: '/',
      },
    ])
  }

  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`)
  })

  // Enter the way a real user does — land on the app, then use the header's
  // "Sign in" button. Going straight to /login would skip the bounce.
  await page.goto(`${BASE}/library`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.getByRole('link', { name: /sign in/i }).first().click()
  await page
    .waitForURL((u) => u.pathname === '/login', { timeout: 30_000 })
    .catch(() => {})

  const reachedForm = await page
    .locator('#auth-email')
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false)

  let finalUrl = page.url()
  let banner = '(none)'

  if (reachedForm) {
    await page.fill('#auth-email', EMAIL)
    await page.fill('#auth-password', PASSWORD)
    await page.click('button[type="submit"]')
    // Wait for the redirect rather than a fixed sleep — on a cold dev server
    // the destination route still has to compile, which can exceed 3s.
    await page
      .waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 })
      .catch(() => {})
    await page.waitForTimeout(1500)
    finalUrl = page.url()
    banner =
      (await page.locator('[data-slot="alert"]').allTextContents())
        .filter(Boolean)
        .join(' | ') || '(none)'
  }

  const signedIn = await page
    .evaluate(() => fetch('/api/auth/me').then((r) => r.json()))
    .then((d) => Boolean(d.user))
    .catch(() => false)

  const ok = reachedForm && signedIn && banner === '(none)'
  if (!ok) failures++

  console.log(`[${scenario}] ${ok ? 'PASS' : 'FAIL'}`)
  console.log(`  reached login form: ${reachedForm}`)
  console.log(`  final URL:          ${finalUrl}`)
  console.log(`  signed in after:    ${signedIn}`)
  console.log(`  error banner:       ${banner}`)
  console.log(
    `  console errors:     ${errors.length ? errors.slice(0, 3).join(' | ') : '(none)'}`,
  )

  await ctx.close()
}

await browser.close()
process.exit(failures ? 1 : 0)
