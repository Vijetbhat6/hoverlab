/**
 * Drives the whole password reset flow in a browser, end to end:
 *
 *   /forgot-password → link from the emailed message → /reset-password →
 *   sign in with the new password
 *
 * and asserts the parts that are easy to get silently wrong:
 *
 *   - the old password stops working
 *   - a session created before the reset is revoked, not just cookie-cleared
 *   - the link is single-use
 *   - an unknown address answers exactly like a known one (no enumeration)
 *
 * With no RESEND_API_KEY set, lib/mail.ts prints the message to the dev
 * server's console instead of sending it, so the reset link is read back out
 * of dev.log — the same way you'd grab it by eye while developing.
 *
 * Setup and teardown write the account's password hash through Prisma rather
 * than through the flow: /api/auth/forgot-password is rate limited per
 * address, and spending that budget on fixtures makes repeat runs fail on
 * 429 rather than on anything real.
 *
 * Usage:  node scripts/test-reset-ui.mjs
 */

import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'

// Must be `localhost`, not 127.0.0.1: Next dev rejects unlisted origins via
// allowedDevOrigins, which blocks the client bundle and prevents hydration.
const BASE = process.env.BASE ?? 'http://localhost:3002'
const LOG = process.env.DEV_LOG ?? 'dev.log'
const EMAIL = process.env.EMAIL ?? 'resettest@hoverlab.dev'
const OLD_PASSWORD = 'oldpassword123'
const NEW_PASSWORD = 'newpassword456'

const db = new PrismaClient({ log: ['error'] })
const checks = []
const check = (name, pass, detail = '') => {
  checks.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const api = (path, init) =>
  fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

const signIn = (email, password) =>
  api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

/** Put the account in a known state without touching the reset endpoints. */
async function resetFixture() {
  const passwordHash = await bcrypt.hash(OLD_PASSWORD, 10)
  await db.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: 'Reset Test', passwordHash },
    update: { passwordHash, sessionsValidFrom: null },
  })
}

/** Ask for a link, then read it back out of the dev server's console log. */
async function requestLink() {
  const before = readFileSync(LOG, 'utf8').length
  const res = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL }),
  })
  if (!res.ok) throw new Error(`forgot-password failed: ${res.status}`)
  const body = await res.json()

  // The route answers before the log line is necessarily flushed.
  for (let i = 0; i < 40; i++) {
    const tail = readFileSync(LOG, 'utf8').slice(before)
    const match = tail.match(/\/reset-password\?token=([\w-]+)/)
    if (match) return { token: decodeURIComponent(match[1]), body }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`no reset link found in ${LOG} — is RESEND_API_KEY set?`)
}

console.log('setting up…')
await resetFixture()

// A session minted *before* the reset, to prove the reset revokes it rather
// than only clearing the cookie in the browser doing the reset.
const preResetLogin = await signIn(EMAIL, OLD_PASSWORD)
const preResetCookie = (preResetLogin.headers.get('set-cookie') ?? '').split(';')[0]
check('signs in with the old password', preResetLogin.status === 200)

console.log('\nrequesting a link:')
const { token, body: knownBody } = await requestLink()
const unknown = await api('/api/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email: 'definitely-not-registered@hoverlab.dev' }),
})
check(
  'unknown address answers exactly like a registered one',
  unknown.status === 200 &&
    JSON.stringify(await unknown.json()) === JSON.stringify(knownBody),
)

console.log('\nbrowser flow:')
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`)
})

await page.goto(`${BASE}/reset-password?token=${encodeURIComponent(token)}`)
await page.waitForLoadState('networkidle')
const formShown = await page
  .locator('#new-password')
  .waitFor({ state: 'visible', timeout: 45_000 })
  .then(() => true)
  .catch(() => false)
check(
  'valid link shows the new-password form',
  formShown,
  formShown ? '' : `page said: ${(await page.locator('h1, h2, [data-slot="card-title"]').allTextContents()).join(' / ') || '(nothing)'}`,
)

if (formShown) {
  await page.fill('#new-password', NEW_PASSWORD)
  await page.fill('#confirm-password', 'something-else')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(500)
  const mismatch = (await page.locator('[data-slot="alert"]').allTextContents()).join(' ')
  check('mismatched confirmation is rejected client-side', /do not match/i.test(mismatch))

  await page.fill('#confirm-password', NEW_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === '/login', { timeout: 45_000 }).catch(() => {})
  check('lands on /login after reset', new URL(page.url()).pathname === '/login')

  console.log('\nafter the reset:')
  check('old password no longer works', (await signIn(EMAIL, OLD_PASSWORD)).status === 401)
  check('new password works', (await signIn(EMAIL, NEW_PASSWORD)).status === 200)

  const preResetMe = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: preResetCookie },
  }).then((r) => r.json())
  check('session issued before the reset is revoked', preResetMe.user === null)

  const reuse = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: 'yetanotherpassword' }),
  })
  check('reset link is single-use', reuse.status === 400)
  check(
    'the replayed link changed nothing',
    (await signIn(EMAIL, NEW_PASSWORD)).status === 200,
  )
}

console.log('\nrequest page:')
await page.goto(`${BASE}/forgot-password`)
await page.waitForLoadState('networkidle')
await page.fill('#auth-email', EMAIL)
await page.click('button[type="submit"]')
const sentShown = await page
  .getByText(/check your email/i)
  .waitFor({ state: 'visible', timeout: 45_000 })
  .then(() => true)
  .catch(() => false)
check('/forgot-password confirms the link was sent', sentShown)

console.log('\ndead link:')
await page.goto(`${BASE}/reset-password?token=not-a-real-token`)
await page.waitForLoadState('networkidle')
const deadShown = await page
  .getByText(/this link doesn't work/i)
  .waitFor({ state: 'visible', timeout: 45_000 })
  .then(() => true)
  .catch(() => false)
check('bad token shows the expired-link screen', deadShown)
check('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()
await resetFixture()
await db.$disconnect()

const failed = checks.filter((c) => !c.pass)
console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
process.exit(failed.length ? 1 : 0)
