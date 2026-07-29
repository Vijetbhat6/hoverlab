/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Always returns 200, even if the user was
 * already logged out — idempotent.
 */

import { NextResponse } from 'next/server'
import { buildExpiredSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ message: 'Signed out.' })
  res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  return res
}
