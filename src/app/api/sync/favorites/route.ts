/**
 * GET  /api/sync/favorites  → { favorites: string[] }
 * PUT  /api/sync/favorites  body { favorites: string[] } → { favorites: string[] }
 *
 * Auth required. Replaces the user's entire favorites list on PUT.
 * Favorites are stored as one UserFavorite row per effectId; we use
 * upserts inside a transaction so the operation is atomic.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'

const MAX_FAVORITES = 5000

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const rows = await db.userFavorite.findMany({
    where: { userId: user.id },
    select: { effectId: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ favorites: rows.map((r) => r.effectId) })
}

export async function PUT(req: Request) {
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

  // Wipe + re-insert in a transaction so concurrent reads always see a
  // consistent state. SQLite serializes writes anyway, but this also
  // keeps the pruning + insert pair atomic.
  // (SQLite doesn't support `skipDuplicates` on createMany, but we already
  // dedupe above so it isn't needed.)
  await db.$transaction([
    db.userFavorite.deleteMany({ where: { userId: user.id } }),
    db.userFavorite.createMany({
      data: clean.map((effectId) => ({ userId: user.id, effectId })),
    }),
  ])

  return NextResponse.json({ favorites: clean })
}
