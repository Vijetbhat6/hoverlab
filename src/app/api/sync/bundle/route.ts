/**
 * GET  /api/sync/bundle  → { entries: BundleEntry[] }
 * PUT  /api/sync/bundle  body { entries: BundleEntry[] } → { entries: BundleEntry[] }
 *
 * Auth required. Replaces the user's entire bundle on PUT.
 *
 * BundleEntry shape (matches src/hooks/use-bundle.ts):
 *   { effectId: string, opts: { hue, saturation, scale, speed }, addedAt: ISO string }
 *
 * Stored as one document per effect under users/{uid}/bundle, keyed by
 * effect id, with opts as a nested map — Firestore stores structured values
 * natively, so the JSON-string encoding the Postgres column needed is gone.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { getEntitlements, bundleLimit } from '@/lib/billing/entitlements'
import {
  getBundle,
  replaceBundle,
  type BundleEntry,
  type BundleOpts,
} from '@/lib/firebase/sync'

export const runtime = 'nodejs'

const MAX_BUNDLE = 1000

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

async function handleGet() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  return NextResponse.json({ entries: await getBundle(user.id) })
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
  let clean = [...byId.values()]

  /* ---------------- Plan limit ----------------
   * "Unlimited bundle size" is what Pro is sold on, so the free cap has
   * to be real — enforced here rather than in the client, which a user
   * can trivially edit. Over-cap syncs are truncated to the newest
   * entries rather than rejected outright: the alternative is a user
   * silently losing their whole cloud bundle because they added an 11th
   * effect offline.
   */
  const ent = await getEntitlements(user.id)
  const limit = bundleLimit(ent)
  let truncated = false
  if (clean.length > limit) {
    clean = [...clean]
      .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
      .slice(0, limit)
    truncated = true
  }

  await replaceBundle(user.id, clean)


  return NextResponse.json({
    entries: clean,
    // The client surfaces an upgrade prompt when this comes back true.
    truncated,
    limit: Number.isFinite(limit) ? limit : null,
  })
}

export const GET = withJsonErrors('sync/bundle', handleGet)
export const PUT = withJsonErrors('sync/bundle', handlePut)
