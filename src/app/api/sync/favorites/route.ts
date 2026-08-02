/**
 * GET  /api/sync/favorites  → { favorites: string[] }
 * PUT  /api/sync/favorites  body { favorites: string[] } → { favorites: string[] }
 *
 * Auth required. Replaces the user's entire favorites list on PUT.
 * Stored as one document per effect under users/{uid}/favorites, so the
 * effect id is the key and syncing the same effect twice cannot duplicate it.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { getFavorites, replaceFavorites } from '@/lib/firebase/sync'

export const runtime = 'nodejs'

const MAX_FAVORITES = 5000

async function handleGet() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  return NextResponse.json({ favorites: await getFavorites(user.id) })
}

async function handlePut(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { favorites } = (body ?? {}) as { favorites?: unknown }
  if (!Array.isArray(favorites)) {
    return NextResponse.json(
      { error: '`favorites` must be an array of effect IDs.' },
      { status: 400 },
    )
  }

  // Sanitize: keep unique non-empty strings, cap the count.
  const seen = new Set<string>()
  const clean: string[] = []
  for (const id of favorites) {
    if (typeof id !== 'string') continue
    const trimmed = id.trim().slice(0, 200)
    if (!trimmed) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    clean.push(trimmed)
    if (clean.length >= MAX_FAVORITES) break
  }

  await replaceFavorites(user.id, clean)
  return NextResponse.json({ favorites: clean })
}

export const GET = withJsonErrors('sync/favorites', handleGet)
export const PUT = withJsonErrors('sync/favorites', handlePut)
