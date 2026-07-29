/**
 * GET  /api/sync/bundle  → { entries: BundleEntry[] }
 * PUT  /api/sync/bundle  body { entries: BundleEntry[] } → { entries: BundleEntry[] }
 *
 * Auth required. Replaces the user's entire bundle on PUT.
 *
 * BundleEntry shape (matches src/hooks/use-bundle.ts):
 *   { effectId: string, opts: { hue, saturation, scale, speed }, addedAt: ISO string }
 *
 * We store the opts as a JSON string in SQLite (no native JSON column).
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'

const MAX_BUNDLE = 1000

interface BundleOpts {
  hue: number
  saturation: number
  scale: number
  speed: number
}
interface BundleEntry {
  effectId: string
  opts: BundleOpts
  addedAt: string
}

function sanitizeOpts(v: unknown): BundleOpts | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const num = (k: string, fallback: number): number => {
    const n = o[k]
    return typeof n === 'number' && Number.isFinite(n) ? n : fallback
  }
  return {
    hue: num('hue', 0),
    saturation: num('saturation', 0),
    scale: num('scale', 1),
    speed: num('speed', 1),
  }
}

function sanitizeEntry(v: unknown): BundleEntry | null {
  if (!v || typeof v !== 'object') return null
  const e = v as Record<string, unknown>
  const effectId = typeof e.effectId === 'string' ? e.effectId.trim().slice(0, 200) : ''
  if (!effectId) return null
  const opts = sanitizeOpts(e.opts)
  if (!opts) return null
  let addedAt = typeof e.addedAt === 'string' ? e.addedAt : ''
  // Validate ISO string; fall back to now() if invalid.
  if (!addedAt || Number.isNaN(Date.parse(addedAt))) {
    addedAt = new Date().toISOString()
  }
  return { effectId, opts, addedAt }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const rows = await db.userBundleEntry.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: 'desc' },
  })

  const entries: BundleEntry[] = rows.map((r) => {
    let opts: BundleOpts = { hue: 0, saturation: 0, scale: 1, speed: 1 }
    try {
      const parsed = JSON.parse(r.opts) as unknown
      const safe = sanitizeOpts(parsed)
      if (safe) opts = safe
    } catch {
      /* leave defaults */
    }
    return {
      effectId: r.effectId,
      opts,
      addedAt: r.addedAt.toISOString(),
    }
  })

  return NextResponse.json({ entries })
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

  const { entries } = (body ?? {}) as { entries?: unknown }
  if (!Array.isArray(entries)) {
    return NextResponse.json(
      { error: '`entries` must be an array.' },
      { status: 400 },
    )
  }

  // Sanitize + dedupe by effectId (last write wins).
  const byId = new Map<string, BundleEntry>()
  for (const raw of entries) {
    const entry = sanitizeEntry(raw)
    if (!entry) continue
    byId.set(entry.effectId, entry)
    if (byId.size >= MAX_BUNDLE) break
  }
  const clean = [...byId.values()]

  await db.$transaction([
    db.userBundleEntry.deleteMany({ where: { userId: user.id } }),
    db.userBundleEntry.createMany({
      data: clean.map((entry) => ({
        userId: user.id,
        effectId: entry.effectId,
        opts: JSON.stringify(entry.opts),
        addedAt: new Date(entry.addedAt),
      })),
    }),
  ])

  return NextResponse.json({ entries: clean })
}
