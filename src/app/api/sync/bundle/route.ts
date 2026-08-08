/**
 * GET  /api/sync/bundle  → { entries: BundleEntry[] }
 * PUT  /api/sync/bundle  body { entries: BundleEntry[] } → { entries: BundleEntry[] }
 *
 * Auth required. Replaces the user's entire bundle on PUT.
 *
 * BundleEntry shape (matches src/hooks/use-bundle.ts):
 *   { id, level?, name?, category?, opts?, addedAt }
 *
 * Stored as one document per artifact under users/{uid}/bundle, keyed by
 * artifact id, with opts as a nested map — Firestore stores structured
 * values natively, so the JSON-string encoding the Postgres column needed
 * is gone.
 *
 * `opts` is present only for effects. Both this route and `getBundle`
 * accept the legacy `effectId` key so a client that has not reloaded since
 * the bundle became artifact-wide does not have its bundle rejected.
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
import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'

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

/** Trim an untrusted display string, or drop it. */
function sanitizeText(v: unknown, max = 200): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim().slice(0, max)
  return trimmed || undefined
}

function sanitizeEntry(v: unknown): BundleEntry | null {
  if (!v || typeof v !== 'object') return null
  const e = v as Record<string, unknown>

  // `?? e.effectId` accepts payloads from clients running the pre-ladder
  // bundle. Those are still in the wild in open tabs and service-worker
  // caches, and rejecting them would silently wipe a bundle on next sync.
  const id = sanitizeText(e.id ?? e.effectId)
  if (!id) return null

  const level = ARTIFACT_LEVELS.includes(e.level as ArtifactLevel)
    ? (e.level as ArtifactLevel)
    : undefined

  // Absent opts is now valid — it is what every non-effect entry looks
  // like. Only a *malformed* opts object is a reason to reject the row.
  let opts: BundleOpts | undefined
  if (e.opts !== undefined && e.opts !== null) {
    const parsed = sanitizeOpts(e.opts)
    if (!parsed) return null
    opts = parsed
  }

  let addedAt = typeof e.addedAt === 'string' ? e.addedAt : ''
  // Validate ISO string; fall back to now() if invalid.
  if (!addedAt || Number.isNaN(Date.parse(addedAt))) {
    addedAt = new Date().toISOString()
  }

  return {
    id,
    level,
    name: sanitizeText(e.name),
    category: sanitizeText(e.category, 100),
    opts,
    addedAt,
  }
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

  // Sanitize + dedupe by artifact id (last write wins).
  const byId = new Map<string, BundleEntry>()
  for (const raw of entries) {
    const entry = sanitizeEntry(raw)
    if (!entry) continue
    byId.set(entry.id, entry)
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
