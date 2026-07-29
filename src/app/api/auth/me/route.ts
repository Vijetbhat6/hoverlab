/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile, or
 * { user: null } if not logged in. Used by the client-side AuthProvider
 * on mount to hydrate the session.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ user })
}
